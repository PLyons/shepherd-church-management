# implement_qr_registration

## Purpose
Allow members to self-register by scanning a QR code that links to a pre-filled signup page in the app.

## Requirements
- Each household or visitor should receive a QR code that links to a registration route
- The QR code should encode a unique token or slug to identify source
- Signups should be matched to a pending household or created fresh
- Role assigned should default to 'member'

## Procedure
1. Create a new route in the frontend app: `/register/:slug`
2. In Supabase, create a table `registration_tokens`:
   - id: UUID
   - slug: TEXT UNIQUE
   - household_id: UUID (optional)
   - expires_at: TIMESTAMP
3. Build a QR code generator that encodes URLs like: `https://app.churchops.dev/register/abc123`
4. On page load, verify the slug:
   - Check token exists and is not expired
   - Prefill household data if applicable
5. On form submit:
   - Create a new `auth.user`
   - Match or create member entry
   - Link to household if provided
   - Send confirmation email or magic link
6. Mark token as used (optional)
