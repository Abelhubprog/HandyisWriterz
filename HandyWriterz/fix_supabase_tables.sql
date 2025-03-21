-- Comprehensive database schema fix for HandyWriterz

-- 1. Check if views table exists and add missing status column if needed
DO $$
BEGIN
  -- Create views table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'views'
  ) THEN
    CREATE TABLE public.views (
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
    
    RAISE NOTICE 'Created views table';
  ELSE
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'views' 
      AND column_name = 'status'
    ) THEN
      ALTER TABLE public.views ADD COLUMN status TEXT DEFAULT 'active';
      RAISE NOTICE 'Added status column to views table';
    ELSE
      RAISE NOTICE 'Status column already exists in views table';
    END IF;
  END IF;
  
  -- 2. Check if post_views table exists and create if needed
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_views'
  ) THEN
    -- Create post_views table referenced in analyticsService.ts
    CREATE TABLE public.post_views (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID,
      user_id UUID,
      view_count INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created post_views table';
  END IF;
  
  -- 3. Create other missing tables referenced in analyticsService
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_likes'
  ) THEN
    CREATE TABLE public.post_likes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID,
      user_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created post_likes table';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_shares'
  ) THEN
    CREATE TABLE public.post_shares (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID,
      user_id UUID,
      platform TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created post_shares table';
  END IF;
  
  -- 4. Create indexes for performance
  IF NOT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'views' 
    AND indexname = 'views_post_id_idx'
  ) THEN
    CREATE INDEX views_post_id_idx ON public.views(post_id);
    CREATE INDEX views_service_type_idx ON public.views(service_type);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'post_views' 
    AND indexname = 'post_views_post_id_idx'
  ) THEN
    CREATE INDEX post_views_post_id_idx ON public.post_views(post_id);
  END IF;
  
END;
$$;

-- Show tables with their columns for verification
SELECT 
  table_name, 
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND 
  table_name IN ('views', 'post_views', 'post_likes', 'post_shares')
GROUP BY 
  table_name
ORDER BY 
  table_name; 