import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

interface ServiceOverviewProps {
  serviceType: string;
  features: string[];
  benefits: string[];
}

/**
 * ServiceOverview - A component for displaying service features and benefits
 * 
 * This component is optimized for performance and is lazy-loaded in the StandardServicePage.
 * It displays service features and benefits in an engaging, animated layout.
 */
const ServiceOverview: React.FC<ServiceOverviewProps> = ({
  serviceType,
  features = [],
  benefits = []
}) => {
  // If no features or benefits are provided, use default ones
  const defaultFeatures = [
    `Expert writing assistance in ${serviceType}`,
    'Research support and literature reviews',
    'Evidence-based practice resources',
    'Professional development materials',
    'Custom content creation'
  ];

  const defaultBenefits = [
    'Save time on complex writing tasks',
    'Access to specialized knowledge and expertise',
    'Improve the quality of your academic work',
    'Learn from professionally written examples',
    'Receive guidance on proper formatting and citations',
    'Get help with challenging concepts and topics'
  ];

  // Use provided features/benefits or fall back to defaults
  const displayFeatures = features.length > 0 ? features : defaultFeatures;
  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" id="overview">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-gray-900"
          >
            Our Services
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto"
          >
            We provide comprehensive support for all your {serviceType.replace(/-/g, ' ')} needs
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Features Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Key Features
              </h3>
              <ul className="space-y-4">
                {displayFeatures.map((feature, index) => (
                  <motion.li 
                    key={index} 
                    variants={itemVariants}
                    className="flex items-start"
                  >
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="ml-3 text-gray-700">{feature}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md overflow-hidden"
          >
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Benefits
              </h3>
              <ul className="space-y-4">
                {displayBenefits.map((benefit, index) => (
                  <motion.li 
                    key={index} 
                    variants={itemVariants}
                    className="flex items-start"
                  >
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="ml-3 text-gray-700">{benefit}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <a 
            href="/order" 
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceOverview; 