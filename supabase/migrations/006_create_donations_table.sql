-- Create donations table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES churchops.members(id), -- nullable for anonymous donations
    category_id UUID NOT NULL REFERENCES churchops.donation_categories(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    donation_date DATE NOT NULL,
    method TEXT,
    source_label TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_member_id ON churchops.donations(member_id);
CREATE INDEX IF NOT EXISTS idx_donations_category_id ON churchops.donations(category_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON churchops.donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_amount ON churchops.donations(amount);