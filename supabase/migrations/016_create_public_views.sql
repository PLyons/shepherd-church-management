-- Create views in public schema that map to churchops tables
-- This allows PostgREST to expose the tables via the API

-- Events view
CREATE VIEW public.events AS 
SELECT * FROM churchops.events;

-- Event attendance view
CREATE VIEW public.event_attendance AS 
SELECT * FROM churchops.event_attendance;

-- Members view
CREATE VIEW public.members AS 
SELECT * FROM churchops.members;

-- Households view
CREATE VIEW public.households AS 
SELECT * FROM churchops.households;

-- Member events view
CREATE VIEW public.member_events AS 
SELECT * FROM churchops.member_events;

-- Donations view
CREATE VIEW public.donations AS 
SELECT * FROM churchops.donations;

-- Donation categories view
CREATE VIEW public.donation_categories AS 
SELECT * FROM churchops.donation_categories;

-- Sermons view
CREATE VIEW public.sermons AS 
SELECT * FROM churchops.sermons;

-- Volunteer roles view
CREATE VIEW public.volunteer_roles AS 
SELECT * FROM churchops.volunteer_roles;

-- Volunteer slots view
CREATE VIEW public.volunteer_slots AS 
SELECT * FROM churchops.volunteer_slots;

-- Grant permissions on views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendance TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_events TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_categories TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sermons TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_roles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_slots TO authenticated, anon;