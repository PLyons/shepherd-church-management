# create_event_calendar_page

## Purpose
Provide a calendar view to display all upcoming events for the church, with filtering and detail links.

## Requirements
- Public and private events must be visually distinguishable
- Pastors and admins can see all events
- Members see only public or their relevant ones
- Calendar should allow month/week toggle

## Procedure
1. Create a route: `/events`
2. Fetch all events the user has access to from Supabase
3. Use a calendar library (e.g., `react-calendar` or `fullcalendar-react`)
4. Render each event with:
   - Title
   - Start/End date
   - Visibility status
5. On click, navigate to `/events/:id`
6. Add filter (e.g., show only my events, public only)
