-- Function to disable email confirmation requirement for testing purposes
-- This should only be used in development/testing environments
CREATE OR REPLACE FUNCTION disable_email_confirmation()
RETURNS void AS $$
DECLARE
  current_setting text;
  is_dev boolean;
BEGIN
  -- Check if we're in development mode
  SELECT current_setting('app.settings.environment', TRUE) INTO current_setting;
  is_dev := current_setting IS NULL OR current_setting = 'development' OR current_setting = 'test';
  
  IF is_dev THEN
    -- Update auth settings to disable email confirmation
    UPDATE auth.config
    SET email_confirm_required = FALSE
    WHERE email_confirm_required = TRUE;
    
    RAISE NOTICE 'Email confirmation requirement has been disabled for testing.';
  ELSE
    RAISE EXCEPTION 'This function can only be used in development or test environments.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION disable_email_confirmation() TO authenticated;
GRANT EXECUTE ON FUNCTION disable_email_confirmation() TO anon;
GRANT EXECUTE ON FUNCTION disable_email_confirmation() TO service_role;

-- Example usage:
-- SELECT disable_email_confirmation(); 