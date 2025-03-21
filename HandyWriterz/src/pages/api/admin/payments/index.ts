import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { Client } from 'coinbase-commerce-node';

const prisma = new PrismaClient();
Client.init(process.env.COINBASE_COMMERCE_API_KEY!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  // Check authentication and admin role
  if (!session || session.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch Turnitin payments
    const turnitinPayments = await prisma.turnitinCheck.findMany({
      where: {
        payment: {
          isNot: null
        }
      },
      select: {
        id: true,
        payment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch AI Score payments
    const aiScorePayments = await prisma.aiScore.findMany({
      where: {
        payment: {
          isNot: null
        }
      },
      select: {
        id: true,
        payment: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format payments for response
    const formattedPayments = [
      ...turnitinPayments.map((p) => ({
        id: p.payment.id,
        type: 'turnitin_check',
        amount: p.payment.amount,
        currency: p.payment.currency,
        status: p.payment.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        metadata: {
          requestId: p.id,
          email: p.user.email
        }
      })),
      ...aiScorePayments.map((p) => ({
        id: p.payment.id,
        type: 'ai_score',
        amount: p.payment.amount,
        currency: p.payment.currency,
        status: p.payment.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        metadata: {
          requestId: p.id,
          email: p.user.email
        }
      }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return res.status(200).json(formattedPayments);
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
}
