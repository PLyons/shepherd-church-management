# create_volunteer_roles_schema

## Purpose
Create a table to store predefined volunteer roles such as 'Greeter', 'Sound Desk', etc.

## Requirements
- Table name: volunteer_roles
- Must be seeded with standard role types
- Admins can manage these, but roles are limited and standardized

## Procedure
1. Create a SQL migration called `create_volunteer_roles_table.sql`.
2. Define columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - name: TEXT UNIQUE
   - description: TEXT
3. Seed roles: 'Greeter', 'Sound Desk', 'Worship Lead', etc.
