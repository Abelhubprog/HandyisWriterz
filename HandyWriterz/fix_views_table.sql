-- Fix the views table by adding the missing status column
-- Run this in the Supabase SQL Editor to fix the "column status does not exist" error

-- Create the views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID,
  user_id UUID,
  service_type TEXT,
  view_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT
);

-- If the table already exists but is missing the status column, add it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'views'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'views' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.views ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END
$$;

-- Output confirmation
SELECT 
  'views' AS table_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'views' 
      AND column_name = 'status'
    ) THEN 'Status column exists'
    ELSE 'Status column does not exist'
  END AS status; 