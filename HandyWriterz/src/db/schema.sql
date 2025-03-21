-- src/db/schema.sql
-- HandyWriterz Database Schema for Supabase

-- Enable Row Level Security
ALTER DATABASE postgres SET "anon.role" TO 'anon';
ALTER DATABASE postgres SET "service_role.role" TO 'service_role';

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable full-text search capabilities
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table (for quick admin checks)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service pages table (main categories)
CREATE TABLE IF NOT EXISTS public.service_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  featured_image TEXT,
  banner_image TEXT,
  icon TEXT,
  color_scheme TEXT DEFAULT 'from-blue-600 to-purple-600',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Categories for blog posts
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  service_type TEXT REFERENCES public.service_pages(slug) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags for blog posts
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  service_type TEXT NOT NULL REFERENCES public.service_pages(slug) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  featured_image TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', NULL)),
  media_url TEXT,
  read_time INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  tags TEXT[],
  UNIQUE(slug, service_type)
);

-- Create a GIN index for full-text search on blog posts
CREATE INDEX IF NOT EXISTS blog_posts_fts_idx ON public.blog_posts USING GIN (
  to_tsvector('english', coalesce(title, '') || ' ' || 
  coalesce(excerpt, '') || ' ' || 
  coalesce(content, ''))
);

-- Create index on service_type for faster filtering
CREATE INDEX IF NOT EXISTS blog_posts_service_type_idx ON public.blog_posts (service_type);

-- Create index on published status and date for faster listing
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (is_published, published_at DESC) 
WHERE is_published = TRUE;

-- Post likes table (supports anonymous likes)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- For anonymous users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, session_id)
);

-- Comments table (requires authentication)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media library
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_pages_updated_at
BEFORE UPDATE ON public.service_pages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at
BEFORE UPDATE ON public.media
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check database connection
CREATE OR REPLACE FUNCTION check_connection()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

-- Profiles: Anyone can read, only the user or admin can update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admin users can update any profile"
ON public.profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Service Pages: Anyone can read published pages, only admins can modify
ALTER TABLE public.service_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published service pages are viewable by everyone"
ON public.service_pages FOR SELECT
USING (is_published OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can insert service pages"
ON public.service_pages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can update service pages"
ON public.service_pages FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete service pages"
ON public.service_pages FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Blog Posts: Anyone can read published posts, only admins can modify
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published blog posts are viewable by everyone"
ON public.blog_posts FOR SELECT
USING (is_published OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can insert blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can update blog posts"
ON public.blog_posts FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete blog posts"
ON public.blog_posts FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Post Likes: Anyone can like posts
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own likes"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id OR session_id = (SELECT current_setting('request.headers')::json->>'anonymous-session-id', true));

CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT
USING (true);

-- Comments: Anyone can read approved comments, only authenticated users can create
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments"
ON public.comments FOR SELECT
USING (is_approved OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any comment"
ON public.comments FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.comments FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Categories and Tags: Anyone can read, only admins can modify
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify categories"
ON public.categories FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Anyone can view tags"
ON public.tags FOR SELECT
USING (true);

CREATE POLICY "Only admins can modify tags"
ON public.tags FOR ALL
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Media: Anyone can view, only admins can modify
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media"
ON public.media FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert media"
ON public.media FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can update media"
ON public.media FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "Only admins can delete media"
ON public.media FOR DELETE
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Activity Log: Only admins can view
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view activity logs"
ON public.activity_log FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

CREATE POLICY "System can insert activity logs"
ON public.activity_log FOR INSERT
WITH CHECK (true);

-- Create function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.activity_log (
    user_id, action, entity_type, entity_id, details,
    ip_address, user_agent
  ) VALUES (
    p_user_id, p_action, p_entity_type, p_entity_id, p_details,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 