# init_supabase_project

## Purpose
Initialize a Supabase project to serve as the backend platform for the ChurchOps Suite. This project will host the database, authentication, and storage services.

## Requirements
- Supabase account created
- Supabase CLI installed (optional, for local dev)
- Project name: ChurchOps Dev
- Region: nearest US-based region (e.g., us-east-1)

## Procedure
1. Log into https://app.supabase.com/ and create a new project named "ChurchOps Dev".
2. Select the appropriate region for lowest latency.
3. Set a strong database password and save it securely.
4. Note the project reference ID and Supabase API URL.
5. Enable Auth: email/password and magic link sign-in.
6. Enable Supabase Storage.
7. Create a new SQL schema: `churchops` for all custom tables.
