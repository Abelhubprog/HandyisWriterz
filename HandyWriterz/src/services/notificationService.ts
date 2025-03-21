import prisma from '../lib/prisma';

export type NotificationType = 'message' | 'system' | 'update';

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

export const notificationService = {
  async createNotification({ userId, title, message, type }: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
        },
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId },
        data: { read: true },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async sendWelcomeNotification(userId: string, userName: string) {
    return this.createNotification({
      userId,
      title: 'Welcome to HandyWriterz! 👋',
      message: `Hi ${userName}, welcome to HandyWriterz! We're excited to have you here. Check out our quick start guide to get started.`,
      type: 'system',
    });
  },

  async sendMessageNotification(userId: string, senderName: string) {
    return this.createNotification({
      userId,
      title: 'New Message',
      message: `You have a new message from ${senderName}`,
      type: 'message',
    });
  },

  async sendSystemUpdate(userId: string, title: string, message: string) {
    return this.createNotification({
      userId,
      title,
      message,
      type: 'update',
    });
  },
};
