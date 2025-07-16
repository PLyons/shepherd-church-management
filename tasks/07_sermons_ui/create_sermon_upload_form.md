# create_sermon_upload_form

## Purpose
Allow pastors and admins to upload sermon media and notes for archive and sharing purposes.

## Requirements
- Must support file upload (audio/video or PDF)
- Title, speaker, date, and notes are required
- Role-restricted to admins and pastors

## Procedure
1. Create a route: `/sermons/new`
2. Build a form with:
   - Title
   - Speaker name
   - Date preached
   - Notes (optional)
   - Media upload (file input)
3. Use Supabase Storage to upload the file
   - Use bucket: `sermons`
   - Save URL to `churchops.sermons.media_url`
4. Insert sermon metadata into `churchops.sermons`
5. Show success toast and redirect to sermon archive
