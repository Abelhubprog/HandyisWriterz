#!/bin/bash

# Reset and restart Supabase with new migrations
# This script will:
# 1. Stop Supabase
# 2. Reset the database
# 3. Start Supabase
# 4. Create the admin user

# Stop Supabase
echo "Stopping Supabase..."
supabase stop

# Reset the database
echo "Resetting the database..."
supabase db reset

# Start Supabase
echo "Starting Supabase..."
supabase start

# Wait for Supabase to start
echo "Waiting for Supabase to start..."
sleep 5

# Create the admin user
echo "Creating admin user..."
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/create-first-admin.sql

echo "Done! Supabase is running with a fresh database and admin user."
echo "Admin credentials:"
echo "Email: admin@handywriterz.com"
echo "Password: Admin@123!" 