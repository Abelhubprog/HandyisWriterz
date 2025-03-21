import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Book, Video, FileText, Users } from 'lucide-react';

const LearningHub = () => {
  const resources = [
    {
      title: 'Writing Guides',
      description: 'Comprehensive guides on academic writing, research methods, and citation styles.',
      icon: Book,
      link: '/resources/writing-guides'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video tutorials on writing, research, and academic skills.',
      icon: Video,
      link: '/resources/tutorials'
    },
    {
      title: 'Sample Papers',
      description: 'Examples of well-written academic papers across various disciplines.',
      icon: FileText,
      link: '/resources/samples'
    },
    {
      title: 'Study Groups',
      description: 'Join study groups and collaborate with other students.',
      icon: Users,
      link: '/resources/groups'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Learning Hub</h1>
        <p className="text-lg text-gray-600 mb-8">
          Access educational resources, tutorials, and study materials to enhance your academic journey.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <resource.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={resource.link}>Access Resource</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need help finding specific resources? Contact our support team.
          </p>
          <Button asChild>
            <a href="/contact">Contact Support</a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LearningHub;