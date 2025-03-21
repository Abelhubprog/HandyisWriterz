#!/usr/bin/env node
/**
 * Script to check database connection and report issues
 * 
 * This script tests the connection to your Supabase database and reports any issues.
 * 
 * Usage:
 *   node scripts/check-db-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables or use hardcoded values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlcoggqmaayimhpeemef.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sY29nZ3FtYWF5aW1ocGVlbWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDQxNDksImV4cCI6MjA1NTgyMDE0OX0._P3FTQCvxHCk3BlU-SajETrsNk3L9NfuqLobWthy7Pg';

console.log('Checking database connection...');
console.log(`Using Supabase URL: ${supabaseUrl}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkConnection() {
  try {
    console.log('Testing basic connectivity...');
    
    // Test 1: Check if we can connect to the API
    try {
      const { data: healthData, error: healthError } = await supabase.from('health').select('*').limit(1);
      if (healthError && healthError.code !== 'PGRST116') {
        console.log('❌ API health check failed:', healthError.message);
      } else {
        console.log('✅ API connection successful');
      }
    } catch (err) {
      console.log('❌ API connection failed:', err.message);
    }
    
    // Test 2: Check if tables exist
    console.log('\nChecking database tables...');
    const tables = ['profiles', 'posts', 'comments', 'likes', 'orders', 'admin_users'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true })
          .limit(1);
          
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`⚠️ Table '${table}' exists but has no rows`);
          } else {
            console.log(`❌ Table '${table}' check failed: ${error.message}`);
          }
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message);
      }
    }
    
    // Test 3: Check for type mismatches
    console.log('\nChecking for type mismatches...');
    
    try {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('table_name,column_name,data_type')
        .eq('table_schema', 'public')
        .in('column_name', ['id', 'user_id', 'post_id', 'author_id']);
        
      if (columnsError) {
        console.log('❌ Failed to check column types:', columnsError.message);
      } else if (columns) {
        console.log('Column types in database:');
        columns.forEach(col => {
          console.log(`- ${col.table_name}.${col.column_name}: ${col.data_type}`);
        });
        
        // Check for inconsistencies
        const idTypes = new Set(columns.filter(c => c.column_name === 'id').map(c => c.data_type));
        const foreignKeyTypes = new Set(columns.filter(c => c.column_name !== 'id').map(c => c.data_type));
        
        if (idTypes.size > 1) {
          console.log('⚠️ WARNING: Inconsistent ID types detected across tables:', [...idTypes].join(', '));
        } else {
          console.log('✅ ID types are consistent across tables');
        }
        
        if (foreignKeyTypes.size > 1) {
          console.log('⚠️ WARNING: Inconsistent foreign key types detected:', [...foreignKeyTypes].join(', '));
        } else {
          console.log('✅ Foreign key types are consistent');
        }
      }
    } catch (err) {
      console.log('❌ Error checking column types:', err.message);
    }
    
    // Test 4: Check RLS policies
    console.log('\nChecking Row Level Security policies...');
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_catalog.pg_policies')
        .select('tablename,policyname')
        .eq('schemaname', 'public');
        
      if (policiesError) {
        console.log('❌ Failed to check RLS policies:', policiesError.message);
      } else if (policies) {
        const policyTables = [...new Set(policies.map(p => p.tablename))];
        console.log(`Found RLS policies for tables: ${policyTables.join(', ')}`);
        
        // Check if main tables have policies
        const mainTables = ['profiles', 'posts', 'comments', 'likes', 'orders'];
        const missingPolicyTables = mainTables.filter(t => !policyTables.includes(t));
        
        if (missingPolicyTables.length > 0) {
          console.log(`⚠️ WARNING: These tables have no RLS policies: ${missingPolicyTables.join(', ')}`);
        } else {
          console.log('✅ All main tables have RLS policies');
        }
      }
    } catch (err) {
      console.log('❌ Error checking RLS policies:', err.message);
    }
    
    console.log('\nDatabase check complete.');
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

checkConnection(); 