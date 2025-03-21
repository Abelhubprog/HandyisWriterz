# HandyWriterz Deployment Guide

This document outlines the steps to deploy the HandyWriterz application to production.

## Prerequisites

- Node.js v16+ and pnpm installed on the deployment machine
- Access to production environment variables
- Access to the following services:
  - Appwrite Cloud account
  - Supabase account (if using Supabase)
  - Clerk authentication account
  - Domain and hosting provider

## Step 1: Prepare Environment Variables

1. Ensure all necessary environment variables from `.env.production` are available in your production environment.
2. Critical secrets to set in your deployment platform's environment variables:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `APPWRITE_API_KEY`
   - `COINBASE_COMMERCE_API_KEY`
   - `COINBASE_PUBLIC_KEY`
   - `COINBASE_COMMERCE_WEBHOOK_SECRET`
   - `PUBLIC_ONCHAINKIT_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHANNEL_ID`

## Step 2: Build the Application

1. Clone the repository to your deployment machine or CI/CD environment
2. Install dependencies:
```bash
pnpm install
```
3. Build the application:
```bash
pnpm build
```
4. The built files will be generated in the `dist` directory

## Step 3: Set Up Backend Services

### Appwrite Setup

1. Configure Appwrite collections and buckets:
```bash
pnpm run setup-appwrite-db-ultimate
pnpm run create-final-collections
pnpm run setup-appwrite-storage
pnpm run create-buckets
```

2. Create an admin user:
```bash
pnpm run create-appwrite-admin
```

### Database Setup (If using Supabase)

1. Initialize Supabase:
```bash
pnpm run init-supabase
```

2. Run any required migrations:
```bash
pnpm run run-migrations
```

## Step 4: Deploy to Hosting Provider

### Option 1: Deploying to Vercel

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
3. Add all environment variables from `.env.production` to Vercel project settings
4. Deploy

### Option 2: Deploying to Netlify

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build Command: `pnpm build`
   - Publish Directory: `dist`
3. Add all environment variables from `.env.production` to Netlify project settings
4. Deploy

### Option 3: Traditional Hosting

1. Upload the contents of the `dist` directory to your web server
2. Configure your web server to serve the application:
   - Set up proper caching headers for static assets
   - Configure HTTPS
   - Set up URL rewriting to handle client-side routing (all requests should be directed to index.html)

## Step 5: Configure Domains and DNS

1. Point your domain(s) to your hosting provider:
   - Main domain: handywriterz.com
   - Admin subdomain (if separate): admin.handywriterz.com
   - Accounts subdomain (if separate): accounts.handywriterz.com

2. Configure SSL certificates for all domains

## Step 6: Post-Deployment Verification

1. Verify the application is accessible at the configured domain(s)
2. Test login functionality
3. Test all critical application features:
   - User registration
   - Content creation
   - File uploads
   - Payment processing
   - Administrative functions
4. Check error logging and monitoring

## Step 7: Production Monitoring and Maintenance

1. Set up application monitoring and logging
2. Configure automated backups for your databases
3. Set up continuous deployment for future updates
4. Document regular maintenance procedures

## Troubleshooting

### Common Issues

1. **API Connection Issues**: Verify environment variables for API endpoints and authentication are correct

2. **Authentication Problems**: Ensure Clerk keys are properly configured

3. **Database Connection Failures**: Check database connection strings and credentials

4. **CORS Errors**: Verify the domains in the CORS settings match your production domains

### Support Resources

For help with deployment issues, refer to:
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)

## Security Considerations

1. Ensure all sensitive environment variables are securely stored
2. Configure proper Content Security Policy headers
3. Enable HTTPS for all connections
4. Regularly update dependencies for security patches
5. Configure rate limiting for API endpoints
6. Implement proper authentication checks for all sensitive routes 