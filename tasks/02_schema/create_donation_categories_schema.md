# create_donation_categories_schema

## Purpose
Create a table to define and manage donation categories such as 'Tithe', 'Missions', etc.

## Requirements
- Table name: donation_categories
- Must allow administrators to activate/deactivate categories
- Categories will be referenced by donations

## Procedure
1. Create a SQL migration file called `create_donation_categories_table.sql`.
2. Define the `donation_categories` table with the following columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - name: TEXT NOT NULL
   - description: TEXT
   - is_active: BOOLEAN DEFAULT true
   - created_at: TIMESTAMP DEFAULT now()
3. Apply the migration and seed default values: 'Tithe', 'Missions', 'Building'.
