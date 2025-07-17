-- Grant table permissions to anon and authenticated roles for API access

-- Members table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.members TO authenticated;
GRANT SELECT ON churchops.members TO anon;

-- Households table  
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.households TO authenticated;
GRANT SELECT ON churchops.households TO anon;

-- Events table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.events TO authenticated;
GRANT SELECT ON churchops.events TO anon;

-- Event attendance table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.event_attendance TO authenticated;
GRANT SELECT ON churchops.event_attendance TO anon;

-- Member events table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.member_events TO authenticated;
GRANT SELECT ON churchops.member_events TO anon;

-- Donations table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.donations TO authenticated;
GRANT SELECT ON churchops.donations TO anon;

-- Donation categories table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.donation_categories TO authenticated;
GRANT SELECT ON churchops.donation_categories TO anon;

-- Sermons table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.sermons TO authenticated;
GRANT SELECT ON churchops.sermons TO anon;

-- Volunteer roles table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.volunteer_roles TO authenticated;
GRANT SELECT ON churchops.volunteer_roles TO anon;

-- Volunteer slots table
GRANT SELECT, INSERT, UPDATE, DELETE ON churchops.volunteer_slots TO authenticated;
GRANT SELECT ON churchops.volunteer_slots TO anon;