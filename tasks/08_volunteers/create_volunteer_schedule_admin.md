# create_volunteer_schedule_admin

## Purpose
Allow admins or pastors to assign predefined volunteer roles to specific events and manage who is serving.

## Requirements
- Admin/pastor only
- Use roles from `volunteer_roles` table
- Assign specific member or leave slot open
- Tied to a church event

## Procedure
1. Create a route: `/events/:id/volunteers`
2. Fetch event and list of available roles
3. Display a form to:
   - Add new slot: select role + assign member (optional)
   - Edit or remove slots
4. Save slots to `churchops.volunteer_slots`
   - Include status: 'Open', 'Filled', 'Declined'
5. Update view when assignments change
