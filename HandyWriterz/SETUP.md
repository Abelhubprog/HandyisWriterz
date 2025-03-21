# HandyWriterz - Setup Guide

This guide will help you set up the HandyWriterz application with Appwrite as the backend service.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Appwrite account and project

## Environment Setup

1. Create a `.env` file in the root of your project with the following variables:

```env
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_API_KEY=your-api-key
VITE_APPWRITE_DATABASE_ID=your-database-id

# Admin User (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=yourpassword123
ADMIN_NAME=Admin User
```

2. Install dependencies:

```bash
npm install
```

## Database Setup

To initialize the database with all required collections, run:

```bash
node src/scripts/setupDBCli.js
```

This script will:
- Create a database in Appwrite (if it doesn't exist)
- Set up all necessary collections (posts, comments, likes, etc.)
- Create storage buckets for media, documents, and avatars
- Initialize default categories for each service
- Create an admin user (if credentials are provided in .env)

## Admin User Creation

If you didn't provide admin credentials in the .env file, or need to create another admin user, you can run:

```bash
npx ts-node src/scripts/createAdmin.ts
```

This script will prompt you for the admin email, password, and name.

## Service Pages

The application includes four main service pages:

1. **Adult Health Nursing**
   - URL: `/services/adult-health-nursing`
   - Content related to adult healthcare nursing

2. **Mental Health Nursing**
   - URL: `/services/mental-health-nursing`
   - Resources for mental health nursing professionals

3. **Child Nursing**
   - URL: `/services/child-nursing`
   - Pediatric nursing resources and information

4. **Cryptocurrency Analysis**
   - URL: `/services/cryptocurrency`
   - Market analysis and crypto investment insights

## Admin Dashboard

Administrators can manage content through the admin dashboard:

- URL: `/admin/dashboard`
- Features:
  - Post management (create, edit, delete)
  - Category management
  - User management
  - Comment moderation
  - Media library
  - Analytics

Access requires admin credentials.

## Development

To start the development server:

```bash
npm run dev
```

## Production Build

To create a production build:

```bash
npm run build
```

## Troubleshooting

If you encounter issues during setup:

1. **Database Creation Fails**
   - Ensure your Appwrite API key has the necessary permissions
   - Check that the DATABASE_ID is valid or doesn't already exist

2. **Admin Creation Fails**
   - Password must be at least 8 characters
   - Email must be valid and not already in use

3. **Connection Issues**
   - Verify your Appwrite endpoint and project ID are correct
   - Check network connectivity to Appwrite servers

## Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [HandyWriterz GitHub Repository](https://github.com/your-username/handywriterz) 