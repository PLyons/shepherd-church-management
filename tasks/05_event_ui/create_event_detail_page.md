# create_event_detail_page

## Purpose
Show detailed information about a single church event and allow RSVP or attendance actions.

## Requirements
- Must display full event information
- Allow RSVP if the event is upcoming
- Allow pastors/admins to view attendance list

## Procedure
1. Create a route: `/events/:id`
2. Fetch event record and display:
   - Title, Description, Location
   - Start and End time
   - Public/Private tag
3. If user is a member:
   - Show RSVP buttons (Attending, Tentative, Absent)
4. If user is admin/pastor:
   - Show table of all attendees with RSVP status
5. Use Supabase to update the `event_attendance` table accordingly
