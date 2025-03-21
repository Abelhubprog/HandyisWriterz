# Supabase SQL Admin Scripts

These SQL scripts help you manage admin users in your Supabase project. Since there are connectivity issues with the Supabase instance, these scripts should be run directly in the Supabase SQL Editor.

## How to Run These Scripts

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the SQL Editor (in the left sidebar)
4. Create a new query
5. Copy and paste the content of one of the SQL scripts
6. Run the query

## Available Scripts

### 1. add-admin.sql

This script creates a new admin user (if it doesn't exist) and adds it to the admin_users table. It will:

- Create the admin_users table if it doesn't exist
- Create an admin user with email 'admin@handywriterz.com' and password 'admin123'
- Add the user to the admin_users table

### 2. add-existing-user-as-admin.sql

This script adds an existing user to the admin_users table. It will:

- Create the admin_users table if it doesn't exist
- Find the user with the specified email
- Update their profile to have the 'admin' role
- Add them to the admin_users table

To use this script for a different user, edit the `user_email` variable in the script.

### 3. check-admin-status.sql

This script checks if a user is an admin. It will:

- Check if the admin_users table exists
- Find the user with the specified email
- Check if they are in the admin_users table
- Check their profile role
- Display the results

To check a different user, edit the `user_email` variable in the script.

### 4. create-working-admin.sql

This script creates a new admin user with a secure password and ensures all necessary tables exist. It will:

- Create the admin_users table if it doesn't exist
- Create the profiles table if it doesn't exist
- Create a new admin user with email 'new_admin@handywriterz.com' and a secure password
- Add the user to the admin_users table
- Set the user's metadata and profile to have the 'admin' role
- Display the admin credentials for login

### 5. create-secure-admin.sql

This comprehensive script creates a new admin user with a randomly generated secure password. It will:

- Create the admin_users table with proper RLS policies if it doesn't exist
- Create the profiles table with proper RLS policies if it doesn't exist
- Create a new admin user with email 'secure_admin@handywriterz.com' and a random secure password
- Set up the user's metadata and profile with the 'admin' role
- Add the user to the admin_users table
- Display detailed information about the created admin user

### 6. make-handywriterz-admin.sql

This script specifically makes the handywriterz@gmail.com user an admin. It will:

- Find the user with email 'handywriterz@gmail.com'
- Update the user's metadata to include the admin role
- Update the user's profile to have the admin role
- Add the user to the admin_users table if not already present
- Verify and display the admin status

### 7. fix-admin-users.sql

This utility script checks and fixes various issues with existing admin users. It will:

- Create necessary tables if they don't exist
- Remove orphaned admin records
- Create missing profiles for admin users
- Add users with admin role to the admin_users table
- Ensure consistency between admin_users table, user metadata, and profiles
- Display a summary of issues fixed and list all current admin users

### 8. reset-admin-password.sql

This script resets the password for the handywriterz@gmail.com admin user and fixes any issues with the user's admin status. It will:

- Find the user with email 'handywriterz@gmail.com'
- Reset the password to a secure value
- Ensure the user is in the admin_users table
- Update the user's metadata to include the admin role
- Update the user's profile to have the admin role
- Clear any confirmation or recovery tokens
- Display the new credentials for login

### 9. verify-admin-login.sql

This comprehensive diagnostic script checks all aspects of admin login functionality for a specific user. It will:

- Check the user's record in auth.users for issues
- Verify the user's profile exists and has the correct role
- Confirm the user is in the admin_users table
- Check authentication settings and RLS policies
- Provide detailed recommendations for fixing any issues found
- Display a summary of all checks performed

### 10. check-auth-config.sql

This script checks and helps fix authentication configuration issues in your Supabase project. It will:

- Display current authentication settings
- Identify potential issues with email confirmations, token timeouts, etc.
- Check for JWT secret configuration
- Verify authentication hooks and triggers
- Provide recommendations for optimal authentication settings
- Include commented SQL to fix common issues

### 11. create-profiles-and-reset-admin.sql

This script creates the profiles table if it doesn't exist and resets the admin password. It will:

- Check if the profiles table exists and create it with proper RLS policies if not
- Check if the admin_users table exists and create it with proper RLS policies if not
- Find the user with email 'handywriterz@gmail.com'
- Reset the password to a secure value
- Ensure the user is in the admin_users table
- Update the user's metadata to include the admin role
- Create or update the user's profile to have the admin role
- Disable email confirmations to prevent login issues
- Display the new credentials for login

### 12. create-admin-from-scratch.sql

This script creates a completely new admin user from scratch with all necessary tables. It will:

- Check if the profiles table exists and create it with proper RLS policies if not
- Check if the admin_users table exists and create it with proper RLS policies if not
- Delete any existing user with the same email
- Create a new admin user with email 'new_admin@handywriterz.com' and password 'NewAdmin123!'
- Create a profile for the admin user
- Add the user to the admin_users table
- Disable email confirmations to prevent login issues
- Display the admin credentials for login

## Troubleshooting

If you encounter any issues:

1. Make sure you have the necessary permissions to run SQL queries in your Supabase project
2. Check that the auth.users table contains the user you're trying to make an admin
3. Verify that the profiles table exists and has the correct schema
4. If you get errors about missing functions (like crypt or gen_salt), make sure the pgcrypto extension is enabled
5. If admin login still doesn't work after running these scripts, run the fix-admin-users.sql script to repair any inconsistencies
6. For persistent login issues, run the verify-admin-login.sql script to diagnose specific problems
7. If authentication settings are causing problems, run the check-auth-config.sql script
8. If you get an error about missing tables, use the create-profiles-and-reset-admin.sql script which creates all necessary tables

## After Running the Scripts

After successfully running the scripts, you should be able to log in with the admin credentials displayed in the script output. For the basic admin:

- Email: admin@handywriterz.com
- Password: admin123

For the handywriterz@gmail.com admin after password reset:

- Email: handywriterz@gmail.com
- Password: HandyAdmin123!

For the new admin created from scratch:

- Email: new_admin@handywriterz.com
- Password: NewAdmin123!

For the secure admin, the credentials will be displayed in the script output - make sure to save them securely.

The application should now recognize these users as admins because they will be present in the admin_users table with the correct metadata and profile settings. 