import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { StorageService } from '@/services/storageService';

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
      case 'DELETE':
        return handleDelete(req, res);
      case 'GET':
        return handleGet(req, res);
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    logger.error('Admin telegram request error', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
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
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        error: 'Request not found',
        code: 'NOT_FOUND'
      });
    }

    // Delete file from storage if exists
    const fileKey = request.metadata?.fileKey as string;
    if (fileKey) {
      try {
        await StorageService.deleteFile(fileKey);
      } catch (error) {
        logger.warn('Failed to delete file from storage', {
          error,
          fileKey,
          requestId: id
        });
      }
    }

    // Delete request from database
    await prisma.aiScore.delete({
      where: { id }
    });

    logger.info('Admin deleted telegram request', {
      requestId: id,
      adminId: req.session?.user?.id
    });

    return res.status(200).json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete telegram request', {
      error,
      requestId: id
    });
    throw error;
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      error: 'Invalid request ID',
      code: 'INVALID_REQUEST'
    });
  }

  try {
    const request = await prisma.aiScore.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        order: {
          select: {
            title: true
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

    // Map request to remove sensitive information
    const mappedRequest = {
      id: request.id,
      userId: request.userId,
      orderId: request.orderId,
      status: request.status,
      telegramStatus: request.telegramStatus,
      telegramError: request.telegramError,
      retryCount: request.retryCount,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      user: {
        email: request.user.email,
        name: request.user.name
      },
      order: {
        title: request.order.title
      }
    };

    return res.status(200).json({
      request: mappedRequest
    });
  } catch (error) {
    logger.error('Failed to fetch telegram request', {
      error,
      requestId: id
    });
    throw error;
  }
}
