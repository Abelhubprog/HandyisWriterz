import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import prisma from '../../../lib/prisma';

const verifyWebhookSignature = (signature: string, body: string) => {
  const hmac = createHash('sha256')
    .update(body)
    .update(process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!)
    .digest('hex');
  return hmac === signature;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature
  const signature = req.headers['x-cc-webhook-signature'] as string;
  if (!signature) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  const rawBody = JSON.stringify(req.body);
  if (!verifyWebhookSignature(signature, rawBody)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const event = req.body;
    const { type } = event;
    const chargeId = event.data.id;

    // Find the order by chargeId
    const order = await prisma.order.findUnique({
      where: { chargeId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status based on event type
    switch (type) {
      case 'charge:confirmed':
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'completed' },
        });
        break;

      case 'charge:failed':
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'cancelled' },
        });
        break;

      case 'charge:delayed':
        // Payment detected but not yet confirmed
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'pending' },
        });
        break;

      case 'charge:pending':
        // Payment initiated but not yet detected
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'pending' },
        });
        break;

      case 'charge:resolved':
        // Charge manually marked as resolved
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'completed' },
        });
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
