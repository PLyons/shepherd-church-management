-- Setup sermon media storage bucket and permissions

-- Create storage bucket for sermon media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media', 
    'media', 
    true, 
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for sermon media storage
-- Allow public read access to sermon media files
CREATE POLICY "Public Access for Sermon Media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload sermon media (admin/pastor only enforced in app)
CREATE POLICY "Authenticated users can upload sermon media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);

-- Allow creators to update their own uploads
CREATE POLICY "Users can update their own sermon media" ON storage.objects
FOR UPDATE USING (bucket_id = 'media' AND auth.uid()::text = owner::text);

-- Allow creators to delete their own uploads
CREATE POLICY "Users can delete their own sermon media" ON storage.objects
FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = owner::text);

-- Update RLS policies for sermons table to allow public read access
CREATE POLICY "Public can view sermons" ON churchops.sermons
FOR SELECT USING (true);

-- Allow authenticated users to insert sermons (app will enforce admin/pastor role)
CREATE POLICY "Authenticated users can create sermons" ON churchops.sermons
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Allow creators to update their own sermons
CREATE POLICY "Users can update their own sermons" ON churchops.sermons
FOR UPDATE USING (created_by = auth.uid());

-- Allow creators to delete their own sermons
CREATE POLICY "Users can delete their own sermons" ON churchops.sermons
FOR DELETE USING (created_by = auth.uid());

-- Enable RLS on sermons table
ALTER TABLE churchops.sermons ENABLE ROW LEVEL SECURITY;