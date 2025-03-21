# Setup script for Turnitin infrastructure in Supabase (PowerShell version)

# Check if supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "Supabase CLI is installed."
} catch {
    Write-Host "Supabase CLI is not installed. Please install it first."
    Write-Host "You can install it using: npm install -g supabase"
    exit 1
}

Write-Host "Setting up Turnitin infrastructure..."

# Create the turnitin-documents bucket
Write-Host "Creating storage bucket..."
supabase storage create turnitin-documents

# Set bucket to public
Write-Host "Setting bucket to public..."
supabase storage update turnitin-documents --public

# Apply database migrations
Write-Host "Applying database migrations..."
supabase db push

# Set environment variables for the edge function
Write-Host "Setting environment variables..."
supabase secrets set SMTP_HOSTNAME="smtp.gmail.com"
supabase secrets set SMTP_PORT="465"
supabase secrets set SMTP_USERNAME="handywriterz@gmail.com"
# Replace with your actual app-specific password
supabase secrets set SMTP_PASSWORD="your-app-specific-password"
supabase secrets set RECIPIENT_EMAIL="handywriterz@gmail.com"

# Deploy the edge function
Write-Host "Deploying edge function..."
supabase functions deploy send-turnitin-document --no-verify-jwt

# Apply storage policies
Write-Host "Applying storage policies..."
$sqlQuery = @"
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
"@

supabase db execute $sqlQuery

Write-Host "Setup complete! You can now test the infrastructure."
Write-Host "To check logs, run: supabase logs"
Write-Host "To verify database entries, run: supabase db execute 'SELECT * FROM document_uploads ORDER BY created_at DESC LIMIT 10'" 