import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin authentication
  const session = await getSession({ req });
  if (!session?.user || !(session.user as any).isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get total users
      const totalUsers = await prisma.user.count({
        where: { isAdmin: false },
      });

      // Get active users (users who have logged in within the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = await prisma.user.count({
        where: {
          isAdmin: false,
          lastLoginAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Get total orders
      const totalOrders = await prisma.order.count();

      // Calculate average response time (in minutes)
      const messages = await prisma.message.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          senderId: true,
          receiverId: true,
          createdAt: true,
        },
      });

      let totalResponseTime = 0;
      let responseCount = 0;

      // Group messages by conversation
      const conversations = messages.reduce((acc, msg) => {
        const conversationId = [msg.senderId, msg.receiverId].sort().join('-');
        if (!acc[conversationId]) {
          acc[conversationId] = [];
        }
        acc[conversationId].push(msg);
        return acc;
      }, {} as Record<string, typeof messages>);

      // Calculate response times
      Object.values(conversations).forEach(conversation => {
        for (let i = 1; i < conversation.length; i++) {
          const timeDiff = conversation[i].createdAt.getTime() - conversation[i - 1].createdAt.getTime();
          if (
            conversation[i].senderId !== conversation[i - 1].senderId && // Different senders
            timeDiff < 24 * 60 * 60 * 1000 // Less than 24 hours
          ) {
            totalResponseTime += timeDiff;
            responseCount++;
          }
        }
      });

      const averageResponseTime = responseCount > 0
        ? Math.round(totalResponseTime / responseCount / 1000 / 60) // Convert to minutes
        : 0;

      return res.status(200).json({
        totalUsers,
        activeUsers,
        totalOrders,
        averageResponseTime,
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
