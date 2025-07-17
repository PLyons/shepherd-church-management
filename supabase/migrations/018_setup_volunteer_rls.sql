-- Setup RLS policies for volunteer management

-- Volunteer Roles policies
-- Everyone can view volunteer roles
CREATE POLICY "Public can view volunteer roles" ON churchops.volunteer_roles
FOR SELECT USING (true);

-- Only authenticated users can create/update volunteer roles (app enforces admin/pastor)
CREATE POLICY "Authenticated users can manage volunteer roles" ON churchops.volunteer_roles
FOR ALL USING (auth.uid() IS NOT NULL);

-- Enable RLS on volunteer_roles
ALTER TABLE churchops.volunteer_roles ENABLE ROW LEVEL SECURITY;

-- Volunteer Slots policies
-- Everyone can view volunteer slots (public can see volunteer opportunities)
CREATE POLICY "Public can view volunteer slots" ON churchops.volunteer_slots
FOR SELECT USING (true);

-- Authenticated users can create volunteer slots (app enforces admin/pastor role)
CREATE POLICY "Authenticated users can create volunteer slots" ON churchops.volunteer_slots
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update volunteer slots they are assigned to, or admins can update any
CREATE POLICY "Users can update their assigned slots" ON churchops.volunteer_slots
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
        assigned_to = auth.uid() OR 
        auth.uid() IS NOT NULL  -- App will enforce admin role check
    )
);

-- Users can delete volunteer slots (app enforces admin/pastor role)
CREATE POLICY "Authenticated users can delete volunteer slots" ON churchops.volunteer_slots
FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable RLS on volunteer_slots
ALTER TABLE churchops.volunteer_slots ENABLE ROW LEVEL SECURITY;