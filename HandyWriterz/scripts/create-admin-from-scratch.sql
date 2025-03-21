-- Create Admin From Scratch Script
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- This script creates a completely new admin user from scratch with all necessary tables

DO $$
DECLARE
    admin_email TEXT := 'new_admin@handywriterz.com';
    admin_password TEXT := 'NewAdmin123!';
    admin_id UUID;
    profiles_exists BOOLEAN;
    admin_users_exists BOOLEAN;
BEGIN
    RAISE NOTICE '======== CREATING ADMIN USER FROM SCRATCH ========';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    RAISE NOTICE '==============================================';
    
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
    
    -- Check if admin_users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_users'
    ) INTO admin_users_exists;
    
    -- Create admin_users table if it doesn't exist
    IF NOT admin_users_exists THEN
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
    
    -- Delete existing user with the same email if exists
    DELETE FROM auth.users WHERE email = admin_email;
    RAISE NOTICE 'Removed any existing user with the same email';
    
    -- Create the admin user
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        aud,
        role
    ) VALUES (
        uuid_generate_v4(),
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"admin"}',
        now(),
        now(),
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated'
    ) RETURNING id INTO admin_id;
    
    RAISE NOTICE 'Created admin user with ID: %', admin_id;
    
    -- Create profile for the admin user
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
        'new_admin',
        'New Admin',
        'admin',
        admin_email
    );
    
    RAISE NOTICE 'Created admin profile';
    
    -- Add admin to admin_users table
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
    
    -- Disable email confirmations if they're enabled
    UPDATE auth.config
    SET enable_confirmations = false
    WHERE enable_confirmations = true;
    
    IF FOUND THEN
        RAISE NOTICE 'Email confirmations have been disabled to prevent login issues';
    END IF;
    
    -- Verify the admin user was created properly
    RAISE NOTICE '--------- ADMIN CREATION SUMMARY ---------';
    RAISE NOTICE 'Admin Email: %', admin_email;
    RAISE NOTICE 'Admin Password: %', admin_password;
    RAISE NOTICE 'Admin ID: %', admin_id;
    RAISE NOTICE 'In auth.users: YES';
    RAISE NOTICE 'In public.profiles: YES';
    RAISE NOTICE 'In admin_users table: YES';
    RAISE NOTICE 'Profile role: admin';
    RAISE NOTICE 'User metadata role: admin';
    RAISE NOTICE '----------------------------------------';
    
    RAISE NOTICE 'IMPORTANT: Save these credentials securely!';
    RAISE NOTICE 'You can now log in with:';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
END $$; 