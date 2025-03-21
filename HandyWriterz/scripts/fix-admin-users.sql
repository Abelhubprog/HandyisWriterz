-- Fix Admin Users Script
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- This script checks and fixes issues with existing admin users

DO $$
DECLARE
    admin_record RECORD;
    admin_users_exists BOOLEAN;
    profiles_exists BOOLEAN;
    admin_count INT := 0;
    fixed_count INT := 0;
BEGIN
    RAISE NOTICE '======== ADMIN USERS REPAIR UTILITY ========';
    
    -- Check if admin_users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_users'
    ) INTO admin_users_exists;
    
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO profiles_exists;
    
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
    END IF;
    
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
    END IF;
    
    -- First check: Find users in admin_users table but not in auth.users (orphaned records)
    RAISE NOTICE 'Checking for orphaned admin records...';
    FOR admin_record IN 
        SELECT a.id, a.email 
        FROM public.admin_users a 
        LEFT JOIN auth.users u ON a.id = u.id 
        WHERE u.id IS NULL
    LOOP
        RAISE NOTICE 'Removing orphaned admin record for ID: % (Email: %)', admin_record.id, admin_record.email;
        DELETE FROM public.admin_users WHERE id = admin_record.id;
        fixed_count := fixed_count + 1;
    END LOOP;
    
    -- Second check: Find users in admin_users but missing from profiles
    RAISE NOTICE 'Checking for admin users missing profiles...';
    FOR admin_record IN 
        SELECT a.id, a.email, u.raw_user_meta_data
        FROM public.admin_users a 
        JOIN auth.users u ON a.id = u.id 
        LEFT JOIN public.profiles p ON a.id = p.id 
        WHERE p.id IS NULL
    LOOP
        RAISE NOTICE 'Creating missing profile for admin: % (Email: %)', admin_record.id, admin_record.email;
        
        INSERT INTO public.profiles (
            id,
            updated_at,
            username,
            full_name,
            role
        ) VALUES (
            admin_record.id,
            now(),
            split_part(admin_record.email, '@', 1),
            COALESCE(
                (admin_record.raw_user_meta_data->>'full_name'),
                split_part(admin_record.email, '@', 1)
            ),
            'admin'
        );
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    -- Third check: Find users with admin role in profiles but not in admin_users
    RAISE NOTICE 'Checking for users with admin role but not in admin_users...';
    FOR admin_record IN 
        SELECT p.id, u.email
        FROM public.profiles p
        JOIN auth.users u ON p.id = u.id
        LEFT JOIN public.admin_users a ON p.id = a.id
        WHERE p.role = 'admin' AND a.id IS NULL
    LOOP
        RAISE NOTICE 'Adding missing admin_users entry for: % (Email: %)', admin_record.id, admin_record.email;
        
        INSERT INTO public.admin_users (
            id,
            email,
            created_at,
            updated_at
        ) VALUES (
            admin_record.id,
            admin_record.email,
            now(),
            now()
        );
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    -- Fourth check: Find users with admin role in metadata but not in admin_users
    RAISE NOTICE 'Checking for users with admin metadata but not in admin_users...';
    FOR admin_record IN 
        SELECT u.id, u.email
        FROM auth.users u
        LEFT JOIN public.admin_users a ON u.id = a.id
        WHERE u.raw_user_meta_data->>'role' = 'admin' AND a.id IS NULL
    LOOP
        RAISE NOTICE 'Adding missing admin_users entry for: % (Email: %)', admin_record.id, admin_record.email;
        
        INSERT INTO public.admin_users (
            id,
            email,
            created_at,
            updated_at
        ) VALUES (
            admin_record.id,
            admin_record.email,
            now(),
            now()
        );
        
        -- Also ensure profile has admin role
        IF profiles_exists THEN
            UPDATE public.profiles
            SET role = 'admin'
            WHERE id = admin_record.id;
            
            -- Create profile if it doesn't exist
            IF NOT FOUND THEN
                INSERT INTO public.profiles (
                    id,
                    updated_at,
                    username,
                    full_name,
                    role
                ) VALUES (
                    admin_record.id,
                    now(),
                    split_part(admin_record.email, '@', 1),
                    split_part(admin_record.email, '@', 1),
                    'admin'
                );
            END IF;
        END IF;
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    -- Fifth check: Find users in admin_users but without admin role in profiles
    RAISE NOTICE 'Checking for admin_users entries without admin role in profiles...';
    FOR admin_record IN 
        SELECT a.id, a.email
        FROM public.admin_users a
        JOIN public.profiles p ON a.id = p.id
        WHERE p.role != 'admin'
    LOOP
        RAISE NOTICE 'Fixing profile role for admin: % (Email: %)', admin_record.id, admin_record.email;
        
        UPDATE public.profiles
        SET role = 'admin'
        WHERE id = admin_record.id;
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    -- Sixth check: Find users in admin_users but without admin role in metadata
    RAISE NOTICE 'Checking for admin_users entries without admin role in metadata...';
    FOR admin_record IN 
        SELECT a.id, a.email, u.raw_user_meta_data
        FROM public.admin_users a
        JOIN auth.users u ON a.id = u.id
        WHERE u.raw_user_meta_data->>'role' IS DISTINCT FROM 'admin'
    LOOP
        RAISE NOTICE 'Fixing user metadata for admin: % (Email: %)', admin_record.id, admin_record.email;
        
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
                WHEN raw_user_meta_data ? 'role' THEN 
                    jsonb_set(raw_user_meta_data, '{role}', '"admin"')
                ELSE 
                    raw_user_meta_data || '{"role": "admin"}'::jsonb
            END
        WHERE id = admin_record.id;
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    -- Count total admin users
    SELECT COUNT(*) INTO admin_count FROM public.admin_users;
    
    -- Summary
    RAISE NOTICE '--------- ADMIN REPAIR SUMMARY ---------';
    RAISE NOTICE 'Total admin users: %', admin_count;
    RAISE NOTICE 'Issues fixed: %', fixed_count;
    RAISE NOTICE '----------------------------------------';
    
    IF fixed_count > 0 THEN
        RAISE NOTICE 'Successfully repaired admin user issues!';
    ELSE
        RAISE NOTICE 'No issues found with admin users.';
    END IF;
    
    -- List all admin users
    RAISE NOTICE 'Current admin users:';
    FOR admin_record IN 
        SELECT a.id, a.email 
        FROM public.admin_users a 
        JOIN auth.users u ON a.id = u.id
        ORDER BY a.email
    LOOP
        RAISE NOTICE '- % (ID: %)', admin_record.email, admin_record.id;
    END LOOP;
    
END $$; 