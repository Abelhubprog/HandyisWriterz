-- Create tables for HandyWriterz admin dashboard and content management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  content_blocks JSONB,
  service_type TEXT,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  featured_image TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  media_type TEXT,
  media_url TEXT,
  featured BOOLEAN DEFAULT false
);

-- Add unique constraint for service+slug combination
CREATE UNIQUE INDEX IF NOT EXISTS posts_service_slug_key ON public.posts (service_type, slug) WHERE status <> 'archived';

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  service TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add unique constraint for service+slug combination
CREATE UNIQUE INDEX IF NOT EXISTS categories_service_slug_key ON public.categories (service, slug);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Views table for analytics
CREATE TABLE IF NOT EXISTS public.views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_type TEXT,
  view_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT
);

-- Likes table for analytics
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unique constraint to prevent duplicate likes
CREATE UNIQUE INDEX IF NOT EXISTS likes_post_user_key ON public.likes (post_id, user_id);

-- Service settings table
CREATE TABLE IF NOT EXISTS public.service_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  banner_image TEXT,
  icon TEXT,
  featured_content UUID[],
  display_options JSONB,
  seo JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only admins can delete profiles"
  ON public.profiles
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Posts RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts
  FOR SELECT USING (status = 'published' OR auth.uid() = author_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'editor')));

CREATE POLICY "Only authors, editors, and admins can modify posts"
  ON public.posts
  FOR ALL USING (
    auth.uid() = author_id OR 
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'editor'))
  );

-- Categories RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins and editors can modify categories"
  ON public.categories
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'editor'))
  );

-- Comments RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are viewable by everyone"
  ON public.comments
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'editor')));

CREATE POLICY "Users can create comments"
  ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Only admins and editors can delete comments"
  ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'editor'))
  );

-- Views RLS
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins and editors can view analytics"
  ON public.views
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'editor'))
  );

CREATE POLICY "Anyone can insert views"
  ON public.views
  FOR INSERT WITH CHECK (true);

-- Likes RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create likes"
  ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Service settings RLS
ALTER TABLE public.service_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service settings are viewable by everyone"
  ON public.service_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify service settings"
  ON public.service_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Create trigger functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_settings_updated_at
BEFORE UPDATE ON public.service_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update last_viewed_at when incrementing view count
CREATE OR REPLACE FUNCTION update_last_viewed_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_viewed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_views_last_viewed_at
BEFORE UPDATE ON public.views
FOR EACH ROW
EXECUTE FUNCTION update_last_viewed_at();

-- Create function to update publish_at when status changes to published
CREATE OR REPLACE FUNCTION update_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_published_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_published_at(); 