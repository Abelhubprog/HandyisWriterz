-- This script creates a new admin user with a secure password
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Configuration - Change these values if needed
DO $$
DECLARE
    admin_email TEXT := 'superadmin@handywriterz.com';
    admin_password TEXT := 'SuperAdmin123!';
    admin_name TEXT := 'Super Admin';
    admin_id UUID;
BEGIN
    RAISE NOTICE 'Creating new admin user with email: %', admin_email;
    
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

    -- Check if user already exists
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
    
    -- If user exists, delete it to start fresh
    IF admin_id IS NOT NULL THEN
        RAISE NOTICE 'User with email % already exists. Deleting to create fresh...', admin_email;
        
        -- Delete from admin_users first (due to foreign key constraint)
        DELETE FROM public.admin_users WHERE id = admin_id;
        
        -- Delete from profiles if it exists
        DELETE FROM public.profiles WHERE id = admin_id;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = admin_id;
        
        RAISE NOTICE 'Existing user deleted';
    END IF;
    
    -- Create the user in auth.users with a secure password
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmed_at
    ) VALUES (
        admin_email,
        crypt(admin_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('name', admin_name, 'role', 'admin'),
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
        admin_email,
        admin_name,
        'admin',
        now(),
        now()
    );
    
    RAISE NOTICE 'Created admin profile';
    
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
    
    -- Verify the user was created properly
    RAISE NOTICE '--------- ADMIN USER CREATED ---------';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
    RAISE NOTICE 'User ID: %', admin_id;
    RAISE NOTICE 'Full Name: %', admin_name;
    RAISE NOTICE '-------------------------------------';
    
    RAISE NOTICE 'Admin user setup completed successfully!';
    RAISE NOTICE 'You can now log in with:';
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Password: %', admin_password;
END $$; 