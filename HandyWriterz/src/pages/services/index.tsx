import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Brain, 
  Heart, 
  BookOpen, 
  Users, 
  Sparkles, 
  Stethoscope,
  Baby,
  HeartHandshake,
  Puzzle,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { Helmet } from 'react-helmet-async';

interface ServiceItem {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  color: string;
  textColor: string;
  bgColor: string;
}

const services: ServiceItem[] = [
  {
    icon: Heart,
    title: "Adult Health Nursing",
    description: "Professional nursing services for adult healthcare needs.",
    path: "/services/adult-health-nursing",
    color: "from-red-500/10 to-red-600/5",
    textColor: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    icon: Brain,
    title: "Mental Health Nursing",
    description: "Specialized care for mental health and wellness.",
    path: "/services/mental-health-nursing",
    color: "from-purple-500/10 to-purple-600/5",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: Baby,
    title: "Child Nursing",
    description: "Dedicated nursing care for children and pediatric needs.",
    path: "/services/child-nursing",
    color: "from-blue-500/10 to-blue-600/5",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Puzzle,
    title: "Special Education",
    description: "Specialized educational services and support.",
    path: "/services/special-education",
    color: "from-emerald-500/10 to-emerald-600/5",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    icon: Users,
    title: "Social Work",
    description: "Professional social work and community support services.",
    path: "/services/social-work",
    color: "from-amber-500/10 to-amber-600/5",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  {
    icon: Stethoscope,
    title: "Advanced Practice Nursing",
    description: "Specialized resources for nurse practitioners and advanced clinicians.",
    path: "/services/advanced-practice-nursing",
    color: "from-indigo-500/10 to-indigo-600/5",
    textColor: "text-indigo-600",
    bgColor: "bg-indigo-50"
  },
  {
    icon: HeartHandshake,
    title: "Mental Health Counseling",
    description: "Therapeutic approaches and counseling resources for mental health professionals.",
    path: "/services/mental-health-counseling",
    color: "from-violet-500/10 to-violet-600/5",
    textColor: "text-violet-600",
    bgColor: "bg-violet-50"
  },
  {
    icon: Baby,
    title: "Midwifery",
    description: "Comprehensive support for pregnancy, childbirth, and women's health.",
    path: "/services/midwifery",
    color: "from-pink-500/10 to-pink-600/5",
    textColor: "text-pink-600",
    bgColor: "bg-pink-50"
  },
  {
    icon: Sparkles,
    title: "AI Services",
    description: "Advanced AI-powered solutions and assistance.",
    path: "/services/ai",
    color: "from-sky-500/10 to-sky-600/5",
    textColor: "text-sky-600",
    bgColor: "bg-sky-50"
  }
];

const ServicesPage: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Helmet>
        <title>Academic Support Services | HandyWriterz</title>
        <meta name="description" content="Comprehensive academic support across multiple disciplines, tailored to your specific needs. Expert assistance from qualified professionals in nursing, healthcare, education, and more." />
        <meta name="keywords" content="academic services, nursing support, healthcare resources, education assistance, professional writing, academic help" />
      </Helmet>
      
      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Our Academic</span>
              <span className="block text-blue-600">Support Services</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Comprehensive academic support across multiple disciplines, tailored to your specific needs.
              Expert assistance from qualified professionals in nursing, healthcare, education, and more.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="px-8 py-3 text-lg">
                <Link to="/services/adult-health-nursing">
                  Explore Our Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link key={index} to={service.path} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-lg border-2 hover:border-blue-500">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${service.textColor}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="mt-2">{service.description}</CardDescription>
                    <div className={`mt-4 flex items-center ${service.textColor} text-sm font-medium`}>
                      Learn more
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Why Choose Our Services?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-blue-600 mb-4">
                <Users className="h-8 w-8 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Expert Writers</h3>
              <p className="text-gray-600">Qualified professionals with extensive experience in their fields</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-blue-600 mb-4">
                <BookOpen className="h-8 w-8 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quality Assured</h3>
              <p className="text-gray-600">Rigorous quality control and plagiarism checks for all work</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-blue-600 mb-4">
                <Heart className="h-8 w-8 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock assistance for all your academic needs</p>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Admin Actions</h2>
            <div className="flex gap-4">
              <Link
                to="/admin/content"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Manage Content
              </Link>
              <Link
                to="/admin/services"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Manage Services
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage; 