import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { z } from 'zod';
import { AiScoreChecker } from '@/services/aiScoreChecker';
import { logger } from '@/lib/logger';
import rateLimit from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500
});

const RequestSchema = z.object({
  requestId: z.string().min(1)
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Method check
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      });
    }

    // Rate limiting
    try {
      await limiter.check(res, 30, 'CHECK_SCORE_STATUS'); // 30 requests per minute
    } catch {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Authentication
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    // Request validation
    const validationResult = RequestSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      });
    }

    // Get score status
    const result = await AiScoreChecker.getScoreStatus(
      validationResult.data.requestId,
      session.user.id
    );

    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to check score status', {
      error,
      userId: req.query?.userId,
      requestId: req.query?.requestId
    });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}
