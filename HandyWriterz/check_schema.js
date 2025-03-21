import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.mcp') });

const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Checking database schema...');
console.log('Project URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log('\nAttempting to list tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .neq('table_type', 'VIEW');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError.message);
    } else {
      console.log('\nPublic Schema Tables:');
      if (tables.length === 0) {
        console.log('No tables found in public schema');
      } else {
        tables.forEach(table => {
          console.log(`- ${table.table_name} (${table.table_type})`);
        });
      }
    }

    console.log('\nAttempting to list functions...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, data_type')
      .eq('routine_schema', 'public')
      .eq('routine_type', 'FUNCTION');

    if (functionsError) {
      console.error('Error fetching functions:', functionsError.message);
      
      // Try alternative approach using RPC
      console.log('\nTrying alternative approach to list functions...');
      const { data: funcList, error: funcListError } = await supabase
        .rpc('list_functions', {
          schema_name: 'public'
        });

      if (funcListError) {
        if (funcListError.message?.includes('function does not exist')) {
          console.log('\nPlease create this helper function in the SQL editor:');
          console.log(`
            create or replace function list_functions(schema_name text)
            returns table (
              function_name text,
              return_type text,
              argument_types text
            ) as $$
            select
              p.proname as function_name,
              pg_get_function_result(p.oid) as return_type,
              pg_get_function_arguments(p.oid) as argument_types
            from pg_proc p
            join pg_namespace n on p.pronamespace = n.oid
            where n.nspname = schema_name
            and p.prokind = 'f'
            order by p.proname;
            $$ language sql security definer;
          `);
        } else {
          console.error('Error listing functions:', funcListError.message);
        }
      } else if (funcList) {
        console.log('\nPublic Schema Functions:');
        funcList.forEach(func => {
          console.log(`- ${func.function_name}(${func.argument_types}) returns ${func.return_type}`);
        });
      }
    } else {
      console.log('\nPublic Schema Functions:');
      if (functions.length === 0) {
        console.log('No functions found in public schema');
      } else {
        functions.forEach(func => {
          console.log(`- ${func.routine_name} returns ${func.data_type}`);
        });
      }
    }

    // Try to check for api schema as well
    console.log('\nChecking for api schema...');
    const { data: apiTables, error: apiError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'api')
      .neq('table_type', 'VIEW');

    if (!apiError && apiTables.length > 0) {
      console.log('\nAPI Schema Tables:');
      apiTables.forEach(table => {
        console.log(`- ${table.table_name} (${table.table_type})`);
      });
    }

  } catch (err) {
    console.error('\nError checking schema:', err.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if you have access to information_schema');
    console.log('2. Verify your service role key has sufficient permissions');
    console.log('3. Try running these queries directly in the SQL editor:');
    console.log(`
      -- List tables
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type != 'VIEW';

      -- List functions
      SELECT routine_name, data_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_type = 'FUNCTION';
    `);
  }
}

// Run schema check
checkSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 