import type { NextApiRequest, NextApiResponse } from 'next';
import { Client, resources } from 'coinbase-commerce-node';

Client.init(process.env.COINBASE_COMMERCE_API_KEY!);
const { Charge } = resources;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const chargeData = {
      name: 'Turnitin Check',
      description: 'Document plagiarism check service',
      local_price: {
        amount: amount.toString(),
        currency: currency,
      },
      pricing_type: 'fixed_price',
      metadata: {
        type: 'turnitin_check',
        timestamp: new Date().toISOString(),
      },
    };

    const charge = await Charge.create(chargeData);

    return res.status(200).json({
      id: charge.id,
      hosted_url: charge.hosted_url,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
}
