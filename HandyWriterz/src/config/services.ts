import { Brain, Users, Heart, GraduationCap, Briefcase, CircuitBoard, Bitcoin } from 'lucide-react';
import { ServiceConfig } from '@/types/services';

export const services: ServiceConfig[] = [
  {
    id: 'adult-health-nursing',
    title: 'Adult Health Nursing',
    description: 'Comprehensive adult healthcare nursing services and resources.',
    path: '/services/adult-health-nursing',
    icon: Users,
    color: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      gradient: {
        from: 'from-blue-600',
        to: 'to-indigo-600'
      }
    }
  },
  {
    id: 'mental-health-nursing',
    title: 'Mental Health Nursing',
    description: 'Specialized mental health nursing support and guidance.',
    path: '/services/mental-health-nursing',
    icon: Brain,
    color: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      gradient: {
        from: 'from-green-600',
        to: 'to-emerald-600'
      }
    }
  },
  {
    id: 'child-nursing',
    title: 'Child Nursing',
    description: 'Dedicated pediatric nursing care and resources.',
    path: '/services/child-nursing',
    icon: Heart,
    color: {
      bg: 'bg-pink-500',
      text: 'text-pink-600',
      gradient: {
        from: 'from-pink-600',
        to: 'to-rose-600'
      }
    }
  },
  {
    id: 'special-education',
    title: 'Special Education',
    description: 'Resources and support for special education professionals.',
    path: '/services/special-education',
    icon: GraduationCap,
    color: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      gradient: {
        from: 'from-purple-600',
        to: 'to-violet-600'
      }
    }
  },
  {
    id: 'social-work',
    title: 'Social Work',
    description: 'Professional resources for social work practitioners.',
    path: '/services/social-work',
    icon: Briefcase,
    color: {
      bg: 'bg-orange-500',
      text: 'text-orange-600',
      gradient: {
        from: 'from-orange-600',
        to: 'to-amber-600'
      }
    }
  },
  {
    id: 'ai-services',
    title: 'AI Services',
    description: 'Advanced AI solutions for academic and research needs.',
    path: '/services/ai-services',
    icon: CircuitBoard,
    color: {
      bg: 'bg-cyan-500',
      text: 'text-cyan-600',
      gradient: {
        from: 'from-cyan-600',
        to: 'to-sky-600'
      }
    }
  },
  {
    id: 'crypto',
    title: 'Crypto',
    description: 'Cryptocurrency and blockchain educational resources.',
    path: '/services/crypto',
    icon: Bitcoin,
    color: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      gradient: {
        from: 'from-yellow-600',
        to: 'to-amber-600'
      }
    }
  }
];

export const getServiceById = (id: string): ServiceConfig | undefined => {
  return services.find(service => service.id === id);
};

export const getServiceByPath = (path: string): ServiceConfig | undefined => {
  // Remove trailing slash if present
  const normalizedPath = path.replace(/\/$/, '');
  return services.find(service => service.path === normalizedPath);
};

export default services;
