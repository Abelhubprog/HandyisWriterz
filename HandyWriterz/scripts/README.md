# Supabase Migration Scripts

This directory contains scripts for managing database migrations and setup for the HandyWriterz application.

## Migration Process

1. First, ensure you have the correct environment variables set in `.env.development`:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   VITE_ADMIN_EMAIL=admin@handywriterz.com
   VITE_ADMIN_PASSWORD=your_admin_password
   ```

2. Run the migration script:
   ```bash
   pnpm run migrate
   ```

3. After running the migrations:
   - Log in as admin using the credentials provided
   - Change the admin password immediately
   - Check that all tables and policies are created correctly

## Troubleshooting

If you encounter any issues:

1. **Migration Script Fails**
   - Check your Supabase URL and service role key
   - Ensure your Supabase project is active
   - Try running the migrations manually in the SQL editor

2. **Admin Creation Fails**
   - If the admin user already exists, the script will skip creation
   - Check the Supabase Authentication settings
   - Verify email confirmation settings

3. **Permission Issues**
   - Ensure your service role key has the necessary permissions
   - Check that RLS policies are correctly applied
   - Verify the admin user exists in both auth.users and admin_users tables

## Manual Setup

If you need to set up the database manually:

1. Run the SQL migrations in order:
   - `01_supabase_auth.sql`: Sets up authentication and tables
   - `02_create_admin.sql`: Creates admin user and functions

2. Create the admin user through the Supabase dashboard:
   - Go to Authentication → Users
   - Click "Add User"
   - Enter admin email and password
   - Add metadata: `{ "role": "admin" }`

3. Run the admin creation function:
   ```sql
   SELECT create_admin_account('admin@handywriterz.com');
   ```

## Verifying Setup

To verify the setup:

1. Check tables are created:
   ```sql
   SELECT * FROM pg_tables WHERE schemaname = 'public';
   ```

2. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies;
   ```

3. Check admin user:
   ```sql
   SELECT * FROM profiles WHERE role = 'admin';
   SELECT * FROM admin_users;
   ```

## Cleaning Up

To reset the database (development only):

1. Drop all tables:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

2. Run migrations again:
   ```bash
   pnpm run migrate
   ```

## Security Notes

- Never commit real credentials to version control
- Change default admin password immediately after setup
- Keep your service role key secure
- Monitor auth logs for suspicious activity
