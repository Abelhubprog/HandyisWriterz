-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'user',
  email text,
  preferences jsonb DEFAULT '{}'
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  email text
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  content text,
  image_url text,
  published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  author_id uuid REFERENCES auth.users(id),
  likes_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  meta_description text,
  meta_keywords text[],
  category text,
  status text DEFAULT 'draft',
  featured boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Allow public read access to profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin users policies
CREATE POLICY "Allow only admins to read admin users" ON admin_users
  FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

CREATE POLICY "Allow only admins to manage admin users" ON admin_users
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Services policies
CREATE POLICY "Allow public read access to published services" ON services
  FOR SELECT USING (published = true);

CREATE POLICY "Allow authenticated users to read all services" ON services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage all services" ON services
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
