# create_donation_history_view

## Purpose
Display a searchable list of all donations for reporting and auditing.

## Requirements
- Admins and pastors see all donations
- Members see only their own donations
- List must be filterable by date, category, and method

## Procedure
1. Create a route: `/donations`
2. Fetch donation records using Supabase with proper RLS
3. Render in a paginated table with:
   - Donor name (or Anonymous)
   - Amount
   - Category
   - Method
   - Date
4. Add filter controls for:
   - Date range
   - Category
   - Method
5. If user is admin, allow CSV export
