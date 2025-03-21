import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Send a message
    try {
      const { content, senderId, receiverId } = req.body;
      const message = await prisma.message.create({
        data: {
          content,
          senderId,
          receiverId,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });
      return res.status(200).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  } else if (req.method === 'GET') {
    // Get messages for a user
    try {
      const { userId } = req.query;
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId as string },
            { receiverId: userId as string },
          ],
        },
        include: {
          sender: true,
          receiver: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
