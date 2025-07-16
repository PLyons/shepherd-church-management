# Supabase Setup Guide

## Manual Setup Steps

### 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the following:
   - Organization: Select or create one
   - Project name: `ChurchOps Dev`
   - Database Password: Generate a strong password and save it securely
   - Region: Select the nearest US region (e.g., `us-east-1`)
   - Pricing Plan: Free tier

### 2. Configure Authentication

Once the project is created:

1. Go to Authentication → Settings
2. Enable the following providers:
   - Email/Password
   - Magic Link (OTP)
3. Configure email settings:
   - Enable email confirmations: OFF (for development)
   - Secure password change: OFF (for development)

### 3. Get API Keys

1. Go to Settings → API
2. Copy the following values to your `.env.local` file:
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - Project URL → `VITE_SUPABASE_URL`

### 4. Enable Storage

1. Go to Storage
2. Create a new bucket called `sermons` for sermon audio/video files
3. Set it to Public bucket (or configure RLS policies later)

### 5. Create Schema

1. Go to SQL Editor
2. Run the following SQL to create the churchops schema:

```sql
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
```

## Local Development Setup

### Using Supabase CLI

1. The Supabase CLI has been initialized in this project
2. To start local development:
   ```bash
   supabase start
   ```
3. This will start a local Supabase instance with:
   - Postgres database
   - Auth server
   - Storage server
   - Realtime server
   - Studio UI at http://localhost:54323

4. For local development, update `.env.local`:
   ```
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```

### Running Migrations

1. Migrations are stored in `supabase/migrations/`
2. They will run automatically when you start Supabase locally
3. To run migrations on the remote database:
   ```bash
   supabase db push
   ```

## Next Steps

After completing the setup:
1. Update `.env.local` with your project credentials
2. Run `npm run dev` to start the frontend
3. Begin implementing the database schema tasks