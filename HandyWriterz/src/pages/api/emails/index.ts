import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check authentication
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.method === 'GET') {
      // Fetch emails for the authenticated user
      const emails = await prisma.manualDocument.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          subject: true,
          body: true,
          createdAt: true,
          status: true,
          attachments: {
            select: {
              name: true,
              url: true,
              size: true
            }
          },
          reports: {
            select: {
              aiScore: true,
              plagiarismScore: true,
              aiReportUrl: true,
              plagiarismReportUrl: true
            }
          },
          from: true,
          to: true
        }
      });

      return res.status(200).json({ emails });
    }

    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  } catch (error) {
    logger.error('Error handling email request', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}
