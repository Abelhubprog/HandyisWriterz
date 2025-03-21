import cron from 'node-cron';
import { TelegramRetryService } from '../services/telegramRetryService';
import { logger } from '../lib/logger';

// Run every 5 minutes
const CRON_SCHEDULE = '*/5 * * * *';

export function startTelegramRetryJob() {
  logger.info('Starting Telegram retry job');

  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      logger.info('Running Telegram retry job');
      await TelegramRetryService.processFailedRequests();
    } catch (error) {
      logger.error('Telegram retry job failed', { error });
    }
  });
}
