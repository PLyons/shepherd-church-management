-- Create volunteer_roles table in churchops schema
CREATE TABLE IF NOT EXISTS churchops.volunteer_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_volunteer_roles_name ON churchops.volunteer_roles(name);

-- Insert default volunteer roles
INSERT INTO churchops.volunteer_roles (name, description) VALUES
('Greeter', 'Welcome visitors and members at church entrance'),
('Sound Desk', 'Operate audio equipment during services'),
('Worship Lead', 'Lead worship music and singing'),
('Usher', 'Guide seating and assist with offering collection'),
('Children Ministry', 'Supervise and teach children during services'),
('Parking', 'Direct traffic and assist with parking'),
('Security', 'Provide safety and security during events'),
('Kitchen', 'Prepare and serve food for church events')
ON CONFLICT (name) DO NOTHING;