# create_member_directory_ui

## Purpose
Create the main UI page to view and search the list of members in the church database.

## Requirements
- Must show a paginated list of members
- Admins and pastors should see all members
- Members can only see their own profile (if permitted)
- Each row should show name, status, role, and link to profile

## Procedure
1. Create a new route: `/members`
2. Use Supabase client to fetch data from `churchops.members`
3. Apply RLS policies to ensure only authorized users can see data
4. Render a table or list component with key columns:
   - Full Name
   - Status
   - Role
   - Action link to view
5. Add a basic search bar (filter by name or email)
6. Ensure mobile responsiveness with Tailwind
