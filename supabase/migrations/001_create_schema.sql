-- Create the churchops schema for all custom tables
CREATE SCHEMA IF NOT EXISTS churchops;

-- Grant usage on the schema to authenticated users
GRANT USAGE ON SCHEMA churchops TO authenticated;

-- Grant usage on the schema to anon users (for public access if needed)
GRANT USAGE ON SCHEMA churchops TO anon;

-- Set search path to include churchops schema
ALTER DATABASE postgres SET search_path TO public, churchops;

-- Comment on the schema
COMMENT ON SCHEMA churchops IS 'Schema for ChurchOps Suite - Church Management System';