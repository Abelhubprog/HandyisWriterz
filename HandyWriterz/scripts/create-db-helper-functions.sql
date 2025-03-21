-- Function to create the uuid-ossp extension if it doesn't exist
CREATE OR REPLACE FUNCTION create_uuid_extension()
RETURNS void AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  RAISE NOTICE 'uuid-ossp extension is now available';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE EXCEPTION 'Insufficient privileges to create uuid-ossp extension';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a table with the given name and definition
CREATE OR REPLACE FUNCTION create_table(table_name text, table_definition text)
RETURNS void AS $$
DECLARE
  create_statement text;
BEGIN
  -- Check if the table already exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = create_table.table_name
  ) THEN
    RAISE NOTICE 'Table % already exists', table_name;
    RETURN;
  END IF;

  -- Create the table
  create_statement := 'CREATE TABLE public.' || quote_ident(table_name) || ' (' || table_definition || ')';
  
  EXECUTE create_statement;
  
  RAISE NOTICE 'Table % created successfully', table_name;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error creating table %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable Row Level Security on a table
CREATE OR REPLACE FUNCTION enable_rls(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE 'ALTER TABLE public.' || quote_ident(table_name) || ' ENABLE ROW LEVEL SECURITY';
  RAISE NOTICE 'Row Level Security enabled on table %', table_name;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error enabling RLS on table %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run arbitrary SQL (use with caution)
CREATE OR REPLACE FUNCTION run_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users and anon
GRANT EXECUTE ON FUNCTION create_uuid_extension() TO authenticated;
GRANT EXECUTE ON FUNCTION create_uuid_extension() TO anon;
GRANT EXECUTE ON FUNCTION create_uuid_extension() TO service_role;

GRANT EXECUTE ON FUNCTION create_table(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_table(text, text) TO anon;
GRANT EXECUTE ON FUNCTION create_table(text, text) TO service_role;

GRANT EXECUTE ON FUNCTION enable_rls(text) TO authenticated;
GRANT EXECUTE ON FUNCTION enable_rls(text) TO anon;
GRANT EXECUTE ON FUNCTION enable_rls(text) TO service_role;

GRANT EXECUTE ON FUNCTION run_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION run_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION run_sql(text) TO service_role; 