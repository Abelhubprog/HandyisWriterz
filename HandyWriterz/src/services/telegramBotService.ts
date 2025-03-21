import { logger } from '../lib/logger';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import FormData from 'form-data';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BOT_CHAT_ID = process.env.TELEGRAM_BOT_CHAT_ID!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;

interface TelegramResponse {
  requestId: string;
  aiScore: number;
  plagiarismScore: number;
  aiReportUrl?: string;
  plagiarismReportUrl?: string;
}

export class TelegramBotService {
  static async sendDocument(fileBuffer: Buffer, fileName: string, requestId: string): Promise<void> {
    try {
      const form = new FormData();
      form.append('document', fileBuffer, fileName);
      form.append('caption', requestId); // Send requestId as caption for tracking

      const response = await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
        form,
        {
          params: { chat_id: BOT_CHAT_ID },
          headers: { ...form.getHeaders() }
        }
      );

      if (!response.data.ok) {
        throw new Error('Failed to send document to Telegram bot');
      }

      // Update request status in database
      await prisma.aiScore.update({
        where: { id: requestId },
        data: {
          status: 'PROCESSING',
          metadata: {
            telegramMessageId: response.data.result.message_id.toString()
          }
        }
      });

      logger.info('Document sent to Telegram bot', {
        requestId,
        fileName,
        messageId: response.data.result.message_id
      });
    } catch (error) {
      logger.error('Failed to send document to Telegram bot', {
        error,
        requestId,
        fileName
      });
      throw new Error('Failed to send document to Telegram bot');
    }
  }

  static async handleWebhook(body: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Extract request ID and scores from bot response
      const messageText = body.message?.text;
      if (!messageText) return;

      const data = this.parseResponseMessage(messageText);
      if (!data) return;

      // Update database with results
      await prisma.aiScore.update({
        where: { id: data.requestId },
        data: {
          score: data.aiScore,
          analysis: {
            aiScore: data.aiScore,
            plagiarismScore: data.plagiarismScore,
            aiReportUrl: data.aiReportUrl,
            plagiarismReportUrl: data.plagiarismReportUrl
          },
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      logger.info('Updated AI score from Telegram bot', {
        requestId: data.requestId,
        aiScore: data.aiScore,
        plagiarismScore: data.plagiarismScore
      });
    } catch (error) {
      logger.error('Failed to process Telegram webhook', { error });
      throw error;
    }
  }

  private static verifyWebhookSignature(signature: string): boolean {
    // Implement signature verification using WEBHOOK_SECRET
    // This is a placeholder - implement actual verification logic
    return signature === WEBHOOK_SECRET;
  }

  private static parseResponseMessage(text: string): TelegramResponse | null {
    try {
      // Expected format: "REQUEST_ID|AI_SCORE|PLAGIARISM_SCORE|AI_REPORT_URL|PLAGIARISM_REPORT_URL"
      const [requestId, aiScore, plagiarismScore, aiReportUrl, plagiarismReportUrl] = text.split('|');

      if (!requestId || !aiScore || !plagiarismScore) {
        return null;
      }

      return {
        requestId,
        aiScore: parseFloat(aiScore),
        plagiarismScore: parseFloat(plagiarismScore),
        aiReportUrl,
        plagiarismReportUrl
      };
    } catch (error) {
      logger.error('Failed to parse Telegram response', { error, text });
      return null;
    }
  }
}
