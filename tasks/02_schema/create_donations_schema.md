# create_donations_schema

## Purpose
Create the `donations` table to track member and anonymous financial contributions.

## Requirements
- Table name: donations
- Must support anonymous gifts (null member_id)
- Must link to donation categories
- Must record amount, method, and optional source note

## Procedure
1. Create a SQL migration named `create_donations_table.sql`.
2. Define the table with:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - member_id: UUID (nullable) REFERENCES churchops.members(id)
   - category_id: UUID NOT NULL REFERENCES churchops.donation_categories(id)
   - amount: DECIMAL(10,2) NOT NULL
   - donation_date: DATE NOT NULL
   - method: TEXT
   - source_label: TEXT
   - note: TEXT
   - created_at: TIMESTAMP DEFAULT now()
3. Verify foreign keys and insert sample anonymous donation via SQL editor.
