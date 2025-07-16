-- Create members table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES churchops.households(id),
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    birthdate DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    member_status TEXT,
    role TEXT CHECK (role IN ('member', 'pastor', 'admin')) DEFAULT 'member',
    joined_at DATE,
    is_primary_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_household_id ON churchops.members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON churchops.members(email);
CREATE INDEX IF NOT EXISTS idx_members_role ON churchops.members(role);

-- Add foreign key constraint for households.primary_contact_id
ALTER TABLE churchops.households 
ADD CONSTRAINT fk_households_primary_contact 
FOREIGN KEY (primary_contact_id) REFERENCES churchops.members(id);