# Reset and restart Supabase with new migrations
# This script will:
# 1. Stop Supabase
# 2. Reset the database
# 3. Start Supabase
# 4. Create the admin user

# Stop Supabase
Write-Host "Stopping Supabase..." -ForegroundColor Cyan
supabase stop

# Reset the database
Write-Host "Resetting the database..." -ForegroundColor Cyan
supabase db reset

# Start Supabase
Write-Host "Starting Supabase..." -ForegroundColor Cyan
supabase start

# Wait for Supabase to start
Write-Host "Waiting for Supabase to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Create the admin user
Write-Host "Creating admin user..." -ForegroundColor Cyan
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/create-first-admin.sql

Write-Host "Done! Supabase is running with a fresh database and admin user." -ForegroundColor Green
Write-Host "Admin credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@handywriterz.com" -ForegroundColor Yellow
Write-Host "Password: Admin@123!" -ForegroundColor Yellow 