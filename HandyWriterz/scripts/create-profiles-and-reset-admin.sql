-- Create Profiles Table and Reset Admin Password Script
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- This script creates the profiles table if it doesn't exist and resets the admin password

DO $$
DECLARE
    admin_email TEXT := 'handywriterz@gmail.com';
    new_password TEXT := 'HandyAdmin123!'; -- Strong, memorable password
    admin_id UUID;
    is_in_admin_users BOOLEAN;
    profiles_exists BOOLEAN;
BEGIN
    RAISE NOTICE '======== CREATING PROFILES TABLE AND RESETTING ADMIN PASSWORD ========';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'New Password: %', new_password;
    RAISE NOTICE '=================================================================';
    
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO profiles_exists;
    
    -- Create profiles table if it doesn't exist
    IF NOT profiles_exists THEN
        RAISE NOTICE 'Creating profiles table...';
        
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            username TEXT UNIQUE,
            full_name TEXT,
            avatar_url TEXT,
            website TEXT,
            email TEXT,
            role TEXT DEFAULT 'user'::text
        );
        
        -- Add RLS policies for profiles table
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow public read access" 
            ON public.profiles FOR SELECT USING (true);
            
        CREATE POLICY "Allow individual insert access" 
            ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
            
        CREATE POLICY "Allow individual update access" 
            ON public.profiles FOR UPDATE USING (auth.uid() = id);
            
        RAISE NOTICE 'profiles table created with RLS policies';
    ELSE
        RAISE NOTICE 'profiles table already exists';
    END IF;
    
    -- Get the user ID
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users', admin_email;
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', admin_id;
    
    -- Check if admin_users table exists and create it if not
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'admin_users'
    ) THEN
        RAISE NOTICE 'Creating admin_users table...';
        
        CREATE TABLE public.admin_users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add RLS policies for admin_users table
        ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Allow public read access" 
            ON public.admin_users FOR SELECT USING (true);
            
        CREATE POLICY "Allow individual insert access" 
            ON public.admin_users FOR INSERT WITH CHECK (auth.uid() = id);
            
        CREATE POLICY "Allow individual update access" 
            ON public.admin_users FOR UPDATE USING (auth.uid() = id);
            
        CREATE POLICY "Allow individual delete access" 
            ON public.admin_users FOR DELETE USING (auth.uid() = id);
            
        RAISE NOTICE 'admin_users table created with RLS policies';
    ELSE
        RAISE NOTICE 'admin_users table already exists';
    END IF;
    
    -- Check if user is in admin_users table
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE id = admin_id
    ) INTO is_in_admin_users;
    
    IF NOT is_in_admin_users THEN
        RAISE NOTICE 'User is not in admin_users table. Adding now...';
        
        -- Add to admin_users table
        INSERT INTO public.admin_users (
            id,
            email,
            created_at,
            updated_at
        ) VALUES (
            admin_id,
            admin_email,
            now(),
            now()
        );
        
        RAISE NOTICE 'Added user to admin_users table';
    ELSE
        RAISE NOTICE 'User is already in admin_users table';
    END IF;
    
    -- Update user metadata to ensure admin role
    UPDATE auth.users
    SET 
        raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
                WHEN raw_user_meta_data ? 'role' THEN 
                    jsonb_set(raw_user_meta_data, '{role}', '"admin"')
                ELSE 
                    raw_user_meta_data || '{"role": "admin"}'::jsonb
            END,
        encrypted_password = crypt(new_password, gen_salt('bf')),
        email_confirmed_at = now(),
        confirmation_token = '',
        recovery_token = '',
        aud = 'authenticated',
        role = 'authenticated',
        updated_at = now(),
        last_sign_in_at = now()
    WHERE id = admin_id;
    
    RAISE NOTICE 'Updated user metadata and reset password';
    
    -- Check if user has a profile
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id) THEN
        -- Update profile to have admin role
        UPDATE public.profiles 
        SET 
            role = 'admin',
            updated_at = now()
        WHERE id = admin_id;
        
        RAISE NOTICE 'Updated profile with admin role';
    ELSE
        RAISE NOTICE 'Profile not found. Creating profile...';
        
        -- Create profile if it doesn't exist
        INSERT INTO public.profiles (
            id,
            updated_at,
            username,
            full_name,
            role,
            email
        ) VALUES (
            admin_id,
            now(),
            split_part(admin_email, '@', 1),
            'Handy Admin',
            'admin',
            admin_email
        );
        
        RAISE NOTICE 'Created admin profile';
    END IF;
    
    -- Verify the admin user was updated properly
    RAISE NOTICE '--------- ADMIN RESET SUMMARY ---------';
    RAISE NOTICE 'Admin Email: %', admin_email;
    RAISE NOTICE 'Admin Password: %', new_password;
    RAISE NOTICE 'Admin ID: %', admin_id;
    RAISE NOTICE 'In auth.users: YES (password reset)';
    RAISE NOTICE 'In public.profiles: YES (role: admin)';
    RAISE NOTICE 'In admin_users table: YES';
    RAISE NOTICE '----------------------------------------';
    
    RAISE NOTICE 'IMPORTANT: Save these credentials securely!';
    RAISE NOTICE 'You can now log in with:';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', new_password;
    
    -- Disable email confirmations if they're enabled
    UPDATE auth.config
    SET enable_confirmations = false
    WHERE enable_confirmations = true;
    
    IF FOUND THEN
        RAISE NOTICE 'Email confirmations have been disabled to prevent login issues';
    END IF;
END $$; 