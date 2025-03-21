import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  interval: 'month' | 'year';
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  type: 'payment' | 'refund';
  created_at: string;
  metadata: any;
}

export interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'void';
  due_date: string;
  paid_at?: string;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

export function useBilling() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const getPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching billing plans:', error);
      return null;
    }
  };

  const getCurrentPlan = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:billing_plans(*)')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching current plan:', error);
      return null;
    }
  };

  const subscribeToPlan = async (planId: string) => {
    if (!user) {
      toast.error('You must be logged in to subscribe');
      return { success: false };
    }

    setLoading(true);
    try {
      // First, check if user already has a subscription
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingSub) {
        // Update existing subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: planId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSub.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .insert([{
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            start_date: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      toast.success('Successfully subscribed to plan');
      return { success: true };
    } catch (error: any) {
      console.error('Error subscribing to plan:', error);
      toast.error('Failed to subscribe to plan');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!user) {
      toast.error('You must be logged in to cancel subscription');
      return { success: false };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Successfully cancelled subscription');
      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getTransactionHistory = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  };

  const getInvoices = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  };

  const createInvoice = async (items: Array<{ description: string; amount: number; quantity: number }>) => {
    if (!user) {
      toast.error('You must be logged in to create an invoice');
      return { success: false };
    }

    try {
      const totalAmount = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          user_id: user.id,
          amount: totalAmount,
          status: 'draft',
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          items
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }
  };

  const processPayment = async (amount: number, metadata: any = {}) => {
    if (!user) {
      toast.error('You must be logged in to make a payment');
      return { success: false };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          amount,
          status: 'completed',
          type: 'payment',
          metadata,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Payment processed successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (transactionId: string, reason: string) => {
    if (!user) {
      toast.error('You must be logged in to request a refund');
      return { success: false };
    }

    try {
      // First, get the original transaction
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;
      if (!transaction) throw new Error('Transaction not found');

      // Create refund record
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          amount: transaction.amount,
          status: 'pending',
          type: 'refund',
          metadata: {
            original_transaction_id: transactionId,
            reason
          },
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Refund request submitted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error requesting refund:', error);
      toast.error('Failed to request refund');
      return { success: false, error: error.message };
    }
  };

  return {
    loading,
    getPlans,
    getCurrentPlan,
    subscribeToPlan,
    cancelSubscription,
    getTransactionHistory,
    getInvoices,
    createInvoice,
    processPayment,
    requestRefund
  };
}
