-- Create households table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_name TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'USA',
    primary_contact_id UUID, -- FK to members.id (nullable initially)
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create index on primary_contact_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_households_primary_contact 
ON churchops.households(primary_contact_id);

-- Note: Foreign key constraint for primary_contact_id will be added 
-- after members table is created in a subsequent migration