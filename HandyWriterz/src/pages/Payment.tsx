import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const paymentMethods = [
  {
    id: 'card',
    title: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Pay securely with your card'
  },
  {
    id: 'paypal',
    title: 'PayPal',
    icon: DollarSign,
    description: 'Fast and secure payment via PayPal'
  }
];

const features = [
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'Your payment information is encrypted and secure'
  },
  {
    icon: Clock,
    title: 'Instant Access',
    description: 'Get immediate access to your services after payment'
  },
  {
    icon: FileText,
    title: 'Detailed Invoice',
    description: 'Receive a detailed invoice for your records'
  }
];

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1).padStart(2, '0')
}));

const yearOptions = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: String(year), label: String(year) };
});

const Payment = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStatus('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <DollarSign className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure and easy payment for your academic services
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-8">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedMethod === method.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-600'
                        }`}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Icon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {method.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {method.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {selectedMethod === 'card' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Card Number
                        </label>
                        <Input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Expiry Date
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              options={monthOptions}
                              placeholder="Month"
                            />
                            <Select
                              options={yearOptions}
                              placeholder="Year"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            CVC
                          </label>
                          <Input
                            type="text"
                            placeholder="123"
                            maxLength={4}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Pay Now'}
                  </Button>

                  {status === 'success' && (
                    <Alert className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Payment Successful</AlertTitle>
                      <AlertDescription>
                        Your payment has been processed successfully.
                      </AlertDescription>
                    </Alert>
                  )}

                  {status === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Payment Failed</AlertTitle>
                      <AlertDescription>
                        There was an error processing your payment. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Need Help?</AlertTitle>
              <AlertDescription>
                If you have any questions about payment, please contact our support team.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
