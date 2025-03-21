import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { logger } from '../lib/logger';
import { telegramConfig } from '../config/telegram';

const prisma = new PrismaClient();

export enum TelegramInteractionStep {
  DOCUMENT_SENT = 'DOCUMENT_SENT',
  REGION_SELECTION = 'REGION_SELECTION',
  QUESTION_ONE = 'QUESTION_ONE',
  QUESTION_TWO = 'QUESTION_TWO',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface TelegramInteractionState {
  requestId: string;
  messageId: string;
  step: TelegramInteractionStep;
  region?: string;
  questionOneAnswer?: boolean;
  questionTwoAnswer?: boolean;
  error?: string;
}

export class TelegramBotInteractionService {
  private static readonly TELEGRAM_API_BASE = `https://api.telegram.org/bot${telegramConfig.botToken}`;
  private static readonly CHAT_ID = telegramConfig.chatId;

  static async handleIncomingMessage(message: any): Promise<void> {
    try {
      // Extract request ID from callback data or message
      const requestId = this.extractRequestId(message);
      if (!requestId) {
        logger.warn('No request ID found in message', { message });
        return;
      }

      // Get current interaction state
      const state = await this.getInteractionState(requestId);
      if (!state) {
        logger.warn('No interaction state found for request', { requestId });
        return;
      }

      // Handle message based on current step
      switch (state.step) {
        case TelegramInteractionStep.DOCUMENT_SENT:
          await this.handleRegionPrompt(state);
          break;
        case TelegramInteractionStep.REGION_SELECTION:
          await this.handleQuestionOne(state);
          break;
        case TelegramInteractionStep.QUESTION_ONE:
          await this.handleQuestionTwo(state);
          break;
        case TelegramInteractionStep.QUESTION_TWO:
          await this.handleProcessing(state);
          break;
        default:
          logger.warn('Unexpected interaction step', { state });
      }
    } catch (error) {
      logger.error('Error handling incoming message', { error, message });
      throw error;
    }
  }

  private static async handleRegionPrompt(state: TelegramInteractionState): Promise<void> {
    try {
      const request = await prisma.aiScore.findUnique({
        where: { id: state.requestId }
      });

      if (!request?.metadata?.region) {
        throw new Error('Region not found in request metadata');
      }

      // Send region selection callback
      await this.sendCallback({
        messageId: state.messageId,
        callbackData: `region_${request.metadata.region}_${state.requestId}`
      });

      // Update interaction state
      await this.updateInteractionState(state.requestId, {
        step: TelegramInteractionStep.REGION_SELECTION
      });
    } catch (error) {
      logger.error('Error handling region prompt', { error, state });
      await this.handleError(state.requestId, error as Error);
    }
  }

  private static async handleQuestionOne(state: TelegramInteractionState): Promise<void> {
    try {
      const request = await prisma.aiScore.findUnique({
        where: { id: state.requestId }
      });

      if (!request?.metadata?.questionOne) {
        throw new Error('Question one answer not found in request metadata');
      }

      // Send question one answer callback
      await this.sendCallback({
        messageId: state.messageId,
        callbackData: `q1_${request.metadata.questionOne ? 'yes' : 'no'}_${state.requestId}`
      });

      // Update interaction state
      await this.updateInteractionState(state.requestId, {
        step: TelegramInteractionStep.QUESTION_ONE
      });
    } catch (error) {
      logger.error('Error handling question one', { error, state });
      await this.handleError(state.requestId, error as Error);
    }
  }

  private static async handleQuestionTwo(state: TelegramInteractionState): Promise<void> {
    try {
      const request = await prisma.aiScore.findUnique({
        where: { id: state.requestId }
      });

      if (!request?.metadata?.questionTwo) {
        throw new Error('Question two answer not found in request metadata');
      }

      // Send question two answer callback
      await this.sendCallback({
        messageId: state.messageId,
        callbackData: `q2_${request.metadata.questionTwo ? 'yes' : 'no'}_${state.requestId}`
      });

      // Update interaction state
      await this.updateInteractionState(state.requestId, {
        step: TelegramInteractionStep.QUESTION_TWO
      });
    } catch (error) {
      logger.error('Error handling question two', { error, state });
      await this.handleError(state.requestId, error as Error);
    }
  }

  private static async handleProcessing(state: TelegramInteractionState): Promise<void> {
    try {
      // Update interaction state to processing
      await this.updateInteractionState(state.requestId, {
        step: TelegramInteractionStep.PROCESSING
      });

      // Update request status
      await prisma.aiScore.update({
        where: { id: state.requestId },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error handling processing state', { error, state });
      await this.handleError(state.requestId, error as Error);
    }
  }

  private static async sendCallback(params: {
    messageId: string;
    callbackData: string;
  }): Promise<void> {
    try {
      await axios.post(`${this.TELEGRAM_API_BASE}/answerCallbackQuery`, {
        callback_query_id: params.messageId,
        text: params.callbackData
      });

      logger.debug('Sent callback to Telegram', { params });
    } catch (error) {
      logger.error('Error sending callback to Telegram', { error, params });
      throw error;
    }
  }

  private static async getInteractionState(
    requestId: string
  ): Promise<TelegramInteractionState | null> {
    try {
      const request = await prisma.aiScore.findUnique({
        where: { id: requestId }
      });

      if (!request) return null;

      return {
        requestId,
        messageId: request.telegramMessageId!,
        step: request.metadata?.interactionStep || TelegramInteractionStep.DOCUMENT_SENT
      };
    } catch (error) {
      logger.error('Error getting interaction state', { error, requestId });
      throw error;
    }
  }

  private static async updateInteractionState(
    requestId: string,
    update: Partial<TelegramInteractionState>
  ): Promise<void> {
    try {
      await prisma.aiScore.update({
        where: { id: requestId },
        data: {
          metadata: {
            interactionStep: update.step
          }
        }
      });

      logger.debug('Updated interaction state', { requestId, update });
    } catch (error) {
      logger.error('Error updating interaction state', { error, requestId, update });
      throw error;
    }
  }

  private static async handleError(requestId: string, error: Error): Promise<void> {
    try {
      await prisma.aiScore.update({
        where: { id: requestId },
        data: {
          status: 'FAILED',
          telegramStatus: 'FAILED',
          telegramError: error.message,
          updatedAt: new Date()
        }
      });

      logger.error('Request failed due to interaction error', {
        requestId,
        error: error.message
      });
    } catch (dbError) {
      logger.error('Error updating failed request status', {
        dbError,
        requestId,
        originalError: error
      });
    }
  }

  private static extractRequestId(message: any): string | null {
    try {
      if (message.callback_query?.data) {
        return message.callback_query.data.split('_').pop();
      }

      if (message.caption) {
        const match = message.caption.match(/ID:(\w+)/);
        return match ? match[1] : null;
      }

      return null;
    } catch (error) {
      logger.error('Error extracting request ID', { error, message });
      return null;
    }
  }
}
