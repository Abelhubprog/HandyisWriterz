import { LucideIcon } from 'lucide-react';
import { ContactInfo, FooterLinks } from '@/components/sections/Footer';

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface Service {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
}

export interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// Homepage data configuration
export interface HomepageConfig {
  companyName: string;
  companyDescription: string;
  features: Feature[];
  services: Service[];
  steps: Step[];
  footer: {
    links: FooterLinks;
    contact: ContactInfo;
  };
  cta: {
    title: string;
    description: string;
    buttonText: string;
  };
}
