# implement_magic_link_login

## Purpose
Implement passwordless login for members using email-based magic links provided by Supabase.

## Requirements
- Supabase auth must be configured for magic links
- The frontend should provide a simple login form with email field
- Handle errors and status states (sending, sent, failed)

## Procedure
1. In the frontend, create a login component with just an email input.
2. Use Supabase's auth client:
   ```ts
   const { error } = await supabase.auth.signInWithOtp({ email });
   ```
3. Show a message when the link is sent.
4. Handle redirect from the link:
   - Use Supabase's session context to complete login
5. Redirect the user to dashboard or intended route after login
