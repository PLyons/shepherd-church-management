-- Create member_events table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.member_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES churchops.members(id) ON DELETE CASCADE,
    event_type TEXT,
    event_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_member_events_member_id ON churchops.member_events(member_id);
CREATE INDEX IF NOT EXISTS idx_member_events_event_type ON churchops.member_events(event_type);
CREATE INDEX IF NOT EXISTS idx_member_events_event_date ON churchops.member_events(event_date);