import React from 'react';
import { motion } from 'framer-motion';

interface ServiceHeroProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  heroImage?: string;
}

/**
 * ServiceHero - A component for displaying the hero section of a service page
 * 
 * This component is optimized for performance and is lazy-loaded in the StandardServicePage.
 * It includes animations and responsive design for optimal user experience.
 */
const ServiceHero: React.FC<ServiceHeroProps> = ({
  title,
  description,
  icon,
  heroImage
}) => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with optional hero image */}
      <div className="absolute inset-0 z-0">
        {heroImage ? (
          <div className="w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 mix-blend-multiply" />
            <img 
              src={heroImage} 
              alt={title}
              className="w-full h-full object-cover"
              loading="eager" // Load this image immediately
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700" />
        )}
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white"
        >
          {/* Icon */}
          {icon && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-6 bg-white/10 backdrop-blur-sm w-24 h-24 rounded-full flex items-center justify-center"
            >
              {icon}
            </motion.div>
          )}
          
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6"
          >
            {title}
          </motion.h1>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-3xl mx-auto text-xl text-white/90"
          >
            {description}
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a 
              href="#resources" 
              className="px-8 py-3 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-lg"
            >
              Explore Resources
            </a>
            <a 
              href="/contact" 
              className="px-8 py-3 bg-transparent border border-white text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Contact Us
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceHero; 