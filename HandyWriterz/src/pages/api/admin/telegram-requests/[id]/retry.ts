import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { TelegramRetryService } from '@/services/telegramRetryService';
import { StorageService } from '@/services/storageService';
import { TelegramBotService } from '@/services/telegramBotService';

const prisma = new PrismaClient();

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
      case 'POST':
        return handlePost(req, res);
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    logger.error('Admin telegram retry error', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      error: 'Invalid request ID',
      code: 'INVALID_REQUEST'
    });
  }

  try {
    // Get request details
    const request = await prisma.aiScore.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        error: 'Request not found',
        code: 'NOT_FOUND'
      });
    }

    // Check if request is in a state that can be retried
    if (request.status === 'COMPLETED') {
      return res.status(400).json({
        error: 'Request is already completed',
        code: 'INVALID_STATE'
      });
    }

    // Get file from storage
    const fileKey = request.metadata?.fileKey as string;
    if (!fileKey) {
      return res.status(400).json({
        error: 'File key not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    const { buffer, metadata } = await StorageService.getFile(fileKey);

    // Reset retry count and status
    await prisma.aiScore.update({
      where: { id },
      data: {
        retryCount: 0,
        telegramStatus: 'PENDING',
        telegramError: null,
        updatedAt: new Date()
      }
    });

    // Retry sending to Telegram
    await TelegramBotService.sendDocument(
      buffer,
      metadata.originalName || 'document',
      request.id
    );

    logger.info('Admin initiated retry for telegram request', {
      requestId: id,
      adminId: req.session?.user?.id
    });

    return res.status(200).json({
      success: true,
      message: 'Retry initiated successfully'
    });
  } catch (error) {
    logger.error('Failed to retry telegram request', {
      error,
      requestId: id
    });
    throw error;
  }
}
