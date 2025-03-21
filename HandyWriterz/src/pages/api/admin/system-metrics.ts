import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { StorageService } from '@/services/storageService';
import { subHours } from 'date-fns';

const prisma = new PrismaClient();

async function checkSystemHealth() {
  const issues: string[] = [];
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    issues.push('Database connection error');
    status = 'unhealthy';
  }

  try {
    // Check storage connectivity
    await StorageService.validateConfig();
  } catch (error) {
    issues.push('Storage service configuration error');
    status = status === 'healthy' ? 'degraded' : status;
  }

  // Check for failed requests in the last hour
  const recentFailures = await prisma.aiScore.count({
    where: {
      status: 'FAILED',
      updatedAt: {
        gte: subHours(new Date(), 1)
      }
    }
  });

  if (recentFailures > 10) {
    issues.push('High failure rate in the last hour');
    status = status === 'healthy' ? 'degraded' : status;
  }

  // Check for long-running requests
  const stuckRequests = await prisma.aiScore.count({
    where: {
      status: 'PROCESSING',
      updatedAt: {
        lte: subHours(new Date(), 1)
      }
    }
  });

  if (stuckRequests > 0) {
    issues.push(`${stuckRequests} requests stuck in processing state`);
    status = status === 'healthy' ? 'degraded' : status;
  }

  return {
    status,
    issues,
    lastCheck: new Date().toISOString()
  };
}

async function getTelegramStats() {
  const [
    totalRequests,
    completedRequests,
    failedRequests,
    processingTimes
  ] = await Promise.all([
    prisma.aiScore.count(),
    prisma.aiScore.count({
      where: { status: 'COMPLETED' }
    }),
    prisma.aiScore.count({
      where: { status: 'FAILED' }
    }),
    prisma.aiScore.findMany({
      where: {
        status: 'COMPLETED',
        metadata: {
          path: ['processingTime'],
          not: null
        }
      },
      select: {
        metadata: true
      },
      take: 100
    })
  ]);

  const averageProcessingTime =
    processingTimes.reduce((acc, curr) => {
      return acc + (curr.metadata?.processingTime as number || 0);
    }, 0) / (processingTimes.length || 1);

  return {
    totalRequests,
    completedRequests,
    failedRequests,
    averageProcessingTime,
    successRate: totalRequests > 0 ? completedRequests / totalRequests : 0
  };
}

async function getStorageStats() {
  try {
    const files = await prisma.aiScore.findMany({
      where: {
        metadata: {
          path: ['fileKey'],
          not: null
        }
      },
      select: {
        metadata: true
      }
    });

    const totalFiles = files.length;
    const totalSize = files.reduce((acc, curr) => {
      return acc + (curr.metadata?.fileSize as number || 0);
    }, 0);

    return {
      totalFiles,
      totalSize,
      averageFileSize: totalFiles > 0 ? totalSize / totalFiles : 0
    };
  } catch (error) {
    logger.error('Failed to get storage stats', { error });
    return {
      totalFiles: 0,
      totalSize: 0,
      averageFileSize: 0
    };
  }
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

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN'
      });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        const [telegramStats, storageStats, systemHealth, lastCleanup] = await Promise.all([
          getTelegramStats(),
          getStorageStats(),
          checkSystemHealth(),
          prisma.systemMetric.findUnique({
            where: { name: 'last_cleanup_run' }
          })
        ]);

        return res.status(200).json({
          telegramStats,
          storageStats,
          systemHealth,
          lastCleanup: lastCleanup ? JSON.parse(lastCleanup.value) : null
        });

      default:
        return res.status(405).json({
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    logger.error('System metrics error', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}
