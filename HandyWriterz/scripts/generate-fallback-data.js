/**
 * This script generates fallback data for the application to use when the database is unavailable.
 * It creates JSON files with sample data that can be used as fallbacks for various database queries.
 */

const fs = require('fs');
const path = require('path');

// Create the fallback data directory if it doesn't exist
const fallbackDir = path.join(__dirname, '..', 'src', 'fallbacks');
if (!fs.existsSync(fallbackDir)) {
  fs.mkdirSync(fallbackDir, { recursive: true });
  console.log(`Created fallback directory at ${fallbackDir}`);
}

// Sample service types
const serviceTypes = [
  'adult-health-nursing',
  'mental-health-nursing',
  'child-nursing',
  'special-education',
  'social-work',
  'ai',
  'crypto'
];

// Generate sample posts for each service type
const generatePosts = (serviceType) => {
  const formattedServiceType = serviceType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return [
    {
      id: `${serviceType}-1`,
      title: `Introduction to ${formattedServiceType}`,
      content: `<p>Welcome to our ${formattedServiceType} service. This is a comprehensive guide to help you understand the basics and get started.</p><p>This content is being shown from our fallback system while we try to reconnect to the database.</p>`,
      author: 'HandyWriterz Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'published',
      service_type: serviceType,
      metadata: {
        views: 120,
        likes: 15,
        comments: 3,
        reading_time: '5 min'
      },
      resource_links: [
        'https://example.com/resource1',
        'https://example.com/resource2'
      ],
      profiles: {
        full_name: 'HandyWriterz Admin',
        avatar_url: 'https://ui-avatars.com/api/?name=HandyWriterz+Admin'
      }
    },
    {
      id: `${serviceType}-2`,
      title: `Best Practices in ${formattedServiceType}`,
      content: `<p>In this article, we cover the best practices and latest developments in ${formattedServiceType}.</p><p>This content is being shown from our fallback system while we try to reconnect to the database.</p>`,
      author: 'HandyWriterz Expert',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      status: 'published',
      service_type: serviceType,
      metadata: {
        views: 85,
        likes: 9,
        comments: 2,
        reading_time: '7 min'
      },
      resource_links: [
        'https://example.com/best-practices'
      ],
      profiles: {
        full_name: 'HandyWriterz Expert',
        avatar_url: 'https://ui-avatars.com/api/?name=HandyWriterz+Expert'
      }
    },
    {
      id: `${serviceType}-3`,
      title: `Case Studies: ${formattedServiceType}`,
      content: `<p>Learn from real-world examples and case studies in ${formattedServiceType}.</p><p>This content is being shown from our fallback system while we try to reconnect to the database.</p>`,
      author: 'HandyWriterz Researcher',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      status: 'published',
      service_type: serviceType,
      metadata: {
        views: 62,
        likes: 7,
        comments: 1,
        reading_time: '10 min'
      },
      resource_links: [],
      profiles: {
        full_name: 'HandyWriterz Researcher',
        avatar_url: 'https://ui-avatars.com/api/?name=HandyWriterz+Researcher'
      }
    }
  ];
};

// Generate sample profiles
const generateProfiles = () => {
  return [
    {
      id: 'admin-profile',
      user_id: 'admin-user',
      full_name: 'HandyWriterz Admin',
      avatar_url: 'https://ui-avatars.com/api/?name=HandyWriterz+Admin',
      website: 'https://handywriterz.com',
      bio: 'Administrator of HandyWriterz platform',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'expert-profile',
      user_id: 'expert-user',
      full_name: 'HandyWriterz Expert',
      avatar_url: 'https://ui-avatars.com/api/?name=HandyWriterz+Expert',
      website: null,
      bio: 'Content expert specializing in healthcare and education',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'researcher-profile',
      user_id: 'researcher-user',
      full_name: 'HandyWriterz Researcher',
      avatar_url: 'https://ui-avatars.com/api/?name=HandyWriterz+Researcher',
      website: null,
      bio: 'Research specialist with focus on case studies and analysis',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

// Generate all fallback data
const generateAllFallbackData = () => {
  // Generate posts for each service type
  serviceTypes.forEach(serviceType => {
    const posts = generatePosts(serviceType);
    const filePath = path.join(fallbackDir, `posts_${serviceType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(posts, null, 2));
    console.log(`Generated fallback posts for ${serviceType} at ${filePath}`);
  });
  
  // Generate profiles
  const profiles = generateProfiles();
  const profilesPath = path.join(fallbackDir, 'profiles.json');
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
  console.log(`Generated fallback profiles at ${profilesPath}`);
  
  // Generate a combined data file with all service types
  const allPosts = serviceTypes.flatMap(serviceType => generatePosts(serviceType));
  const allDataPath = path.join(fallbackDir, 'all_posts.json');
  fs.writeFileSync(allDataPath, JSON.stringify(allPosts, null, 2));
  console.log(`Generated combined fallback data at ${allDataPath}`);
  
  // Generate a README file explaining the fallback data
  const readmePath = path.join(fallbackDir, 'README.md');
  const readmeContent = `# Fallback Data

This directory contains fallback data for the application to use when the database is unavailable.

## Files

${serviceTypes.map(type => `- \`posts_${type}.json\`: Sample posts for the ${type} service`).join('\n')}
- \`profiles.json\`: Sample user profiles
- \`all_posts.json\`: Combined posts from all service types

## Usage

This data is automatically used by the application when the database connection fails.
The data is loaded through the \`useDatabaseQuery\` hook which implements fallback mechanisms.

## Regenerating Data

To regenerate this data, run:

\`\`\`
node scripts/generate-fallback-data.js
\`\`\`
`;
  
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Generated README at ${readmePath}`);
};

// Execute the generation
generateAllFallbackData();
console.log('Fallback data generation complete!'); 