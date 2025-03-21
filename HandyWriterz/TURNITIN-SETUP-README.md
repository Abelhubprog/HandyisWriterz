# Turnitin Check Infrastructure Setup

This guide will help you set up the necessary Supabase infrastructure for the Turnitin plagiarism check feature.

## Prerequisites

1. A Supabase project
2. Supabase CLI installed
3. Gmail account with app-specific password (for sending emails)

## Installing Supabase CLI

### Using npm
```bash
npm install -g supabase
```

### Using pnpm
```bash
pnpm install -g supabase
```

### Using yarn
```bash
yarn global add supabase
```

## Logging in to Supabase

After installing the CLI, you need to log in:

```bash
supabase login
```

This will open a browser window where you can authenticate with your Supabase account.

## Initializing Supabase in your project

If you haven't already initialized Supabase in your project:

```bash
supabase init
```

## Linking to your Supabase project

Link your local project to your remote Supabase project:

```bash
supabase link --project-ref your-project-ref
```

You can find your project reference in the Supabase dashboard URL: `https://app.supabase.com/project/your-project-ref`

## Setting up the infrastructure

### Option 1: Using the setup script

#### For Linux/macOS:
```bash
chmod +x setup-turnitin-infrastructure.sh
./setup-turnitin-infrastructure.sh
```

#### For Windows (PowerShell):
```powershell
.\setup-turnitin-infrastructure.ps1
```

### Option 2: Manual setup

If you prefer to run the commands manually:

1. Create the storage bucket:
```bash
supabase storage create turnitin-documents
```

2. Set the bucket to public:
```bash
supabase storage update turnitin-documents --public
```

3. Apply database migrations:
```bash
supabase db push
```

4. Set environment variables:
```bash
supabase secrets set SMTP_HOSTNAME="smtp.gmail.com"
supabase secrets set SMTP_PORT="465"
supabase secrets set SMTP_USERNAME="handywriterz@gmail.com"
supabase secrets set SMTP_PASSWORD="your-app-specific-password"
supabase secrets set RECIPIENT_EMAIL="handywriterz@gmail.com"
```

5. Deploy the edge function:
```bash
supabase functions deploy send-turnitin-document --no-verify-jwt
```

6. Apply storage policies:
```bash
supabase db execute "
BEGIN;

-- Allow uploads from anyone
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Anyone can upload turnitin documents',
  'turnitin-documents',
  '(bucket_id = ''turnitin-documents'' AND operation = ''INSERT'')'
);

-- Allow reading files (needed for public URL)
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Anyone can read turnitin documents',
  'turnitin-documents',
  '(bucket_id = ''turnitin-documents'' AND operation = ''SELECT'')'
);

COMMIT;
"
```

## Gmail App-Specific Password

To use Gmail for sending emails, you need to create an app-specific password:

1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification
3. At the bottom, click on "App passwords"
4. Select "Mail" as the app and "Other" as the device
5. Enter a name (e.g., "Turnitin Check")
6. Click "Generate"
7. Use the generated password in the `SMTP_PASSWORD` environment variable

## Testing the Setup

After completing the setup, you can test it by:

1. Checking the logs:
```bash
supabase logs
```

2. Verifying database entries:
```bash
supabase db execute "SELECT * FROM document_uploads ORDER BY created_at DESC LIMIT 10"
```

3. Uploading a test document through your application

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs for errors:
```bash
supabase logs
```

2. Verify that the storage bucket exists:
```bash
supabase storage list
```

3. Verify that the edge function is deployed:
```bash
supabase functions list
```

4. Check that the environment variables are set:
```bash
supabase secrets list
```

5. Verify the database table and policies:
```bash
supabase db execute "SELECT * FROM pg_tables WHERE tablename = 'document_uploads'"
supabase db execute "SELECT * FROM pg_policies WHERE tablename = 'document_uploads'"
``` 