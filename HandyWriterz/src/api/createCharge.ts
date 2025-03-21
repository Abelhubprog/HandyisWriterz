import express from 'express';
import { Router } from 'express';

const router = Router();

router.post('/api/create-charge', async (req, res) => {
  try {
    const { amount } = req.body;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY
      },
      body: JSON.stringify({
        name: 'HandyWriterz Order',
        description: 'Academic Writing Services',
        local_price: {
          amount: amount.toString(),
          currency: 'USD'
        },
        pricing_type: 'fixed_price',
        metadata: {
          customer_id: req.user?.id,
          order_time: new Date().toISOString()
        }
      }),
    };

    const response = await fetch('https://api.commerce.coinbase.com/charges', options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error.message);
    }

    res.json({ chargeId: data.data.id });
  } catch (error) {
    console.error('Create charge error:', error);
    res.status(500).json({ error: 'Failed to create charge' });
  }
});

export default router;
