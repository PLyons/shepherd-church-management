# create_household_profile_page

## Purpose
Create a view to display household-level data, including all linked members and shared address.

## Requirements
- Only accessible to admins and pastors
- Must show a list of members in the household
- Must highlight primary contact

## Procedure
1. Create route: `/households/:id`
2. Fetch household by `id`
3. Display:
   - Family name
   - Full address
   - List of members (name, role, age)
   - Indicate primary contact
4. Add navigation back to member directory or dashboard
