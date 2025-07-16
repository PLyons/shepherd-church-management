# create_volunteer_slots_schema

## Purpose
Define the `volunteer_slots` table to track role assignments to specific events.

## Requirements
- Table name: volunteer_slots
- Must reference both an event and a predefined volunteer role
- Must track if filled and by whom

## Procedure
1. Create a SQL migration file `create_volunteer_slots_table.sql`.
2. Define:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - event_id: UUID REFERENCES churchops.events(id)
   - role_id: UUID REFERENCES churchops.volunteer_roles(id)
   - assigned_to: UUID (nullable) REFERENCES churchops.members(id)
   - status: TEXT
   - note: TEXT
   - created_at: TIMESTAMP DEFAULT now()
3. Test volunteer assignment on test event.
