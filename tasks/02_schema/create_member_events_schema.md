# create_member_events_schema

## Purpose
Create the `member_events` table to store life milestones like baptisms, marriages, funerals, etc.

## Requirements
- Table name: member_events
- Each event must be linked to a specific member
- Must allow free-form event types
- Must track when the event occurred and optional notes

## Procedure
1. Create a SQL migration in Supabase named `create_member_events_table.sql`.
2. In the `churchops` schema, define the table with the following columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - member_id: UUID NOT NULL REFERENCES churchops.members(id)
   - event_type: TEXT
   - event_date: DATE
   - notes: TEXT
   - created_at: TIMESTAMP DEFAULT now()
3. Confirm FK constraint and test insert query manually.
