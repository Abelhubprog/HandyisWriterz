// src/tests/authTest.ts
import { supabase } from '../lib/supabaseClient';

async function testAuthentication() {
  // Test public access
  console.log("Testing public access...");
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_published', true);
  console.log("Published services:", services?.length);

  // Test authenticated user operations (manually set auth token)
  // In real app, this happens automatically after login
  console.log("\nTesting authenticated user actions...");
  // Add your auth testing here
}

testAuthentication();