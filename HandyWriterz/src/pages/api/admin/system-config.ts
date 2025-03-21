import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const prisma = new PrismaClient();

// Configuration schema
const ConfigSchema = z.object({
  maxRetries: z.number().min(1).max(10),
  completedRetentionDays: z.number().min(1).max(365),
  failedRetentionDays: z.number().min(1).max(365),
  maxFileSize: z.number().min(1).max(100) // MB
});

async function getSystemConfig() {
  const configs = await prisma.systemMetric.findMany({
    where: {
      name: {
        startsWith: 'config_'
      }
    }
  });

  const configMap: Record<string, any> = {};
  for (const config of configs) {
    const key = config.name.replace('config_', '');
    configMap[key] = JSON.parse(config.value);
  }

  return {
    maxRetries: configMap.maxRetries || 5,
    completedRetentionDays: configMap.completedRetentionDays || 30,
    failedRetentionDays: configMap.failedRetentionDays || 7,
    maxFileSize: configMap.maxFileSize || 10
  };
}

async function updateSystemConfig(config: z.infer<typeof ConfigSchema>) {
  const updates = Object.entries(config).map(([key, value]) =>
    prisma.systemMetric.upsert({
      where: { name: `config_${key}` },
      update: { value: JSON.stringify(value) },
      create: {
        name: `config_${key}`,
        value: JSON.stringify(value)
      }
    })
  );

  await Promise.all(updates);

  // Log configuration change
  logger.info('System configuration updated', { newConfig: config });

  return config;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authentication
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Forbidden - Requires SUPER_ADMIN role',
        code: 'FORBIDDEN'
      });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        const config = await getSystemConfig();
        return res.status(200).json({ config });

      case 'POST':
        // Validate request body
        const validationResult = ConfigSchema.safeParse(req.body.config);
        if (!validationResult.success) {
          return res.status(400).json({
            error: 'Invalid configuration',
            code: 'INVALID_CONFIG',
            details: validationResult.error.errors
          });
        }

        // Update configuration
        const updatedConfig = await updateSystemConfig(validationResult.data);

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'UPDATE_SYSTEM_CONFIG',
            details: JSON.stringify({
              oldConfig: await getSystemConfig(),
              newConfig: updatedConfig
            })
          }
        });

        return res.status(200).json({
          success: true,
          config: updatedConfig
        });

      default:
        return res.status(405).json({
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    logger.error('System config error', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}
