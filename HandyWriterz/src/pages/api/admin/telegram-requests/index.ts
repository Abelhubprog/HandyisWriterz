import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const prisma = new PrismaClient();

// Query parameters schema
const QuerySchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

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
        return handleGet(req, res);
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    logger.error('Admin telegram requests error', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate and parse query parameters
    const queryResult = QuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        code: 'INVALID_QUERY',
        details: queryResult.error.errors
      });
    }

    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = queryResult.data;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { userId: { contains: search } },
        { orderId: { contains: search } }
      ];
    }

    // Get total count
    const total = await prisma.aiScore.count({ where });

    // Get paginated results
    const requests = await prisma.aiScore.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
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

    // Map results to remove sensitive information
    const mappedRequests = requests.map(request => ({
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
    }));

    return res.status(200).json({
      requests: mappedRequests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to fetch telegram requests', { error });
    throw error;
  }
}
