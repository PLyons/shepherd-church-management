# create_auth_triggers_and_roles

## Purpose
Automatically link Supabase `auth.users` to the custom `members` table and manage user roles securely.

## Requirements
- Users table: `auth.users`
- Roles: 'admin', 'pastor', 'member'
- Members are registered either manually or via QR
- Each `auth.user` must be matched to a member record using email

## Procedure
1. Create a trigger function in Supabase called `handle_new_user` that runs on `auth.users` insert.
2. This function will:
   - Search `churchops.members` by email
   - If a match is found, update `auth.users` metadata with role claim
   - If no match, prevent login or create a placeholder member record (based on policy)
3. Define an ENUM for role types: 'admin', 'pastor', 'member'
4. Set up the `members.role` field as the source of truth for role assignment
5. Store the role claim in `auth.users.app_metadata`
