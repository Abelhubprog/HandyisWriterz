# Supabase Integration Setup Guide

This guide explains how to set up and use the Supabase integration for HandyWriterz.

## Prerequisites

- Node.js 16+ installed
- Supabase project created at [supabase.com](https://supabase.com)
- Supabase project URL and API keys

## Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_ADMIN_EMAIL=your_admin_email
```

Replace the placeholders with your actual Supabase project details.

## Database Initialization

Run the following command to initialize the database with required tables and policies:

```bash
npm run init-supabase
```

This will:
1. Create the required tables if they don't exist
2. Set up Row Level Security (RLS) policies
3. Configure user roles (admin, user, editor)
4. Add the admin user if specified in the environment variables

## User Roles

The application supports the following user roles:

- **Admin**: Full access to all features and admin dashboard
- **User**: Standard user access
- **Editor**: Enhanced user access with content editing capabilities

## Authentication

The application uses Supabase Authentication for user management:

- **Login**: Email/password authentication
- **Signup**: Email/password registration with optional profile details
- **Password Reset**: Email-based password recovery
- **Magic Link**: Passwordless authentication via email

## Database Schema

The main tables in the database are:

- **profiles**: User profiles with role information
- **admin_users**: Admin user registry

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check the browser console for error messages
2. Verify your environment variables are correctly set
3. Ensure your Supabase project is properly configured
4. Run the database initialization script again if tables are missing

## Manual Database Setup

If you prefer to set up the database manually, you can use the Supabase web UI:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create the required tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'user',
  email TEXT,
  preferences JSONB DEFAULT '{}'
);

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow full access for admins" ON profiles
  FOR ALL
  TO authenticated
  USING (role = 'admin')
  WITH CHECK (role = 'admin');

CREATE POLICY "Allow users to read all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins to manage admin_users" ON admin_users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 