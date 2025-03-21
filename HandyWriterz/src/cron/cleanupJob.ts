import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../services/storageService';
import { logger } from '../lib/logger';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

// Configuration
const CLEANUP_CONFIG = {
  // Remove completed requests older than 30 days
  COMPLETED_RETENTION_DAYS: 30,
  // Remove failed requests older than 7 days
  FAILED_RETENTION_DAYS: 7,
  // Maximum items to process in one batch
  BATCH_SIZE: 100,
  // Schedule to run at 2 AM every day
  CRON_SCHEDULE: '0 2 * * *'
};

export async function cleanupOldRequests() {
  const completedThreshold = subDays(new Date(), CLEANUP_CONFIG.COMPLETED_RETENTION_DAYS);
  const failedThreshold = subDays(new Date(), CLEANUP_CONFIG.FAILED_RETENTION_DAYS);

  try {
    logger.info('Starting cleanup job');

    // Find requests to clean up
    const requestsToCleanup = await prisma.aiScore.findMany({
      where: {
        OR: [
          {
            status: 'COMPLETED',
            updatedAt: {
              lt: completedThreshold
            }
          },
          {
            status: 'FAILED',
            updatedAt: {
              lt: failedThreshold
            }
          }
        ]
      },
      take: CLEANUP_CONFIG.BATCH_SIZE,
      select: {
        id: true,
        metadata: true,
        status: true
      }
    });

    logger.info(`Found ${requestsToCleanup.length} requests to clean up`);

    let successCount = 0;
    let errorCount = 0;

    // Process each request
    for (const request of requestsToCleanup) {
      try {
        // Delete file from storage if exists
        const fileKey = request.metadata?.fileKey as string;
        if (fileKey) {
          try {
            await StorageService.deleteFile(fileKey);
            logger.debug('Deleted file from storage', { fileKey });
          } catch (error) {
            logger.warn('Failed to delete file from storage', {
              error,
              fileKey,
              requestId: request.id
            });
          }
        }

        // Delete request from database
        await prisma.aiScore.delete({
          where: { id: request.id }
        });

        successCount++;
        logger.debug('Cleaned up request', {
          requestId: request.id,
          status: request.status
        });
      } catch (error) {
        errorCount++;
        logger.error('Failed to clean up request', {
          error,
          requestId: request.id
        });
      }
    }

    // Log summary
    logger.info('Cleanup job completed', {
      totalProcessed: requestsToCleanup.length,
      successCount,
      errorCount
    });

    // Update cleanup metrics
    await prisma.systemMetric.upsert({
      where: { name: 'last_cleanup_run' },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          processedCount: requestsToCleanup.length,
          successCount,
          errorCount
        })
      },
      create: {
        name: 'last_cleanup_run',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          processedCount: requestsToCleanup.length,
          successCount,
          errorCount
        })
      }
    });
  } catch (error) {
    logger.error('Cleanup job failed', { error });
    throw error;
  }
}

export function startCleanupJob() {
  logger.info('Starting cleanup job scheduler', {
    schedule: CLEANUP_CONFIG.CRON_SCHEDULE
  });

  cron.schedule(CLEANUP_CONFIG.CRON_SCHEDULE, async () => {
    try {
      await cleanupOldRequests();
    } catch (error) {
      logger.error('Scheduled cleanup job failed', { error });
    }
  });
}
