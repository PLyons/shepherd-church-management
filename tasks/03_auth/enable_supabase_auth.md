# enable_supabase_auth

## Purpose
Enable and configure Supabase authentication for the application, allowing users to sign in using email and magic links.

## Requirements
- Supabase project already initialized
- Email sign-in and magic link auth must be enabled
- JWT claims should be used for role-based access
- Anonymous access should be disabled except for QR-based registration

## Procedure
1. Go to the Supabase dashboard > Authentication > Settings.
2. Enable "Email" sign-in and "Magic Link".
3. Disable "Email Confirm" if you want to reduce friction for MVP (optional).
4. Under "Auth Providers", ensure only "Email" is active.
5. Go to API > JWT and configure custom JWT claims:
   - Add `role` to JWT claims from the `members` table
6. Set `auth.users` as the base identity layer and connect to `members` via email.
7. Create policies later to enforce row-level access per role.
