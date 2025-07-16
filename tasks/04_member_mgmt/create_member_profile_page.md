# create_member_profile_page

## Purpose
Create a detailed view page for individual member profiles.

## Requirements
- Should include all personal details
- Should link to household view and life events
- Members can only see their own profile
- Admins and pastors can edit all profiles

## Procedure
1. Create a route: `/members/:id`
2. Fetch member by `id` using Supabase client
3. Display:
   - Name
   - Email, Phone
   - Birthdate, Gender
   - Member status and role
   - Household link
   - Life events
4. If role is admin/pastor, show Edit button and inline form
5. Add error handling and loading states
