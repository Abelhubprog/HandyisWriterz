-- Reset Admin Password Script
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- This script resets the password for the handywriterz@gmail.com admin user

DO $$
DECLARE
    admin_email TEXT := 'handywriterz@gmail.com';
    new_password TEXT := 'HandyAdmin123!'; -- Strong, memorable password
    admin_id UUID;
    is_in_admin_users BOOLEAN;
BEGIN
    RAISE NOTICE '======== RESETTING ADMIN PASSWORD ========';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'New Password: %', new_password;
    RAISE NOTICE '==========================================';
    
    -- Get the user ID
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users', admin_email;
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', admin_id;
    
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
    
    -- Update profile to have admin role
    UPDATE public.profiles 
    SET 
        role = 'admin',
        updated_at = now()
    WHERE id = admin_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Profile not found. Creating profile...';
        
        -- Create profile if it doesn't exist
        INSERT INTO public.profiles (
            id,
            updated_at,
            username,
            full_name,
            role
        ) VALUES (
            admin_id,
            now(),
            split_part(admin_email, '@', 1),
            'Handy Admin',
            'admin'
        );
        
        RAISE NOTICE 'Created admin profile';
    ELSE
        RAISE NOTICE 'Updated profile with admin role';
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
END $$; 