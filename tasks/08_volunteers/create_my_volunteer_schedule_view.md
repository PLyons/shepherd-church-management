# create_my_volunteer_schedule_view

## Purpose
Provide members with a personal view of their upcoming and past volunteer commitments.

## Requirements
- Member view only
- Should show all assigned roles
- Grouped by upcoming and past

## Procedure
1. Create a route: `/volunteer/my-schedule`
2. Fetch `volunteer_slots` where assigned_to = current user
3. Display:
   - Role
   - Event title and date
   - Status
4. Add optional buttons for “Decline” or “Need Replacement”
5. Sort by date and group into upcoming vs. past
