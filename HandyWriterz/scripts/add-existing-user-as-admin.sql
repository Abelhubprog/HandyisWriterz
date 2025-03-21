-- This script adds an existing user to the admin_users table
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Replace 'user@example.com' with the email of the user you want to make an admin
DO $$
DECLARE
    user_id UUID;
    user_email TEXT := 'admin@handywriterz.com'; -- Change this to the user's email
BEGIN
    -- First, check if admin_users table exists and create it if not
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'admin_users'
    ) THEN
        CREATE TABLE public.admin_users (
            id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
            email VARCHAR UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Allow public read access"
            ON admin_users
            FOR SELECT
            USING (true);
        
        CREATE POLICY "Allow admin insert/update"
            ON admin_users
            FOR ALL
            USING (auth.uid() IN (SELECT id FROM admin_users));
            
        RAISE NOTICE 'Created admin_users table';
    ELSE
        RAISE NOTICE 'admin_users table already exists';
    END IF;

    -- Get the user ID
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    ELSE
        RAISE NOTICE 'Found user with ID: %', user_id;
        
        -- Update profile to have admin role if it exists
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE id = user_id;
        
        -- Check if user already exists in admin_users
        IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = user_id) THEN
            -- Add user to admin_users table
            INSERT INTO public.admin_users (
                id,
                email,
                created_at,
                updated_at
            ) VALUES (
                user_id,
                user_email,
                now(),
                now()
            );
            
            RAISE NOTICE 'Added user to admin_users table';
        ELSE
            RAISE NOTICE 'User already exists in admin_users table';
        END IF;
        
        RAISE NOTICE 'User % is now an admin', user_email;
    END IF;
END $$; 