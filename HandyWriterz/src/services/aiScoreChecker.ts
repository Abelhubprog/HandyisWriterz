import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { NotificationService } from './notificationService';
import { createCharge } from './paymentService';
import { TelegramBotService } from './telegramBotService';

const prisma = new PrismaClient();

const PRICE_GBP = 5;

// Input validation schemas
const ScoreInputSchema = z.object({
  userId: z.string().min(1),
  orderId: z.string().min(1),
  content: z.string().min(1),
  fileUrl: z.string().url().optional(),
  chargeId: z.string().optional(),
  fileBuffer: z.instanceof(Buffer),
  fileName: z.string()
});

export interface AiScoreResult {
  score: number;
  analysis: {
    grammarScore: number;
    plagiarismScore: number;
    coherenceScore: number;
    suggestions: string[];
    aiReportUrl?: string;
    plagiarismReportUrl?: string;
  };
  paymentRequired?: boolean;
  chargeUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export class AiScoreChecker {
  static async checkScore(input: z.infer<typeof ScoreInputSchema>): Promise<AiScoreResult> {
    try {
      // Validate input
      const validatedInput = ScoreInputSchema.parse(input);

      // Check if user and order exist
      const [user, order] = await Promise.all([
        prisma.user.findUnique({ where: { id: validatedInput.userId } }),
        prisma.order.findUnique({ where: { id: validatedInput.orderId } })
      ]);

      if (!user || !order) {
        throw new Error('User or order not found');
      }

      // Check for existing paid score
      const existingScore = await prisma.aiScore.findFirst({
        where: {
          userId: validatedInput.userId,
          orderId: validatedInput.orderId,
          status: 'COMPLETED',
          metadata: {
            path: ['paymentStatus'],
            equals: 'PAID'
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (existingScore) {
        logger.info('Using existing paid AI score', { 
          userId: validatedInput.userId, 
          orderId: validatedInput.orderId 
        });
        return {
          score: existingScore.score,
          analysis: existingScore.analysis as AiScoreResult['analysis'],
          status: 'COMPLETED'
        };
      }

      // If no chargeId provided, create a new payment
      if (!validatedInput.chargeId) {
        const charge = await createCharge({
          amount: PRICE_GBP,
          currency: 'GBP',
          name: 'AI Score Check',
          description: 'AI-powered content analysis and scoring',
          metadata: {
            userId: validatedInput.userId,
            orderId: validatedInput.orderId
          }
        });

        return {
          score: 0,
          analysis: {
            grammarScore: 0,
            plagiarismScore: 0,
            coherenceScore: 0,
            suggestions: []
          },
          paymentRequired: true,
          chargeUrl: charge.url,
          status: 'PENDING'
        };
      }

      // Create pending score entry
      const pendingScore = await prisma.aiScore.create({
        data: {
          userId: validatedInput.userId,
          orderId: validatedInput.orderId,
          score: 0,
          status: 'PENDING',
          analysis: {},
          metadata: {
            contentLength: validatedInput.content.length,
            fileUrl: validatedInput.fileUrl,
            chargeId: validatedInput.chargeId,
            paymentStatus: 'PAID',
            price: PRICE_GBP,
            currency: 'GBP'
          }
        }
      });

      // Send document to Telegram bot for processing
      await TelegramBotService.sendDocument(
        validatedInput.fileBuffer,
        validatedInput.fileName,
        pendingScore.id
      );

      // Return pending status
      return {
        score: 0,
        analysis: {
          grammarScore: 0,
          plagiarismScore: 0,
          coherenceScore: 0,
          suggestions: []
        },
        status: 'PROCESSING'
      };

    } catch (error) {
      logger.error('AI score check failed', { 
        error, 
        userId: input.userId, 
        orderId: input.orderId 
      });

      if (error instanceof z.ZodError) {
        throw new Error('Invalid input data: ' + error.errors.map(e => e.message).join(', '));
      }

      throw new Error('Failed to check AI score: ' + (error as Error).message);
    }
  }

  static async getScoreStatus(requestId: string, userId: string): Promise<AiScoreResult> {
    try {
      const score = await prisma.aiScore.findFirst({
        where: {
          id: requestId,
          userId,
          metadata: {
            path: ['paymentStatus'],
            equals: 'PAID'
          }
        }
      });

      if (!score) {
        throw new Error('Score not found');
      }

      return {
        score: score.score,
        analysis: score.analysis as AiScoreResult['analysis'],
        status: score.status
      };
    } catch (error) {
      logger.error('Failed to get score status', { error, requestId, userId });
      throw new Error('Failed to get score status');
    }
  }

  static async getScoreHistory(userId: string): Promise<AiScoreResult[]> {
    try {
      const scores = await prisma.aiScore.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          metadata: {
            path: ['paymentStatus'],
            equals: 'PAID'
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return scores.map(score => ({
        score: score.score,
        analysis: score.analysis as AiScoreResult['analysis'],
        status: score.status
      }));
    } catch (error) {
      logger.error('Failed to fetch score history', { error, userId });
      throw new Error('Failed to fetch score history');
    }
  }
}
