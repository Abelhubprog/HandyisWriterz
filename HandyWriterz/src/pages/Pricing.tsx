import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import HandyWriterzLogo from '@/components/HandyWriterzLogo';

const Pricing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const plans = [
    {
      name: 'Basic',
      description: 'Perfect for students with occasional academic needs',
      price: {
        monthly: 14.99,
        yearly: 12.99,
      },
      features: [
        { included: true, text: 'Up to 5 pages per order' },
        { included: true, text: '7-day delivery' },
        { included: true, text: 'Free plagiarism check' },
        { included: true, text: '1 free revision' },
        { included: true, text: 'Email support' },
        { included: false, text: 'Direct writer communication' },
        { included: false, text: 'Dedicated account manager' },
        { included: false, text: 'Research assistance' },
      ],
      color: 'blue',
      popular: false,
      cta: 'Get Started',
    },
    {
      name: 'Standard',
      description: 'Ideal for students with regular academic requirements',
      price: {
        monthly: 39,
        yearly: 33,
      },
      features: [
        { included: true, text: 'Up to 15 pages per order' },
        { included: true, text: '5-day delivery' },
        { included: true, text: 'Free plagiarism check' },
        { included: true, text: '3 free revisions' },
        { included: true, text: 'Priority email support' },
        { included: true, text: 'Direct writer communication' },
        { included: false, text: 'Dedicated account manager' },
        { included: false, text: 'Research assistance' },
      ],
      color: 'purple',
      popular: true,
      cta: 'Get Started',
    },
    {
      name: 'Premium',
      description: 'Comprehensive support for demanding academic projects',
      price: {
        monthly: 69,
        yearly: 59,
      },
      features: [
        { included: true, text: 'Unlimited pages per order' },
        { included: true, text: '3-day delivery' },
        { included: true, text: 'Free plagiarism check' },
        { included: true, text: 'Unlimited revisions' },
        { included: true, text: '24/7 priority support' },
        { included: true, text: 'Direct writer communication' },
        { included: true, text: 'Dedicated account manager' },
        { included: true, text: 'Research assistance' },
      ],
      color: 'pink',
      popular: false,
      cta: 'Get Started',
    },
  ];

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'border' | 'hover' | 'gradient') => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-600',
        text: 'text-blue-600',
        border: 'border-blue-600',
        hover: 'hover:bg-blue-700',
        gradient: 'from-blue-500 to-blue-600',
      },
      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700',
        gradient: 'from-purple-500 to-purple-600',
      },
      pink: {
        bg: 'bg-pink-600',
        text: 'text-pink-600',
        border: 'border-pink-600',
        hover: 'hover:bg-pink-700',
        gradient: 'from-pink-500 to-pink-600',
      },
    };

    return colorMap[color as keyof typeof colorMap][type];
  };

  const savingsPercentage = 20; // 20% savings on yearly plans

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <HandyWriterzLogo size="lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the plan that fits your academic needs. All plans include plagiarism-free content and expert writers.
          </p>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <div className="relative">
              <div className="w-12 h-6 bg-indigo-200 rounded-full shadow-inner"></div>
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : ''
                }`}
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              ></div>
            </div>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                billingPeriod === 'yearly'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Yearly
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                Save {savingsPercentage}%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeIn}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden border ${
                plan.popular ? 'border-purple-400 transform md:scale-105 md:-translate-y-1' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">£{plan.price[billingPeriod]}</span>
                  <span className="text-gray-500"> / per order</span>
                  {billingPeriod === 'yearly' && (
                    <div className="mt-1 text-sm text-green-600 font-medium">
                      £{(plan.price.monthly * (1 - savingsPercentage / 100)).toFixed(2)} with annual billing
                    </div>
                  )}
                </div>
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-center">
                      {feature.included ? (
                        <Check className={`h-5 w-5 mr-3 £{getColorClasses(plan.color, 'text')} flex-shrink-0`} />
                      ) : (
                        <X className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/sign-in"
                  className={`block w-full py-3 px-4 rounded-lg text-center text-white font-medium bg-gradient-to-r ${
                    getColorClasses(plan.color, 'gradient')
                  } hover:opacity-90 transition-all shadow-lg`}
                >
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Info className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-lg mb-2">How do I place an order?</h3>
              <p className="text-gray-600">
                Simply create an account, select your service, provide your requirements, and proceed to payment. Our expert writers will start working on your order immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Can I request revisions?</h3>
              <p className="text-gray-600">
                Yes, you can request revisions based on your plan. Basic plans include 1 revision, Standard plans include 3 revisions, and Premium plans include unlimited revisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Is my information confidential?</h3>
              <p className="text-gray-600">
                Absolutely. We maintain strict confidentiality and never share your personal information with third parties.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Excel in Your Academic Journey?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of students who have achieved academic success with our expert assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/sign-in"
              className="inline-block py-3 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Today
            </Link>
            <Link
              to="/contact"
              className="inline-block py-3 px-8 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
