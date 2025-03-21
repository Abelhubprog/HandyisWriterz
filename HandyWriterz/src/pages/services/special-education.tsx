import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ServicePage from './ServicePage';
import { ServicePage as ServicePageType } from '@/types/databaseTypes';
import DatabaseService from '@/services/databaseService';

const SpecialEducationPage: React.FC = () => {
  const [initialData, setInitialData] = useState<ServicePageType | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await DatabaseService.fetchServicePageBySlug('special-education');
        setInitialData(data);
      } catch (error) {
        console.error('Error loading special education page:', error);
      }
    };

    loadInitialData();
  }, []);

  return (
    <>
      <Helmet>
        <title>Special Education Services | HandyWriterz</title>
        <meta name="description" content="Comprehensive special education resources and support services. Expert guidance on individualized education programs, learning strategies, and inclusive practices." />
      </Helmet>
      <ServicePage initialData={initialData} />
    </>
  );
};

export default SpecialEducationPage;
