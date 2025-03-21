-- Seed initial services data
INSERT INTO services (title, slug, description, content, published, status, category, featured)
VALUES 
  (
    'Adult Health Nursing',
    'adult-health-nursing',
    'Expert support for adult nursing students',
    'Our adult health nursing service provides comprehensive support for nursing students, including help with case studies, care plans, and evidence-based practice. We offer guidance on clinical assessments, patient care documentation, and nursing interventions.',
    true,
    'published',
    'nursing',
    true
  ),
  (
    'Mental Health Nursing',
    'mental-health-nursing',
    'Specialized mental health nursing assistance',
    'Get expert help with mental health nursing assignments and research. Our service covers psychiatric assessments, therapeutic interventions, and mental health care planning. We provide support for understanding complex psychological concepts and their clinical applications.',
    true,
    'published',
    'nursing',
    true
  ),
  (
    'Child Nursing',
    'child-nursing',
    'Dedicated pediatric nursing support',
    'Professional assistance with pediatric nursing coursework and case studies. We help with understanding child development, family-centered care, and pediatric health assessment. Get support with care planning for children with various health conditions.',
    true,
    'published',
    'nursing',
    true
  ),
  (
    'Special Education',
    'special-education',
    'Comprehensive SEN education support',
    'Expert guidance for special education professionals and students. Our service covers individualized education plans (IEPs), behavioral interventions, and inclusive teaching strategies. Get help with assessment methods and educational adaptations.',
    true,
    'published',
    'education',
    true
  ),
  (
    'Social Work',
    'social-work',
    'Professional social work writing assistance',
    'Comprehensive support for social work students and professionals. We help with case management, social assessments, and intervention planning. Get assistance with understanding social policies and their practical applications.',
    true,
    'published',
    'social-work',
    true
  ),
  (
    'AI Services',
    'ai-services',
    'Advanced AI-powered academic solutions',
    'Cutting-edge AI assistance for academic writing and research. Our service leverages artificial intelligence to help with content analysis, research synthesis, and academic writing enhancement. Get smart suggestions and insights for your academic work.',
    true,
    'published',
    'technology',
    true
  ),
  (
    'Crypto',
    'crypto',
    'Blockchain and cryptocurrency services',
    'Expert guidance on blockchain technology and cryptocurrency topics. We provide support for understanding digital currencies, blockchain architecture, and decentralized systems. Get help with technical analysis and crypto market research.',
    true,
    'published',
    'technology',
    true
  );
