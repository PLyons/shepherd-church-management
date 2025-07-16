-- Create events table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    location TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES churchops.members(id),
    created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON churchops.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON churchops.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON churchops.events(is_public);