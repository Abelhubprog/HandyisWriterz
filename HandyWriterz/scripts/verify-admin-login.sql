-- Verify Admin Login Script
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- This script checks all aspects of admin login functionality

DO $$
DECLARE
    admin_email TEXT := 'handywriterz@gmail.com';
    admin_id UUID;
    admin_meta JSONB;
    profile_record RECORD;
    admin_record RECORD;
    auth_settings RECORD;
    auth_config RECORD;
BEGIN
    RAISE NOTICE '======== ADMIN LOGIN VERIFICATION ========';
    RAISE NOTICE 'Checking admin status for: %', admin_email;
    
    -- Check if user exists in auth.users
    SELECT id, raw_user_meta_data, email_confirmed_at, last_sign_in_at, banned_until, 
           confirmation_token, recovery_token, aud, role
    INTO admin_record 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_record IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users', admin_email;
    END IF;
    
    admin_id := admin_record.id;
    admin_meta := admin_record.raw_user_meta_data;
    
    RAISE NOTICE 'Found user with ID: %', admin_id;
    
    -- Check auth.users record for issues
    RAISE NOTICE '--------- AUTH.USERS CHECK ---------';
    RAISE NOTICE 'Email confirmed: %', CASE WHEN admin_record.email_confirmed_at IS NOT NULL THEN 'YES' ELSE 'NO (ISSUE)' END;
    RAISE NOTICE 'Last sign in: %', admin_record.last_sign_in_at;
    RAISE NOTICE 'Account banned: %', CASE WHEN admin_record.banned_until IS NULL THEN 'NO' ELSE 'YES until ' || admin_record.banned_until END;
    RAISE NOTICE 'Confirmation token: %', CASE WHEN admin_record.confirmation_token = '' THEN 'EMPTY (GOOD)' ELSE 'NOT EMPTY (ISSUE)' END;
    RAISE NOTICE 'Recovery token: %', CASE WHEN admin_record.recovery_token = '' THEN 'EMPTY (GOOD)' ELSE 'NOT EMPTY (ISSUE)' END;
    RAISE NOTICE 'Audience: %', admin_record.aud;
    RAISE NOTICE 'Role: %', admin_record.role;
    RAISE NOTICE 'User metadata: %', admin_meta;
    RAISE NOTICE 'Metadata role: %', admin_meta->>'role';
    RAISE NOTICE '-----------------------------------';
    
    -- Check if user has a profile
    SELECT * INTO profile_record FROM public.profiles WHERE id = admin_id;
    
    RAISE NOTICE '--------- PROFILE CHECK ---------';
    IF profile_record IS NULL THEN
        RAISE NOTICE 'Profile: NOT FOUND (ISSUE)';
    ELSE
        RAISE NOTICE 'Profile: FOUND';
        RAISE NOTICE 'Username: %', profile_record.username;
        RAISE NOTICE 'Full name: %', profile_record.full_name;
        RAISE NOTICE 'Profile role: %', profile_record.role;
        RAISE NOTICE 'Last updated: %', profile_record.updated_at;
    END IF;
    RAISE NOTICE '--------------------------------';
    
    -- Check if user is in admin_users table
    RAISE NOTICE '--------- ADMIN_USERS CHECK ---------';
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE id = admin_id) THEN
        RAISE NOTICE 'In admin_users table: YES';
        
        SELECT * INTO admin_record FROM public.admin_users WHERE id = admin_id;
        RAISE NOTICE 'Email in admin_users: %', admin_record.email;
        RAISE NOTICE 'Created at: %', admin_record.created_at;
        RAISE NOTICE 'Updated at: %', admin_record.updated_at;
    ELSE
        RAISE NOTICE 'In admin_users table: NO (ISSUE)';
    END IF;
    RAISE NOTICE '------------------------------------';
    
    -- Check auth settings
    SELECT * INTO auth_settings FROM auth.config LIMIT 1;
    
    RAISE NOTICE '--------- AUTH SETTINGS CHECK ---------';
    RAISE NOTICE 'Email confirmations required: %', CASE WHEN auth_settings.enable_confirmations THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Sign-in interval: % seconds', auth_settings.signin_interval;
    RAISE NOTICE 'JWT expiry: % seconds', auth_settings.jwt_exp;
    RAISE NOTICE '--------------------------------------';
    
    -- Check RLS policies on admin_users table
    RAISE NOTICE '--------- RLS POLICIES CHECK ---------';
    FOR auth_config IN 
        SELECT tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'admin_users'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % (% - %)', auth_config.policyname, 
                                         auth_config.cmd, 
                                         CASE WHEN auth_config.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;
        RAISE NOTICE '  Roles: %', auth_config.roles;
        RAISE NOTICE '  Condition: %', auth_config.qual;
    END LOOP;
    RAISE NOTICE '-------------------------------------';
    
    -- Provide recommendations
    RAISE NOTICE '--------- RECOMMENDATIONS ---------';
    
    -- Check for issues and provide recommendations
    IF admin_record.email_confirmed_at IS NULL THEN
        RAISE NOTICE 'ISSUE: Email not confirmed. Run the reset-admin-password.sql script to fix.';
    END IF;
    
    IF admin_record.confirmation_token != '' THEN
        RAISE NOTICE 'ISSUE: Confirmation token not empty. Run the reset-admin-password.sql script to fix.';
    END IF;
    
    IF admin_record.recovery_token != '' THEN
        RAISE NOTICE 'ISSUE: Recovery token not empty. Run the reset-admin-password.sql script to fix.';
    END IF;
    
    IF admin_meta->>'role' IS DISTINCT FROM 'admin' THEN
        RAISE NOTICE 'ISSUE: User metadata does not have admin role. Run the reset-admin-password.sql script to fix.';
    END IF;
    
    IF profile_record IS NULL THEN
        RAISE NOTICE 'ISSUE: Profile not found. Run the reset-admin-password.sql script to fix.';
    ELSIF profile_record.role IS DISTINCT FROM 'admin' THEN
        RAISE NOTICE 'ISSUE: Profile role is not admin. Run the reset-admin-password.sql script to fix.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = admin_id) THEN
        RAISE NOTICE 'ISSUE: User not in admin_users table. Run the reset-admin-password.sql script to fix.';
    END IF;
    
    IF admin_record.banned_until IS NOT NULL THEN
        RAISE NOTICE 'ISSUE: Account is banned. Run the following SQL to unban:';
        RAISE NOTICE 'UPDATE auth.users SET banned_until = NULL WHERE id = ''%'';', admin_id;
    END IF;
    
    -- Check if there are any issues with the RLS policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_users' 
        AND cmd = 'SELECT'
    ) THEN
        RAISE NOTICE 'ISSUE: No SELECT policy on admin_users table. Run the fix-admin-users.sql script to fix.';
    END IF;
    
    RAISE NOTICE '-----------------------------------';
    
    -- Final summary
    RAISE NOTICE '--------- FINAL SUMMARY ---------';
    IF admin_record.email_confirmed_at IS NOT NULL 
       AND admin_record.confirmation_token = '' 
       AND admin_record.recovery_token = '' 
       AND admin_meta->>'role' = 'admin'
       AND profile_record IS NOT NULL 
       AND profile_record.role = 'admin'
       AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = admin_id)
       AND admin_record.banned_until IS NULL THEN
        RAISE NOTICE 'All checks PASSED. Admin login should work correctly.';
        RAISE NOTICE 'If you still cannot log in, try resetting the password with reset-admin-password.sql.';
    ELSE
        RAISE NOTICE 'Some checks FAILED. Run the reset-admin-password.sql script to fix all issues.';
    END IF;
    RAISE NOTICE '----------------------------------';
    
END $$; 