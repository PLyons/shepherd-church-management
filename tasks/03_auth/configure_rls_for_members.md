# configure_rls_for_members

## Purpose
Set up Supabase Row-Level Security (RLS) for the `members` table to enforce access control based on user roles.

## Requirements
- Members must only access their own records unless they are admins or pastors
- RLS must be enabled and tested using Supabase policies

## Procedure
1. Enable RLS on the `churchops.members` table.
2. Create the following policies:
   - Admins can access all rows
   - Pastors can access all rows
   - Regular members can access only rows where `id = auth.uid()` or match their email
3. Create a helper function to extract role from `auth.jwt()`
4. Test using Supabase's dashboard and simulate each role
