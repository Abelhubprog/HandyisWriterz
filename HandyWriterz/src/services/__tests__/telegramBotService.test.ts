import { TelegramBotService } from '../telegramBotService';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { telegramConfig } from '../../config/telegram';

// Mock dependencies
jest.mock('axios');
jest.mock('@prisma/client');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPrisma = {
  aiScore: {
    update: jest.fn(),
    findUnique: jest.fn()
  }
} as unknown as PrismaClient;

describe('TelegramBotService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendDocument', () => {
    const mockFileBuffer = Buffer.from('test content');
    const mockFileName = 'test.pdf';
    const mockRequestId = 'test-request-id';

    it('should successfully send document to Telegram', async () => {
      // Mock successful Telegram API response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          ok: true,
          result: {
            message_id: 123
          }
        }
      });

      await TelegramBotService.sendDocument(mockFileBuffer, mockFileName, mockRequestId);

      // Verify axios call
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${telegramConfig.botToken}/sendDocument`,
        expect.any(FormData),
        expect.any(Object)
      );

      // Verify database update
      expect(mockedPrisma.aiScore.update).toHaveBeenCalledWith({
        where: { id: mockRequestId },
        data: {
          status: 'PROCESSING',
          metadata: expect.objectContaining({
            telegramMessageId: '123'
          })
        }
      });
    });

    it('should handle Telegram API errors', async () => {
      // Mock failed Telegram API response
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(
        TelegramBotService.sendDocument(mockFileBuffer, mockFileName, mockRequestId)
      ).rejects.toThrow('Failed to send document to Telegram bot');
    });

    it('should validate file size', async () => {
      const largeBuffer = Buffer.alloc(telegramConfig.maxFileSize + 1);

      await expect(
        TelegramBotService.sendDocument(largeBuffer, mockFileName, mockRequestId)
      ).rejects.toThrow('File size exceeds maximum limit');
    });
  });

  describe('handleWebhook', () => {
    const mockSignature = 'valid-signature';
    const mockWebhookBody = {
      message: {
        text: 'test-request-id|8.5|2.5|http://ai-report.pdf|http://plagiarism-report.pdf'
      }
    };

    it('should process valid webhook data', async () => {
      await TelegramBotService.handleWebhook(mockWebhookBody, mockSignature);

      expect(mockedPrisma.aiScore.update).toHaveBeenCalledWith({
        where: { id: 'test-request-id' },
        data: expect.objectContaining({
          score: 8.5,
          analysis: expect.objectContaining({
            aiScore: 8.5,
            plagiarismScore: 2.5,
            aiReportUrl: 'http://ai-report.pdf',
            plagiarismReportUrl: 'http://plagiarism-report.pdf'
          }),
          status: 'COMPLETED'
        })
      });
    });

    it('should reject invalid signatures', async () => {
      await expect(
        TelegramBotService.handleWebhook(mockWebhookBody, 'invalid-signature')
      ).rejects.toThrow('Invalid webhook signature');
    });

    it('should handle malformed message text', async () => {
      const malformedBody = {
        message: {
          text: 'invalid|format'
        }
      };

      await TelegramBotService.handleWebhook(malformedBody, mockSignature);
      expect(mockedPrisma.aiScore.update).not.toHaveBeenCalled();
    });
  });
});
