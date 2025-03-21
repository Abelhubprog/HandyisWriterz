// adult-health-nursing.tsx
import React from 'react';
import ServiceBlogTemplate from './ServiceBlogTemplate';
import { Heart } from 'lucide-react';

const AdultHealthNursing: React.FC = () => {
  return (
    <ServiceBlogTemplate 
      defaultIcon={<Heart className="h-16 w-16" />}
      serviceName="Adult Health Nursing"
      serviceColor="from-blue-600 to-blue-400"
      serviceDescription="Expert resources and academic support for nursing students focusing on adult patient care, medical-surgical nursing, and healthcare innovations."
    />
  );
};

export default AdultHealthNursing;

// mental-health-nursing.tsx
import React from 'react';
import ServiceBlogTemplate from './ServiceBlogTemplate';
import { Brain } from 'lucide-react';

const MentalHealthNursing: React.FC = () => {
  return (
    <ServiceBlogTemplate 
      defaultIcon={<Brain className="h-16 w-16" />}
      serviceName="Mental Health Nursing"
      serviceColor="from-purple-600 to-purple-400"
      serviceDescription="Comprehensive resources for mental health nursing students exploring psychiatric care, therapeutic approaches, and psychological well-being."
    />
  );
};

export default MentalHealthNursing;

// ai.tsx
import React from 'react';
import ServiceBlogTemplate from './ServiceBlogTemplate';
import { CircuitBoard } from 'lucide-react';

const AIServices: React.FC = () => {
  return (
    <ServiceBlogTemplate 
      defaultIcon={<CircuitBoard className="h-16 w-16" />}
      serviceName="AI Services"
      serviceColor="from-indigo-600 to-indigo-400"
      serviceDescription="Advanced AI-powered solutions for academic writing, research analysis, and educational technology integration."
    />
  );
};

export default AIServices;