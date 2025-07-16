# create_events_schema

## Purpose
Define the `events` table to store church-related calendar items.

## Requirements
- Table name: events
- Must include date, time, and optional location
- Must support public/private visibility

## Procedure
1. Create a SQL migration called `create_events_table.sql`.
2. Define columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - title: TEXT NOT NULL
   - description: TEXT
   - start_time: TIMESTAMP
   - end_time: TIMESTAMP
   - location: TEXT
   - is_public: BOOLEAN DEFAULT false
   - created_by: UUID REFERENCES churchops.members(id)
   - created_at: TIMESTAMP DEFAULT now()
3. Run a sample insert query to verify.
