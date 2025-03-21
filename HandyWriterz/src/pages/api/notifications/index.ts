import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId as string,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limit to last 50 notifications
      });

      return res.status(200).json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  } else if (req.method === 'POST') {
    try {
      const { userId, title, message, type } = req.body;
      
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          read: false,
        },
      });

      // If this is a message notification, also create a message record
      if (type === 'message') {
        await prisma.message.create({
          data: {
            content: message,
            senderId: 'system', // Use a system ID for automated messages
            receiverId: userId,
          },
        });
      }

      return res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ error: 'Failed to create notification' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
