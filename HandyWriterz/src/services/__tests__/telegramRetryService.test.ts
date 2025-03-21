import { TelegramRetryService } from '../telegramRetryService';
import { TelegramBotService } from '../telegramBotService';
import { PrismaClient } from '@prisma/client';
import { telegramConfig } from '../../config/telegram';

// Mock dependencies
jest.mock('../telegramBotService');
jest.mock('@prisma/client');

const mockedPrisma = {
  aiScore: {
    findMany: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn()
  }
} as unknown as PrismaClient;

describe('TelegramRetryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processFailedRequests', () => {
    const mockFailedRequests = [
      {
        id: 'request-1',
        retryCount: 0,
        telegramStatus: 'FAILED',
        updatedAt: new Date()
      },
      {
        id: 'request-2',
        retryCount: 1,
        telegramStatus: 'FAILED',
        updatedAt: new Date()
      }
    ];

    beforeEach(() => {
      // Mock file storage retrieval
      jest.spyOn(TelegramRetryService as any, 'getFileFromStorage')
        .mockResolvedValue({
          buffer: Buffer.from('test'),
          fileName: 'test.pdf'
        });
    });

    it('should process failed requests within retry limit', async () => {
      // Mock database queries
      mockedPrisma.aiScore.findMany.mockResolvedValueOnce(mockFailedRequests);
      
      // Mock successful retry
      (TelegramBotService.sendDocument as jest.Mock).mockResolvedValue(undefined);

      await TelegramRetryService.processFailedRequests();

      // Verify database queries
      expect(mockedPrisma.aiScore.findMany).toHaveBeenCalledWith({
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

      // Verify retry attempts
      expect(mockedPrisma.aiScore.update).toHaveBeenCalledTimes(mockFailedRequests.length * 2); // Initial update + success update
      expect(TelegramBotService.sendDocument).toHaveBeenCalledTimes(mockFailedRequests.length);
    });

    it('should handle retry failures', async () => {
      mockedPrisma.aiScore.findMany.mockResolvedValueOnce([mockFailedRequests[0]]);
      
      // Mock failed retry
      (TelegramBotService.sendDocument as jest.Mock)
        .mockRejectedValueOnce(new Error('Retry failed'));

      await TelegramRetryService.processFailedRequests();

      // Verify error handling
      expect(mockedPrisma.aiScore.update).toHaveBeenLastCalledWith({
        where: { id: mockFailedRequests[0].id },
        data: expect.objectContaining({
          telegramStatus: 'RETRY',
          telegramError: 'Retry failed'
        })
      });
    });

    it('should mark as failed after max retries', async () => {
      const maxRetriesRequest = {
        id: 'request-3',
        retryCount: telegramConfig.maxRetries - 1,
        telegramStatus: 'FAILED',
        updatedAt: new Date()
      };

      mockedPrisma.aiScore.findMany.mockResolvedValueOnce([maxRetriesRequest]);
      
      // Mock failed retry
      (TelegramBotService.sendDocument as jest.Mock)
        .mockRejectedValueOnce(new Error('Final retry failed'));

      await TelegramRetryService.processFailedRequests();

      // Verify final failure status
      expect(mockedPrisma.aiScore.update).toHaveBeenLastCalledWith({
        where: { id: maxRetriesRequest.id },
        data: expect.objectContaining({
          telegramStatus: 'FAILED',
          telegramError: 'Final retry failed'
        })
      });
    });
  });

  describe('scheduleRetry', () => {
    const mockRequestId = 'test-request';
    const mockError = new Error('Test error');

    it('should schedule retry for existing request', async () => {
      mockedPrisma.aiScore.findUnique.mockResolvedValueOnce({
        id: mockRequestId,
        retryCount: 1
      });

      await TelegramRetryService.scheduleRetry(mockRequestId, mockError);

      expect(mockedPrisma.aiScore.update).toHaveBeenCalledWith({
        where: { id: mockRequestId },
        data: {
          telegramStatus: 'FAILED',
          telegramError: mockError.message,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle non-existent requests', async () => {
      mockedPrisma.aiScore.findUnique.mockResolvedValueOnce(null);

      await expect(
        TelegramRetryService.scheduleRetry(mockRequestId, mockError)
      ).rejects.toThrow('Request not found');
    });
  });
});
