import { Webhook } from 'svix';
import { headers } from 'next/headers';
import type { WebhookEvent } from '@coinbase/commerce.js';
import { createHmac } from 'crypto';

const verifyCoinbaseSignature = (rawBody: string, signature: string) => {
  const hmac = createHmac('sha256', process.env.COINBASE_WEBHOOK_SECRET!);
  const digest = hmac.update(rawBody).digest('hex');
  return signature === digest;
};

const MAX_RETRIES = 3;

async function verifyPaymentWithRetry(chargeId: string, attempt = 1): Promise<boolean> {
  try {
    const response = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`);
    const data = await response.json();
    return data.status === 'CONFIRMED';
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      return verifyPaymentWithRetry(chargeId, attempt + 1);
    }
    throw error;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headerList = headers();
  const wh = new Webhook(process.env.COINBASE_WEBHOOK_SECRET!);
  
  if (!verifyCoinbaseSignature(rawBody, headerList.get('cb-signature')!)) {
    return new Response('Invalid signature', { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = wh.verify(
      rawBody,
      headerList.get('svix-signature')!
    ) as WebhookEvent;

    await prisma.payment.create({
      data: {
        userId: event.data.metadata.userId,
        amount: event.data.pricing.local.amount,
        currency: event.data.pricing.local.currency,
        status: event.type,
        txHash: event.data.transactions[0]?.hash
      }
    });

    const isVerified = await verifyPaymentWithRetry(event.data.id);
    if (!isVerified) {
      console.error('Payment verification failed');
      return new Response('Payment verification failed', { status: 400 });
    }

    return new Response('', { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response('Webhook error', { status: 400 });
  }
}
