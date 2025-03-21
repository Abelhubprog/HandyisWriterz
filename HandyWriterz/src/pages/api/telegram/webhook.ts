import { NextApiRequest, NextApiResponse } from 'next';
import { TelegramBotService } from '@/services/telegramBotService';
import { logger } from '@/lib/logger';
import rateLimit from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500
});

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
      await limiter.check(res, 100, 'TELEGRAM_WEBHOOK');
    } catch {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Get signature from headers
    const signature = req.headers['x-telegram-signature'];
    if (!signature || Array.isArray(signature)) {
      return res.status(401).json({
        error: 'Missing or invalid signature',
        code: 'INVALID_SIGNATURE'
      });
    }

    // Process webhook
    await TelegramBotService.handleWebhook(req.body, signature);

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Telegram webhook error', { error });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}
