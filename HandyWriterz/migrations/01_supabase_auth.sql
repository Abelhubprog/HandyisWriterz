-- Drop existing policies before modifying tables
DROP POLICY IF EXISTS "Public can read published services" ON services;
DROP POLICY IF EXISTS "Admins can perform all operations on services" ON services;
DROP POLICY IF EXISTS "Public can read approved comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON comments;
DROP POLICY IF EXISTS "Public can read likes count" ON content_likes;
DROP POLICY IF EXISTS "Authenticated users can like content" ON content_likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON content_likes;
DROP POLICY IF EXISTS "Public can view anonymous likes" ON content_anonymous_likes;
DROP POLICY IF EXISTS "Public can view content shares" ON content_shares;
DROP POLICY IF EXISTS "Anyone can share content" ON content_shares;
DROP POLICY IF EXISTS "Public can view media" ON media;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON media;
DROP POLICY IF EXISTS "Admins can manage all media" ON media;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Drop and recreate profiles table for Supabase auth
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate admin_users table for Supabase auth
DROP TABLE IF EXISTS admin_users CASCADE;
CREATE TABLE admin_users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_anonymous_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies for Supabase auth

-- Profiles policies
CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admin policies
CREATE POLICY "Admins can do all"
ON profiles
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  )
);

-- Services policies
CREATE POLICY "Public can read published services"
ON services FOR SELECT
TO public
USING (is_published = TRUE);

CREATE POLICY "Admins can manage all services"
ON services
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  )
);

-- Comments policies
CREATE POLICY "Public can read approved comments"
ON comments FOR SELECT
TO public
USING (is_approved = TRUE);

CREATE POLICY "Users can create comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

-- Likes policies
CREATE POLICY "Users can manage own likes"
ON content_likes
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Media policies
CREATE POLICY "Public can view media"
ON media FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can upload media"
ON media FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid()::text);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user',
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
