import type { NextApiRequest, NextApiResponse } from 'next';
import { Client, resources } from 'coinbase-commerce-node';
import { getSession } from 'next-auth/react';

Client.init(process.env.COINBASE_COMMERCE_API_KEY!);
const { Charge } = resources;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid charge ID' });
    }

    const charge = await Charge.retrieve(id);
    if (!charge) {
      return res.status(404).json({ error: 'Charge not found' });
    }

    // Get the latest status from the timeline
    const timeline = charge.timeline.sort((a: any, b: any) => {
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    let status = 'PENDING';
    const latestEvent = timeline[0];

    if (latestEvent) {
      switch (latestEvent.status) {
        case 'COMPLETED':
        case 'CONFIRMED':
          status = 'COMPLETED';
          break;
        case 'EXPIRED':
        case 'CANCELED':
        case 'UNRESOLVED':
          status = 'FAILED';
          break;
        case 'PENDING':
        case 'PROCESSING':
          status = 'PENDING';
          break;
        default:
          status = 'UNKNOWN';
      }
    }

    return res.status(200).json({
      status,
      charge: {
        id: charge.id,
        status,
        amount: charge.pricing.local.amount,
        currency: charge.pricing.local.currency,
        createdAt: charge.created_at,
        expiresAt: charge.expires_at,
      }
    });
  } catch (error) {
    console.error('Check charge error:', error);
    return res.status(500).json({ error: 'Failed to check charge status' });
  }
}
