-- Check and Fix Auth Configuration Script
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- This script checks and fixes authentication configuration issues

DO $$
DECLARE
    config_record RECORD;
    jwt_secret TEXT;
BEGIN
    RAISE NOTICE '======== AUTH CONFIGURATION CHECK ========';
    
    -- Get current auth configuration
    SELECT * INTO config_record FROM auth.config LIMIT 1;
    
    -- Display current configuration
    RAISE NOTICE '--------- CURRENT AUTH CONFIG ---------';
    RAISE NOTICE 'Email confirmations required: %', config_record.enable_confirmations;
    RAISE NOTICE 'Sign-in interval: % seconds', config_record.signin_interval;
    RAISE NOTICE 'JWT expiry: % seconds', config_record.jwt_exp;
    RAISE NOTICE 'Email change token validity: % seconds', config_record.email_change_token_validity;
    RAISE NOTICE 'Invite token validity: % seconds', config_record.invite_token_validity;
    RAISE NOTICE 'Max sign-in attempts: %', config_record.max_signin_attempts;
    RAISE NOTICE 'Site URL: %', config_record.site_url;
    RAISE NOTICE '--------------------------------------';
    
    -- Check for potential issues
    RAISE NOTICE '--------- CONFIGURATION ISSUES ---------';
    
    -- Check if email confirmations are enabled
    IF config_record.enable_confirmations THEN
        RAISE NOTICE 'ISSUE: Email confirmations are enabled. This can cause login problems if email delivery fails.';
    ELSE
        RAISE NOTICE 'Email confirmations: DISABLED (Good for testing)';
    END IF;
    
    -- Check if sign-in interval is reasonable
    IF config_record.signin_interval > 300 THEN
        RAISE NOTICE 'ISSUE: Sign-in interval is high (% seconds). Consider reducing to 300 seconds.', config_record.signin_interval;
    ELSE
        RAISE NOTICE 'Sign-in interval: % seconds (Reasonable)', config_record.signin_interval;
    END IF;
    
    -- Check if JWT expiry is reasonable
    IF config_record.jwt_exp < 3600 THEN
        RAISE NOTICE 'ISSUE: JWT expiry is too short (% seconds). Consider increasing to at least 3600 seconds.', config_record.jwt_exp;
    ELSE
        RAISE NOTICE 'JWT expiry: % seconds (Reasonable)', config_record.jwt_exp;
    END IF;
    
    -- Check max sign-in attempts
    IF config_record.max_signin_attempts < 5 THEN
        RAISE NOTICE 'ISSUE: Max sign-in attempts is low (%). Consider increasing to at least 5.', config_record.max_signin_attempts;
    ELSE
        RAISE NOTICE 'Max sign-in attempts: % (Reasonable)', config_record.max_signin_attempts;
    END IF;
    
    -- Check site URL
    IF config_record.site_url IS NULL OR config_record.site_url = '' THEN
        RAISE NOTICE 'ISSUE: Site URL is not set. This may cause issues with email templates.';
    ELSE
        RAISE NOTICE 'Site URL: % (Set)', config_record.site_url;
    END IF;
    
    RAISE NOTICE '----------------------------------------';
    
    -- Ask if user wants to fix issues
    RAISE NOTICE 'To fix these issues, uncomment and run the following SQL:';
    RAISE NOTICE '
    -- UPDATE auth.config SET
    --     enable_confirmations = false,
    --     signin_interval = 300,
    --     jwt_exp = 3600,
    --     max_signin_attempts = 10,
    --     site_url = ''http://localhost:3000''
    -- WHERE 1=1;
    --
    -- RAISE NOTICE ''Auth configuration updated successfully'';
    ';
    
    -- Check JWT secret
    BEGIN
        SELECT current_setting('pgrst.jwt_secret') INTO jwt_secret;
        RAISE NOTICE 'JWT secret is set in the database configuration.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ISSUE: JWT secret is not set in the database configuration.';
        RAISE NOTICE 'This needs to be configured in your Supabase project settings.';
    END;
    
    -- Check auth hooks
    RAISE NOTICE '--------- AUTH HOOKS CHECK ---------';
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'on_auth_user_created' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE NOTICE 'on_auth_user_created hook: EXISTS';
    ELSE
        RAISE NOTICE 'on_auth_user_created hook: NOT FOUND';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE NOTICE 'handle_new_user function: EXISTS';
    ELSE
        RAISE NOTICE 'handle_new_user function: NOT FOUND';
        RAISE NOTICE 'Consider creating a function to automatically create profiles for new users:';
        RAISE NOTICE '
        -- CREATE OR REPLACE FUNCTION public.handle_new_user()
        -- RETURNS trigger AS $$
        -- BEGIN
        --     INSERT INTO public.profiles (id, email, full_name, role)
        --     VALUES (
        --         NEW.id,
        --         NEW.email,
        --         COALESCE(NEW.raw_user_meta_data->''full_name'', split_part(NEW.email, ''@'', 1)),
        --         COALESCE(NEW.raw_user_meta_data->''role'', ''user'')
        --     );
        --     RETURN NEW;
        -- END;
        -- $$ LANGUAGE plpgsql SECURITY DEFINER;
        --
        -- CREATE OR REPLACE TRIGGER on_auth_user_created
        --     AFTER INSERT ON auth.users
        --     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        ';
    END IF;
    RAISE NOTICE '-----------------------------------';
    
    -- Final recommendations
    RAISE NOTICE '--------- RECOMMENDATIONS ---------';
    RAISE NOTICE '1. Disable email confirmations during testing to avoid login issues.';
    RAISE NOTICE '2. Set reasonable timeouts for tokens and sign-in attempts.';
    RAISE NOTICE '3. Consider creating triggers to automatically set up user profiles.';
    RAISE NOTICE '4. Run the reset-admin-password.sql script to ensure admin credentials work.';
    RAISE NOTICE '-----------------------------------';
    
END $$; 