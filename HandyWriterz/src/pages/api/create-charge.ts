import type { NextApiRequest, NextApiResponse } from 'next';
import { Client, resources } from 'coinbase-commerce-node';
import { createHash } from 'crypto';
import prisma from '../../lib/prisma';

// Initialize Coinbase Commerce client
Client.init(process.env.COINBASE_COMMERCE_API_KEY!);
const { Charge } = resources;

// Webhook signature verification
const verifyWebhookSignature = (signature: string, body: string) => {
  const hmac = createHash('sha256')
    .update(body)
    .update(process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!)
    .digest('hex');
  return hmac === signature;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'USD', email, module, files, studyLevel, dueDate, instructions } = req.body;

    // Input validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create charge with detailed metadata
    const chargeData = {
      name: 'HandyWriterz Academic Writing Service',
      description: `${studyLevel} level writing service - ${amount} words`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency,
      },
      metadata: {
        order_id: orderId,
        customer_email: email,
        module,
        study_level: studyLevel,
        due_date: dueDate,
        word_count: amount,
        file_count: files?.length || 0
      },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success&order=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=cancelled&order=${orderId}`,
    };

    // Create charge in Coinbase Commerce
    const charge = await Charge.create(chargeData);

    // Store order in database
    const order = await prisma.order.create({
      data: {
        orderId,
        chargeId: charge.id,
        amount: parseFloat(amount),
        currency,
        email,
        module,
        studyLevel,
        dueDate: new Date(dueDate),
        instructions,
        status: 'pending',
        files: {
          create: files?.map((file: any) => ({
            originalName: file.originalName,
            filename: file.filename,
            size: file.size,
            type: file.type,
          })) || [],
        },
      },
    });

    return res.status(200).json({
      hosted_url: charge.hosted_url,
      id: charge.id,
      order_id: orderId
    });
  } catch (error) {
    console.error('Create charge error:', error);
    return res.status(500).json({ error: 'Failed to create charge' });
  }
}
