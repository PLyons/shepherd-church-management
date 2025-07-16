-- Enable Row Level Security on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_slots ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE((auth.jwt() -> 'app_metadata' ->> 'role')::TEXT, 'member');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Members table policies
CREATE POLICY "Admins can view all members" ON public.members
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Pastors can view all members" ON public.members
    FOR SELECT USING (get_user_role() = 'pastor');

CREATE POLICY "Members can view their own record" ON public.members
    FOR SELECT USING (email = auth.email());

CREATE POLICY "Admins can update all members" ON public.members
    FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "Pastors can update all members" ON public.members
    FOR UPDATE USING (get_user_role() = 'pastor');

CREATE POLICY "Members can update their own record" ON public.members
    FOR UPDATE USING (email = auth.email());

CREATE POLICY "Admins can insert members" ON public.members
    FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'pastor'));

CREATE POLICY "Admins can delete members" ON public.members
    FOR DELETE USING (get_user_role() = 'admin');

-- Households table policies
CREATE POLICY "Admins can manage all households" ON public.households
    FOR ALL USING (get_user_role() IN ('admin', 'pastor'));

CREATE POLICY "Members can view their own household" ON public.households
    FOR SELECT USING (
        id IN (
            SELECT household_id FROM public.members 
            WHERE email = auth.email()
        )
    );

-- Events table policies (public events visible to all, private events restricted)
CREATE POLICY "Everyone can view public events" ON public.events
    FOR SELECT USING (is_public = true OR get_user_role() IN ('admin', 'pastor'));

CREATE POLICY "Admins can manage all events" ON public.events
    FOR ALL USING (get_user_role() IN ('admin', 'pastor'));

-- Donations table policies (sensitive financial data)
CREATE POLICY "Admins can view all donations" ON public.donations
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Pastors can view all donations" ON public.donations
    FOR SELECT USING (get_user_role() = 'pastor');

CREATE POLICY "Members can view their own donations" ON public.donations
    FOR SELECT USING (
        member_id IN (
            SELECT id FROM public.members 
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Admins can manage donations" ON public.donations
    FOR ALL USING (get_user_role() IN ('admin', 'pastor'));