# create_member_schema

## Purpose
Define the `members` table to store individual church member profiles and link them to their respective households.

## Requirements
- Table name: members
- Must link to `households` via foreign key
- Must enforce gender as Male or Female using a CHECK constraint
- Must support role-based user types (member, pastor, admin)

## Procedure
1. Create a SQL migration file in Supabase called `create_members_table.sql`.
2. In the `churchops` schema, define the `members` table with the following columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - household_id: UUID NOT NULL REFERENCES churchops.households(id)
   - first_name: TEXT
   - last_name: TEXT
   - email: TEXT UNIQUE
   - phone: TEXT
   - birthdate: DATE
   - gender: TEXT CHECK (gender IN ('Male', 'Female'))
   - member_status: TEXT
   - role: TEXT CHECK (role IN ('member', 'pastor', 'admin'))
   - joined_at: DATE
   - is_primary_contact: BOOLEAN DEFAULT false
   - created_at: TIMESTAMP DEFAULT now()
   - updated_at: TIMESTAMP DEFAULT now()
3. Apply the SQL file via Supabase and test record creation via SQL editor.
