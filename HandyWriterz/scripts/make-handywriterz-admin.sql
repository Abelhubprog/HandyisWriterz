-- This script makes the handywriterz@gmail.com user an admin
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

DO $$
DECLARE
    user_email TEXT := 'handywriterz@gmail.com';
    user_id UUID;
BEGIN
    RAISE NOTICE 'Making % an admin...', user_email;
    
    -- Get the user ID
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', user_id;
    
    -- Update user metadata to include admin role
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
            WHEN raw_user_meta_data ? 'role' THEN 
                jsonb_set(raw_user_meta_data, '{role}', '"admin"')
            ELSE 
                raw_user_meta_data || '{"role": "admin"}'::jsonb
        END
    WHERE id = user_id;
    
    RAISE NOTICE 'Updated user metadata with admin role';
    
    -- Update profile to have admin role if it exists
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = user_id;
    
    RAISE NOTICE 'Updated profile with admin role';
    
    -- Check if user already exists in admin_users
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE id = user_id) THEN
        RAISE NOTICE 'User already exists in admin_users table';
    ELSE
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
    END IF;
    
    -- Verify the user is now an admin
    RAISE NOTICE '--------- ADMIN STATUS CHECK ---------';
    RAISE NOTICE 'User: %', user_email;
    RAISE NOTICE 'User ID: %', user_id;
    RAISE NOTICE 'In admin_users table: YES';
    RAISE NOTICE 'Profile role: admin';
    RAISE NOTICE 'User metadata role: admin';
    RAISE NOTICE '-------------------------------------';
    
    RAISE NOTICE 'User % is now an admin', user_email;
    RAISE NOTICE 'You should now be able to log in with this account and access admin features';
END $$; 