-- Create admin_users table for admin role management
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table for user profiles and roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table for service pages content
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content JSONB,
  featured_image TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_likes table for authenticated user likes
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, user_id)
);

-- Create content_anonymous_likes table for anonymous likes
CREATE TABLE IF NOT EXISTS content_anonymous_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address TEXT,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_shares table for social sharing
CREATE TABLE IF NOT EXISTS content_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  user_id TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table for authenticated user comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media table for media library
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to increment anonymous likes
CREATE OR REPLACE FUNCTION increment_anonymous_likes(
  p_service_id UUID,
  p_session_id TEXT,
  p_ip_address TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO content_anonymous_likes (service_id, session_id, ip_address)
  VALUES (p_service_id, p_session_id, p_ip_address)
  ON CONFLICT (id) DO UPDATE
  SET count = content_anonymous_likes.count + 1,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get content interactions
CREATE OR REPLACE FUNCTION get_content_interactions(p_service_id UUID)
RETURNS TABLE (
  authenticated_likes BIGINT,
  anonymous_likes BIGINT,
  total_shares BIGINT,
  total_comments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM content_likes WHERE service_id = p_service_id) AS authenticated_likes,
    (SELECT SUM(count) FROM content_anonymous_likes WHERE service_id = p_service_id) AS anonymous_likes,
    (SELECT COUNT(*) FROM content_shares WHERE service_id = p_service_id) AS total_shares,
    (SELECT COUNT(*) FROM comments WHERE service_id = p_service_id AND is_approved = TRUE) AS total_comments;
END;
$$ LANGUAGE plpgsql;

-- Create function to get public interaction stats
CREATE OR REPLACE FUNCTION get_public_interaction_stats()
RETURNS TABLE (
  service_id UUID,
  service_title TEXT,
  total_likes BIGINT,
  total_shares BIGINT,
  total_comments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS service_id,
    s.title AS service_title,
    (
      (SELECT COUNT(*) FROM content_likes WHERE service_id = s.id) +
      COALESCE((SELECT SUM(count) FROM content_anonymous_likes WHERE service_id = s.id), 0)
    ) AS total_likes,
    (SELECT COUNT(*) FROM content_shares WHERE service_id = s.id) AS total_shares,
    (SELECT COUNT(*) FROM comments WHERE service_id = s.id AND is_approved = TRUE) AS total_comments
  FROM services s
  WHERE s.is_published = TRUE
  ORDER BY total_likes DESC, total_shares DESC;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS) policies

-- Enable Row Level Security on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_anonymous_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Public can read published services" ON services
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins can perform all operations on services" ON services
  USING (EXISTS (SELECT 1 FROM admin_users WHERE clerk_user_id = auth.uid()));

-- Comments policies
CREATE POLICY "Public can read approved comments" ON comments
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all comments" ON comments
  USING (EXISTS (SELECT 1 FROM admin_users WHERE clerk_user_id = auth.uid()));

-- Likes policies
CREATE POLICY "Public can read likes count" ON content_likes
  FOR SELECT TO PUBLIC;

CREATE POLICY "Authenticated users can like content" ON content_likes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can remove their own likes" ON content_likes
  FOR DELETE USING (user_id = auth.uid());

-- Anonymous likes policies
CREATE POLICY "Public can view anonymous likes" ON content_anonymous_likes
  FOR SELECT TO PUBLIC;

-- Content shares policies
CREATE POLICY "Public can view content shares" ON content_shares
  FOR SELECT TO PUBLIC;

CREATE POLICY "Anyone can share content" ON content_shares
  FOR INSERT TO PUBLIC;

-- Media policies
CREATE POLICY "Public can view media" ON media
  FOR SELECT TO PUBLIC;

CREATE POLICY "Authenticated users can upload media" ON media
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all media" ON media
  USING (EXISTS (SELECT 1 FROM admin_users WHERE clerk_user_id = auth.uid()));

-- Admin users policies
CREATE POLICY "Admins can view admin users" ON admin_users
  USING (EXISTS (SELECT 1 FROM admin_users WHERE clerk_user_id = auth.uid()));

CREATE POLICY "Admins can manage admin users" ON admin_users
  USING (EXISTS (SELECT 1 FROM admin_users WHERE clerk_user_id = auth.uid()));

-- Profiles policies
CREATE POLICY "Public can view profiles" ON profiles
  FOR SELECT TO PUBLIC;

CREATE POLICY "Users can update their own profiles" ON profiles
  FOR UPDATE USING (clerk_user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON profiles
  USING (EXISTS (SELECT 1 FROM admin_users WHERE clerk_user_id = auth.uid()));
