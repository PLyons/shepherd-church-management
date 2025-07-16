# create_sermons_schema

## Purpose
Create the `sermons` table to store details about weekly messages and file uploads.

## Requirements
- Table name: sermons
- Must include title, speaker, and media link
- Must support notes and file uploads

## Procedure
1. Create a SQL migration named `create_sermons_table.sql`.
2. Define columns:
   - id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - title: TEXT
   - speaker_name: TEXT
   - date_preached: DATE
   - notes: TEXT
   - media_url: TEXT
   - created_by: UUID REFERENCES churchops.members(id)
   - created_at: TIMESTAMP DEFAULT now()
3. Run insert test with dummy media link.
