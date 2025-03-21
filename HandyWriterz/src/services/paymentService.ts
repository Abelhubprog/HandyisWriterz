import { logger } from '../lib/logger';

interface ChargeOptions {
  amount: number;
  currency: string;
  name: string;
  description: string;
  metadata?: Record<string, string>;
}

interface ChargeResponse {
  id: string;
  url: string;
  status: string;
}

export async function createCharge(options: ChargeOptions): Promise<ChargeResponse> {
  try {
    const response = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify({
        name: options.name,
        description: options.description,
        pricing_type: 'fixed_price',
        local_price: {
          amount: options.amount.toString(),
          currency: options.currency
        },
        metadata: options.metadata
      })
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Failed to create charge', { error });
      throw new Error('Failed to create payment charge');
    }

    const data = await response.json();
    return {
      id: data.data.id,
      url: data.data.hosted_url,
      status: data.data.timeline[0]?.status
    };
  } catch (error) {
    logger.error('Payment service error', { error });
    throw new Error('Failed to create payment charge');
  }
}

export async function verifyPayment(chargeId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
      headers: {
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY!,
        'X-CC-Version': '2018-03-22'
      }
    });

    if (!response.ok) {
      logger.error('Failed to verify payment', { 
        chargeId,
        status: response.status 
      });
      return false;
    }

    const data = await response.json();
    const timeline = data.data.timeline;
    const lastStatus = timeline[timeline.length - 1]?.status;

    // Check if payment is confirmed
    const isConfirmed = lastStatus === 'COMPLETED' || lastStatus === 'CONFIRMED';
    
    if (!isConfirmed) {
      logger.info('Payment not confirmed', { 
        chargeId,
        status: lastStatus 
      });
    }

    return isConfirmed;
  } catch (error) {
    logger.error('Payment verification error', { error, chargeId });
    return false;
  }
}
