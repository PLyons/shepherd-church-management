-- Create volunteer_slots table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.volunteer_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES churchops.events(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES churchops.volunteer_roles(id),
    assigned_to UUID REFERENCES churchops.members(id), -- nullable, can be unassigned
    status TEXT CHECK (status IN ('Open', 'Filled', 'Cancelled')) DEFAULT 'Open',
    note TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_volunteer_slots_event_id ON churchops.volunteer_slots(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_slots_role_id ON churchops.volunteer_slots(role_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_slots_assigned_to ON churchops.volunteer_slots(assigned_to);
CREATE INDEX IF NOT EXISTS idx_volunteer_slots_status ON churchops.volunteer_slots(status);