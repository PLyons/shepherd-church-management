-- Create sermons table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.sermons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    speaker_name TEXT,
    date_preached DATE,
    notes TEXT,
    media_url TEXT,
    created_by UUID REFERENCES churchops.members(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sermons_date_preached ON churchops.sermons(date_preached);
CREATE INDEX IF NOT EXISTS idx_sermons_speaker_name ON churchops.sermons(speaker_name);
CREATE INDEX IF NOT EXISTS idx_sermons_created_by ON churchops.sermons(created_by);