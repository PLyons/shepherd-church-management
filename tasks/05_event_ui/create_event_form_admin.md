# create_event_form_admin

## Purpose
Allow admins and pastors to create and edit church events through a form interface.

## Requirements
- Admins and pastors only
- Support creating new or editing existing events
- Must handle start/end time and visibility

## Procedure
1. Create a new route: `/events/new` and `/events/:id/edit`
2. Use a unified form component for both create and edit modes
3. Form fields:
   - Title
   - Description
   - Start and End date/time
   - Location (optional)
   - Public visibility toggle
4. Use Supabase client to insert or update the `events` table
5. Redirect to `/events/:id` on success
