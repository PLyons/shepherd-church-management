# create_sermon_archive_view

## Purpose
Provide a view for browsing and filtering past sermons with playback or download links.

## Requirements
- Publicly accessible (optional toggle)
- Filter by date, speaker, and keyword
- Display notes and links to media

## Procedure
1. Create a route: `/sermons`
2. Fetch sermons from Supabase and display:
   - Title
   - Speaker
   - Date preached
   - Notes preview
   - Link to media_url (stream or download)
3. Add filters at top of page:
   - Speaker
   - Year/Month
   - Search keyword
4. Use responsive grid or list design
