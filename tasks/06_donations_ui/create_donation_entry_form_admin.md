# create_donation_entry_form_admin

## Purpose
Provide a form for admins or pastors to manually log donations (cash, check, online) into the system.

## Requirements
- Role-limited to admins and pastors
- Allow anonymous or member-linked donations
- Support donation method, amount, category, and notes

## Procedure
1. Create a route: `/donations/new`
2. Build a form with:
   - Donor (searchable select or anonymous checkbox)
   - Amount
   - Donation method (Cash, Check, Online)
   - Category (dropdown from `donation_categories`)
   - Date of donation (default: today)
   - Notes (optional)
3. On submit, insert record into `churchops.donations`
4. Show success toast and redirect to donation list or dashboard
