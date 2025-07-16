# create_event_attendance_schema

## Purpose
Create a table to track which members RSVP or attend events.

## Requirements
- Table name: event_attendance
- Must relate to members and events
- Must track status (Attending, Absent, Tentative)

## Procedure
1. Create a SQL migration named `create_event_attendance_table.sql`.
2. Define columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - event_id: UUID REFERENCES churchops.events(id)
   - member_id: UUID REFERENCES churchops.members(id)
   - status: TEXT
   - note: TEXT
3. Apply and test via sample insert.
