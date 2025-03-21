-- This script adds an admin user to the system
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- First, check if admin_users table exists and create it if not
DO $$
BEGIN
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
END $$;

-- Check if admin user exists in auth.users
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Check if admin user exists
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@handywriterz.com';
    
    -- If admin doesn't exist, create it
    IF admin_id IS NULL THEN
        -- Create admin user in auth.users
        INSERT INTO auth.users (
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud,
            confirmed_at
        ) VALUES (
            'admin@handywriterz.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Admin User", "role": "admin"}',
            now(),
            now(),
            'authenticated',
            'authenticated',
            now()
        ) RETURNING id INTO admin_id;
        
        RAISE NOTICE 'Created admin user with ID: %', admin_id;
        
        -- Create profile for admin
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            admin_id,
            'admin@handywriterz.com',
            'Admin User',
            'admin',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created admin profile';
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_id;
    END IF;
    
    -- Check if admin exists in admin_users table
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = admin_id) THEN
        -- Add admin to admin_users table
        INSERT INTO public.admin_users (
            id,
            email,
            created_at,
            updated_at
        ) VALUES (
            admin_id,
            'admin@handywriterz.com',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Added user to admin_users table';
    ELSE
        RAISE NOTICE 'Admin user already exists in admin_users table';
    END IF;
    
    RAISE NOTICE 'Admin user setup completed successfully!';
    RAISE NOTICE 'You can now log in with:';
    RAISE NOTICE 'Email: admin@handywriterz.com';
    RAISE NOTICE 'Password: admin123';
END $$; 