-- Create event_attendance table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.event_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES churchops.events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES churchops.members(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('Attending', 'Absent', 'Tentative')) DEFAULT 'Tentative',
    note TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON churchops.event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_member_id ON churchops.event_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_status ON churchops.event_attendance(status);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_attendance_unique 
ON churchops.event_attendance(event_id, member_id);