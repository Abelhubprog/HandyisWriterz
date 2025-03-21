import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chargeId } = req.query;
    if (!chargeId) {
      return res.status(400).json({ error: 'Charge ID is required' });
    }

    const response = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    const data = await response.json();
    const timeline = data.data.timeline;
    const lastEvent = timeline[timeline.length - 1];

    return res.status(200).json({
      status: lastEvent.status.toLowerCase(),
      chargeId: data.data.id,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({ error: 'Failed to check payment status' });
  }
}
