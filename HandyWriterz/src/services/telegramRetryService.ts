import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import { telegramConfig } from '../config/telegram';
import { TelegramBotService } from './telegramBotService';
import { StorageService } from './storageService';

const prisma = new PrismaClient();

interface AiScoreRequest {
  id: string;
  retryCount: number;
  telegramStatus: string;
  updatedAt: Date;
  fileKey: string;
  fileName?: string;
}

interface TurnitinRequest {
  id: string;
  retryCount: number;
  telegramStatus: string;
  updatedAt: Date;
  fileKey: string;
  fileName?: string;
}

export class TelegramRetryService {
  static async processFailedRequests(): Promise<void> {
    try {
      // Find failed AI Score requests
      const failedAiScores = await prisma.aiScore.findMany({
        where: {
          telegramStatus: 'FAILED',
          retryCount: {
            lt: telegramConfig.maxRetries
          }
        },
        orderBy: {
          updatedAt: 'asc'
        },
        take: 10
      });

      // Find failed Turnitin requests
      const failedTurnitinRequests = await prisma.turnitinCheck.findMany({
        where: {
          telegramStatus: 'FAILED',
          retryCount: {
            lt: telegramConfig.maxRetries
          }
        },
        orderBy: {
          updatedAt: 'asc'
        },
        take: 10
      });

      // Process AI Score retries
      for (const request of failedAiScores) {
        await this.retryAiScoreRequest(request as AiScoreRequest);
      }

      // Process Turnitin retries
      for (const request of failedTurnitinRequests) {
        await this.retryTurnitinRequest(request as TurnitinRequest);
      }
    } catch (error) {
      logger.error('Error processing retry queue:', error);
      throw error;
    }
  }

  private static async retryAiScoreRequest(request: AiScoreRequest): Promise<void> {
    try {
      // Increment retry count and update status
      await prisma.aiScore.update({
        where: { id: request.id },
        data: {
          retryCount: { increment: 1 },
          telegramStatus: 'RETRY',
          updatedAt: new Date()
        }
      });

      // Get the original file from storage
      const fileData = await StorageService.getFile(request.fileKey);

      // Retry sending to Telegram
      await TelegramBotService.sendDocument(
        fileData.buffer,
        request.fileName || 'document.pdf',
        request.id
      );

      // Mark as successful
      await prisma.aiScore.update({
        where: { id: request.id },
        data: {
          telegramStatus: 'SENT',
          updatedAt: new Date()
        }
      });

      logger.info('Successfully retried AI Score Telegram request', {
        requestId: request.id,
        retryCount: request.retryCount + 1
      });
    } catch (error) {
      logger.error('Failed to retry AI Score request:', {
        requestId: request.id,
        error
      });

      // Mark as failed if max retries reached
      if (request.retryCount + 1 >= telegramConfig.maxRetries) {
        await prisma.aiScore.update({
          where: { id: request.id },
          data: {
            telegramStatus: 'FAILED_PERMANENT',
            telegramError: error instanceof Error ? error.message : String(error),
            updatedAt: new Date()
          }
        });
      }

      throw error;
    }
  }

  private static async retryTurnitinRequest(request: TurnitinRequest): Promise<void> {
    try {
      // Increment retry count and update status
      await prisma.turnitinCheck.update({
        where: { id: request.id },
        data: {
          retryCount: { increment: 1 },
          telegramStatus: 'RETRY',
          updatedAt: new Date()
        }
      });

      // Get the original file from storage
      const fileData = await StorageService.getFile(request.fileKey);

      // Retry sending to Telegram
      await TelegramBotService.sendDocument(
        fileData.buffer,
        request.fileName || 'document.pdf',
        request.id
      );

      // Mark as successful
      await prisma.turnitinCheck.update({
        where: { id: request.id },
        data: {
          telegramStatus: 'SENT',
          updatedAt: new Date()
        }
      });

      logger.info('Successfully retried Turnitin Telegram request', {
        requestId: request.id,
        retryCount: request.retryCount + 1
      });
    } catch (error) {
      logger.error('Failed to retry Turnitin request:', {
        requestId: request.id,
        error
      });

      // Mark as failed if max retries reached
      if (request.retryCount + 1 >= telegramConfig.maxRetries) {
        await prisma.turnitinCheck.update({
          where: { id: request.id },
          data: {
            telegramStatus: 'FAILED_PERMANENT',
            telegramError: error instanceof Error ? error.message : String(error),
            updatedAt: new Date()
          }
        });
      }

      throw error;
    }
  }

  // Implementation of the scheduleRetry method
  static async scheduleRetry(requestId: string, error: Error): Promise<void> {
    const request = await prisma.aiScore.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Request not found');
    }

    await prisma.aiScore.update({
      where: { id: requestId },
      data: {
        telegramStatus: 'FAILED',
        telegramError: error.message,
        updatedAt: new Date()
      }
    });

    logger.info(`Scheduled retry for request ${requestId}`);
  }
}
