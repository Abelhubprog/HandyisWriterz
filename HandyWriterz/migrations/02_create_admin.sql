-- Function to safely create admin user
CREATE OR REPLACE FUNCTION create_admin_account(
  admin_email TEXT,
  initial_password TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- If user doesn't exist, throw error (user should be created via Supabase Auth UI or API)
  IF existing_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist. Create user through Supabase Auth first.', admin_email;
  END IF;

  -- Insert or update profile
  INSERT INTO public.profiles (id, display_name, role, status)
  VALUES (
    existing_user_id,
    split_part(admin_email, '@', 1),
    'admin',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      status = 'active',
      updated_at = NOW();

  -- Add to admin_users if not already present
  INSERT INTO public.admin_users (id)
  VALUES (existing_user_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN 'Admin account created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin privileges
CREATE OR REPLACE FUNCTION remove_admin_privileges(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Remove from admin_users
  DELETE FROM admin_users WHERE id = user_id;

  -- Update profile role
  UPDATE profiles
  SET role = 'user',
      updated_at = NOW()
  WHERE id = user_id;

  RETURN 'Admin privileges removed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create initial admin user (replace email with your admin email)
SELECT create_admin_account('admin@handywriterz.com');

-- Comment out this line after first run to prevent accidental admin creation
-- SELECT create_admin_account('your-additional-admin@example.com');
