# create_household_schema

## Purpose
Create the `households` table to represent family or grouped member units within the church database.

## Requirements
- Table name: households
- Must be created under schema: churchops
- Must support mailing address fields and relational integrity
- Must support a foreign key to a primary contact in the members table (nullable initially)

## Procedure
1. Create a new SQL migration file in Supabase named `create_households_table.sql`.
2. In the `churchops` schema, define the `households` table with the following columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - family_name: TEXT
   - address_line1: TEXT
   - address_line2: TEXT
   - city: TEXT
   - state: TEXT
   - postal_code: TEXT
   - country: TEXT DEFAULT 'USA'
   - primary_contact_id: UUID (nullable, FK → members.id)
   - created_at: TIMESTAMP DEFAULT now()
   - updated_at: TIMESTAMP DEFAULT now()
3. Apply a foreign key constraint on `primary_contact_id` (can be deferred until members table exists).
4. Test table creation and verify it's accessible via Supabase dashboard.
