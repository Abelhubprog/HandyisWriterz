-- Fix the views table by ensuring it exists with a status column
DO $$
BEGIN
    -- Check if the views table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'views'
    ) THEN
        -- Table exists, check if status column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'views' 
            AND column_name = 'status'
        ) THEN
            -- Add status column to existing table
            ALTER TABLE public.views ADD COLUMN status TEXT DEFAULT 'active';
        END IF;
    ELSE
        -- Create views table with status column
        CREATE TABLE public.views (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
            service_type TEXT,
            view_count INTEGER DEFAULT 1,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            user_agent TEXT,
            ip_address TEXT,
            referrer TEXT
        );
    END IF;
END
$$; 