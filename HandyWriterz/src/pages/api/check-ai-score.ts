import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { z } from 'zod';
import formidable from 'formidable';
import fs from 'fs/promises';
import { AiScoreChecker } from '@/services/aiScoreChecker';
import { logger } from '@/lib/logger';
import rateLimit from '@/lib/rateLimit';
import { verifyPayment } from '@/services/paymentService';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

// Request validation schema
const RequestSchema = z.object({
  orderId: z.string().min(1),
  content: z.string().min(1),
  fileUrl: z.string().url().optional(),
  chargeId: z.string().optional()
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Method check
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      });
    }

    // Rate limiting
    try {
      await limiter.check(res, 10, 'CHECK_AI_SCORE'); // 10 requests per minute
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

    // Parse form data
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Check if we have a file
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({
        error: 'No file provided',
        code: 'FILE_REQUIRED'
      });
    }

    // Read file content
    const fileBuffer = await fs.readFile(file.filepath);

    // Request validation
    const validationResult = RequestSchema.safeParse({
      orderId: fields.orderId,
      content: fields.content,
      fileUrl: fields.fileUrl,
      chargeId: fields.chargeId
    });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors
      });
    }

    // If chargeId is provided, verify payment
    if (validationResult.data.chargeId) {
      const paymentVerified = await verifyPayment(validationResult.data.chargeId);
      if (!paymentVerified) {
        return res.status(402).json({
          error: 'Payment required or invalid',
          code: 'PAYMENT_REQUIRED'
        });
      }
    }

    // Process AI score check
    const result = await AiScoreChecker.checkScore({
      userId: session.user.id,
      orderId: validationResult.data.orderId,
      content: validationResult.data.content,
      fileUrl: validationResult.data.fileUrl,
      chargeId: validationResult.data.chargeId
    });

    // Clean up
    await fs.unlink(file.filepath);

    // If payment is required, return payment URL
    if (result.paymentRequired && result.chargeUrl) {
      return res.status(402).json({
        message: 'Payment required',
        code: 'PAYMENT_REQUIRED',
        data: {
          price: 5,
          currency: 'GBP',
          chargeUrl: result.chargeUrl
        }
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Log error
    logger.error('AI score check failed', { 
      error,
      userId: req.body?.userId,
      orderId: req.body?.orderId
    });

    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : 'An unexpected error occurred'
    });
  }
}
