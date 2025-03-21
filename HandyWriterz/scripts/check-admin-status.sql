-- This script checks the admin status of a user
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Replace 'user@example.com' with the email of the user you want to check
DO $$
DECLARE
    user_id UUID;
    user_email TEXT := 'admin@handywriterz.com'; -- Change this to the user's email
    is_admin BOOLEAN;
    admin_users_exists BOOLEAN;
    profile_role TEXT;
BEGIN
    -- Check if admin_users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'admin_users'
    ) INTO admin_users_exists;
    
    IF NOT admin_users_exists THEN
        RAISE NOTICE 'admin_users table does not exist. No admins are configured.';
        RETURN;
    END IF;

    -- Get the user ID
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found', user_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', user_id;
    
    -- Check if user is in admin_users table
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE id = user_id
    ) INTO is_admin;
    
    -- Check profile role
    SELECT role INTO profile_role FROM public.profiles WHERE id = user_id;
    
    -- Display results
    RAISE NOTICE '--------- ADMIN STATUS CHECK ---------';
    RAISE NOTICE 'User: %', user_email;
    RAISE NOTICE 'User ID: %', user_id;
    RAISE NOTICE 'In admin_users table: %', CASE WHEN is_admin THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'Profile role: %', COALESCE(profile_role, 'Not set');
    RAISE NOTICE '-------------------------------------';
    
    -- Provide recommendation
    IF NOT is_admin THEN
        RAISE NOTICE 'This user is NOT an admin. To make them an admin, run the add-existing-user-as-admin.sql script.';
    ELSE
        RAISE NOTICE 'This user IS an admin. They should be able to access admin features.';
    END IF;
END $$; 