# create_volunteer_signup_ui

## Purpose
Allow members to view open volunteer roles and sign up for available slots for upcoming events.

## Requirements
- Members only
- View open roles only
- Prevent double booking

## Procedure
1. Create a route: `/volunteer`
2. Query `volunteer_slots` where status is 'Open' and assigned_to is null
3. Display each opportunity with:
   - Role name
   - Event title/date
   - Signup button
4. On signup, update slot:
   - Set assigned_to to current user
   - Change status to 'Filled'
5. Show confirmation toast
