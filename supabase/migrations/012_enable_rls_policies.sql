-- Enable Row Level Security on all tables
ALTER TABLE churchops.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.member_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.volunteer_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchops.volunteer_slots ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE((auth.jwt() -> 'app_metadata' ->> 'role')::TEXT, 'member');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Members table policies
CREATE POLICY "Admins can view all members" ON churchops.members
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Pastors can view all members" ON churchops.members
    FOR SELECT USING (get_user_role() = 'pastor');

CREATE POLICY "Members can view their own record" ON churchops.members
    FOR SELECT USING (email = auth.email());

CREATE POLICY "Admins can update all members" ON churchops.members
    FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "Pastors can update all members" ON churchops.members
    FOR UPDATE USING (get_user_role() = 'pastor');

CREATE POLICY "Members can update their own record" ON churchops.members
    FOR UPDATE USING (email = auth.email());

CREATE POLICY "Admins can insert members" ON churchops.members
    FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'pastor'));

CREATE POLICY "Admins can delete members" ON churchops.members
    FOR DELETE USING (get_user_role() = 'admin');

-- Households table policies
CREATE POLICY "Admins can manage all households" ON churchops.households
    FOR ALL USING (get_user_role() IN ('admin', 'pastor'));

CREATE POLICY "Members can view their own household" ON churchops.households
    FOR SELECT USING (
        id IN (
            SELECT household_id FROM churchops.members 
            WHERE email = auth.email()
        )
    );

-- Events table policies (public events visible to all, private events restricted)
CREATE POLICY "Everyone can view public events" ON churchops.events
    FOR SELECT USING (is_public = true OR get_user_role() IN ('admin', 'pastor'));

CREATE POLICY "Admins can manage all events" ON churchops.events
    FOR ALL USING (get_user_role() IN ('admin', 'pastor'));

-- Donations table policies (sensitive financial data)
CREATE POLICY "Admins can view all donations" ON churchops.donations
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Pastors can view all donations" ON churchops.donations
    FOR SELECT USING (get_user_role() = 'pastor');

CREATE POLICY "Members can view their own donations" ON churchops.donations
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM churchops.members 
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Admins can manage donations" ON churchops.donations
    FOR ALL USING (get_user_role() IN ('admin', 'pastor'));