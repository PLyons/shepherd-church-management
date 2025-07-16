-- Create donation_categories table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.donation_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_donation_categories_name ON churchops.donation_categories(name);
CREATE INDEX IF NOT EXISTS idx_donation_categories_active ON churchops.donation_categories(is_active);

-- Insert default donation categories
INSERT INTO churchops.donation_categories (name, description) VALUES
('Tithe', 'Regular tithing contributions'),
('Missions', 'Contributions for missionary work and outreach'),
('Building', 'Building fund and facility maintenance')
ON CONFLICT DO NOTHING;