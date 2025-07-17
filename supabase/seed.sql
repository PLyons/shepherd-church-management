-- Seed data for Shepherd Church Management System
-- This file contains initial data for testing and development

-- First, let's add some households for testing
INSERT INTO churchops.households (family_name, address_line1, city, state, postal_code, country) 
SELECT 'Test Family', '123 Test St', 'Test City', 'TX', '12345', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM churchops.households WHERE family_name = 'Test Family');

INSERT INTO churchops.households (family_name, address_line1, city, state, postal_code, country) 
SELECT 'Johnson Family', '123 Main St', 'Dallas', 'TX', '75001', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM churchops.households WHERE family_name = 'Johnson Family');

INSERT INTO churchops.households (family_name, address_line1, city, state, postal_code, country) 
SELECT 'Smith Family', '456 Oak Ave', 'Houston', 'TX', '77001', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM churchops.households WHERE family_name = 'Smith Family');

INSERT INTO churchops.households (family_name, address_line1, city, state, postal_code, country) 
SELECT 'Williams Family', '789 Pine Rd', 'Austin', 'TX', '78701', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM churchops.households WHERE family_name = 'Williams Family');

INSERT INTO churchops.households (family_name, address_line1, city, state, postal_code, country) 
SELECT 'Brown Family', '321 Elm St', 'San Antonio', 'TX', '78201', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM churchops.households WHERE family_name = 'Brown Family');

INSERT INTO churchops.households (family_name, address_line1, city, state, postal_code, country) 
SELECT 'Davis Family', '654 Maple Dr', 'Fort Worth', 'TX', '76101', 'USA'
WHERE NOT EXISTS (SELECT 1 FROM churchops.households WHERE family_name = 'Davis Family');

-- Add test admin user
INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Test Family' LIMIT 1),
    'Test', 'Admin', 'admin@test.com', '(555) 123-4567', 'admin', 'active', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'admin@test.com');

-- Johnson Family members
INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Johnson Family' LIMIT 1),
    'John', 'Johnson', 'john.johnson@email.com', '(555) 123-4567', '1980-03-15', 'Male', 'pastor', 'active', '2020-01-15'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'john.johnson@email.com');

INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Johnson Family' LIMIT 1),
    'Mary', 'Johnson', 'mary.johnson@email.com', '(555) 123-4568', '1982-07-22', 'Female', 'member', 'active', '2020-01-15'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'mary.johnson@email.com');

INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Johnson Family' LIMIT 1),
    'Sarah', 'Johnson', 'sarah.johnson@email.com', '(555) 123-4569', '2005-11-10', 'Female', 'member', 'active', '2020-01-15'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'sarah.johnson@email.com');

-- Smith Family members
INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Smith Family' LIMIT 1),
    'Robert', 'Smith', 'robert.smith@email.com', '(555) 234-5678', '1975-09-08', 'Male', 'member', 'active', '2019-06-20'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'robert.smith@email.com');

INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Smith Family' LIMIT 1),
    'Jennifer', 'Smith', 'jennifer.smith@email.com', '(555) 234-5679', '1978-12-14', 'Female', 'member', 'active', '2019-06-20'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'jennifer.smith@email.com');

-- Williams Family members
INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Williams Family' LIMIT 1),
    'James', 'Williams', 'james.williams@email.com', '(555) 345-6789', '1985-01-25', 'Male', 'member', 'active', '2021-03-10'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'james.williams@email.com');

INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Williams Family' LIMIT 1),
    'Linda', 'Williams', 'linda.williams@email.com', '(555) 345-6790', '1987-08-12', 'Female', 'member', 'active', '2021-03-10'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'linda.williams@email.com');

-- Brown Family members
INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Brown Family' LIMIT 1),
    'William', 'Brown', 'william.brown@email.com', '(555) 456-7890', '1990-06-30', 'Male', 'member', 'active', '2022-01-05'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'william.brown@email.com');

INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Brown Family' LIMIT 1),
    'Patricia', 'Brown', 'patricia.brown@email.com', '(555) 456-7891', '1992-02-14', 'Female', 'member', 'active', '2022-01-05'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'patricia.brown@email.com');

-- Davis Family members
INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Davis Family' LIMIT 1),
    'Richard', 'Davis', 'richard.davis@email.com', '(555) 567-8901', '1970-11-18', 'Male', 'member', 'inactive', '2018-09-12'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'richard.davis@email.com');

INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Davis Family' LIMIT 1),
    'Susan', 'Davis', 'susan.davis@email.com', '(555) 567-8902', '1972-03-05', 'Female', 'member', 'inactive', '2018-09-12'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'susan.davis@email.com');

-- Visitors
INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Test Family' LIMIT 1),
    'Mark', 'Thompson', 'mark.thompson@email.com', '(555) 678-9012', '1988-04-22', 'Male', 'member', 'visitor', '2024-06-15'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'mark.thompson@email.com');

INSERT INTO churchops.members (household_id, first_name, last_name, email, phone, birthdate, gender, role, member_status, joined_at)
SELECT 
    (SELECT id FROM churchops.households WHERE family_name = 'Test Family' LIMIT 1),
    'Lisa', 'Anderson', 'lisa.anderson@email.com', '(555) 789-0123', '1995-09-17', 'Female', 'member', 'visitor', '2024-07-01'
WHERE NOT EXISTS (SELECT 1 FROM churchops.members WHERE email = 'lisa.anderson@email.com');

-- Update primary contacts for households
UPDATE churchops.households 
SET primary_contact_id = (
    SELECT id FROM churchops.members 
    WHERE household_id = households.id 
    AND first_name = 'Test' AND last_name = 'Admin'
    LIMIT 1
) 
WHERE family_name = 'Test Family' AND primary_contact_id IS NULL;

UPDATE churchops.households 
SET primary_contact_id = (
    SELECT id FROM churchops.members 
    WHERE household_id = households.id 
    AND first_name = 'John' AND last_name = 'Johnson'
    LIMIT 1
) 
WHERE family_name = 'Johnson Family' AND primary_contact_id IS NULL;

UPDATE churchops.households 
SET primary_contact_id = (
    SELECT id FROM churchops.members 
    WHERE household_id = households.id 
    AND first_name = 'Robert' AND last_name = 'Smith'
    LIMIT 1
) 
WHERE family_name = 'Smith Family' AND primary_contact_id IS NULL;

UPDATE churchops.households 
SET primary_contact_id = (
    SELECT id FROM churchops.members 
    WHERE household_id = households.id 
    AND first_name = 'James' AND last_name = 'Williams'
    LIMIT 1
) 
WHERE family_name = 'Williams Family' AND primary_contact_id IS NULL;

UPDATE churchops.households 
SET primary_contact_id = (
    SELECT id FROM churchops.members 
    WHERE household_id = households.id 
    AND first_name = 'William' AND last_name = 'Brown'
    LIMIT 1
) 
WHERE family_name = 'Brown Family' AND primary_contact_id IS NULL;

UPDATE churchops.households 
SET primary_contact_id = (
    SELECT id FROM churchops.members 
    WHERE household_id = households.id 
    AND first_name = 'Richard' AND last_name = 'Davis'
    LIMIT 1
) 
WHERE family_name = 'Davis Family' AND primary_contact_id IS NULL;

-- Add some member events for testing
INSERT INTO churchops.member_events (member_id, event_type, event_date, notes)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1),
    'baptism', '2020-02-15', 'Baptized by Pastor Williams'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.member_events 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
    AND event_type = 'baptism' AND event_date = '2020-02-15'
);

INSERT INTO churchops.member_events (member_id, event_type, event_date, notes)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1),
    'marriage', '2020-02-01', 'Married John Johnson'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.member_events 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1)
    AND event_type = 'marriage' AND event_date = '2020-02-01'
);

INSERT INTO churchops.member_events (member_id, event_type, event_date, notes)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'sarah.johnson@email.com' LIMIT 1),
    'baptism', '2021-04-18', 'Baptized as a teenager'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.member_events 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'sarah.johnson@email.com' LIMIT 1)
    AND event_type = 'baptism' AND event_date = '2021-04-18'
);

-- Add some sample events
INSERT INTO churchops.events (title, description, start_time, end_time, location, is_public, created_by)
SELECT 
    'Sunday Service', 'Weekly worship service', 
    (CURRENT_DATE + INTERVAL '7 days')::DATE + TIME '10:00',
    (CURRENT_DATE + INTERVAL '7 days')::DATE + TIME '11:30',
    'Main Sanctuary', true,
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.events WHERE title = 'Sunday Service' AND DATE(start_time) = CURRENT_DATE + INTERVAL '7 days'
);

INSERT INTO churchops.events (title, description, start_time, end_time, location, is_public, created_by)
SELECT 
    'Bible Study', 'Weekly Bible study group', 
    (CURRENT_DATE + INTERVAL '3 days')::DATE + TIME '19:00',
    (CURRENT_DATE + INTERVAL '3 days')::DATE + TIME '20:30',
    'Fellowship Hall', true,
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.events WHERE title = 'Bible Study' AND DATE(start_time) = CURRENT_DATE + INTERVAL '3 days'
);

-- Add some sample donations
INSERT INTO churchops.donations (member_id, category_id, amount, donation_date, method)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1),
    (SELECT id FROM churchops.donation_categories WHERE name = 'Tithe' LIMIT 1),
    500.00, CURRENT_DATE, 'check'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.donations 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
    AND donation_date = CURRENT_DATE AND amount = 500.00
);

INSERT INTO churchops.donations (member_id, category_id, amount, donation_date, method)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'robert.smith@email.com' LIMIT 1),
    (SELECT id FROM churchops.donation_categories WHERE name = 'Missions' LIMIT 1),
    100.00, CURRENT_DATE, 'cash'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.donations 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'robert.smith@email.com' LIMIT 1)
    AND donation_date = CURRENT_DATE AND amount = 100.00
);

-- Add some sample sermons
INSERT INTO churchops.sermons (title, speaker_name, date_preached, notes, media_url, created_by)
SELECT 
    'Faith in Action', 'Pastor John Johnson', CURRENT_DATE - INTERVAL '7 days', 
    'Scripture: James 2:14-26

Main Points:
1. Faith without works is dead
2. True faith produces action
3. Love is demonstrated through service',
    'https://example.com/sermons/faith-in-action.mp3',
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.sermons WHERE title = 'Faith in Action' AND date_preached = CURRENT_DATE - INTERVAL '7 days'
);

INSERT INTO churchops.sermons (title, speaker_name, date_preached, notes, media_url, created_by)
SELECT 
    'Love Your Neighbor', 'Pastor John Johnson', CURRENT_DATE - INTERVAL '14 days', 
    'Scripture: Matthew 22:39

Main Points:
1. Love God with all your heart
2. Love your neighbor as yourself
3. Who is my neighbor?',
    'https://example.com/sermons/love-your-neighbor.mp3',
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.sermons WHERE title = 'Love Your Neighbor' AND date_preached = CURRENT_DATE - INTERVAL '14 days'
);

-- Events
INSERT INTO churchops.events (title, description, start_time, end_time, location, is_public, created_by)
SELECT 
    'Sunday Morning Service', 
    'Join us for worship, fellowship, and the Word of God. All are welcome!', 
    CURRENT_DATE + INTERVAL '7 days' + TIME '10:30:00',
    CURRENT_DATE + INTERVAL '7 days' + TIME '12:00:00',
    'Main Sanctuary',
    true,
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.events WHERE title = 'Sunday Morning Service' AND start_time::date = (CURRENT_DATE + INTERVAL '7 days')::date
);

INSERT INTO churchops.events (title, description, start_time, end_time, location, is_public, created_by)
SELECT 
    'Wednesday Bible Study', 
    'Deep dive into the book of Romans. Bring your Bible and notebook!', 
    CURRENT_DATE + INTERVAL '3 days' + TIME '19:00:00',
    CURRENT_DATE + INTERVAL '3 days' + TIME '20:30:00',
    'Fellowship Hall',
    false,
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.events WHERE title = 'Wednesday Bible Study' AND start_time::date = (CURRENT_DATE + INTERVAL '3 days')::date
);

INSERT INTO churchops.events (title, description, start_time, end_time, location, is_public, created_by)
SELECT 
    'Youth Group Meeting', 
    'Games, worship, and discussion for teens aged 13-18. Pizza provided!', 
    CURRENT_DATE + INTERVAL '5 days' + TIME '18:00:00',
    CURRENT_DATE + INTERVAL '5 days' + TIME '20:00:00',
    'Youth Room',
    false,
    (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.events WHERE title = 'Youth Group Meeting' AND start_time::date = (CURRENT_DATE + INTERVAL '5 days')::date
);

INSERT INTO churchops.events (title, description, start_time, end_time, location, is_public, created_by)
SELECT 
    'Community Outreach Day', 
    'Join us as we serve our community! We''ll be helping at the local food bank and visiting nursing homes.', 
    CURRENT_DATE + INTERVAL '14 days' + TIME '09:00:00',
    CURRENT_DATE + INTERVAL '14 days' + TIME '14:00:00',
    'Meet at Church Parking Lot',
    true,
    (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.events WHERE title = 'Community Outreach Day' AND start_time::date = (CURRENT_DATE + INTERVAL '14 days')::date
);

INSERT INTO churchops.events (title, description, start_time, end_time, location, is_public, created_by)
SELECT 
    'Prayer Meeting', 
    'Come together for a time of corporate prayer and intercession.', 
    CURRENT_DATE + INTERVAL '2 days' + TIME '06:00:00',
    CURRENT_DATE + INTERVAL '2 days' + TIME '07:00:00',
    'Prayer Room',
    false,
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.events WHERE title = 'Prayer Meeting' AND start_time::date = (CURRENT_DATE + INTERVAL '2 days')::date
);

-- Event Attendance (RSVPs)
INSERT INTO churchops.event_attendance (event_id, member_id, status)
SELECT 
    (SELECT id FROM churchops.events WHERE title = 'Sunday Morning Service' AND start_time::date = (CURRENT_DATE + INTERVAL '7 days')::date LIMIT 1),
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1),
    'Attending'
WHERE EXISTS (SELECT 1 FROM churchops.events WHERE title = 'Sunday Morning Service' AND start_time::date = (CURRENT_DATE + INTERVAL '7 days')::date)
AND NOT EXISTS (
    SELECT 1 FROM churchops.event_attendance 
    WHERE event_id = (SELECT id FROM churchops.events WHERE title = 'Sunday Morning Service' AND start_time::date = (CURRENT_DATE + INTERVAL '7 days')::date LIMIT 1)
    AND member_id = (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
);

INSERT INTO churchops.event_attendance (event_id, member_id, status)
SELECT 
    (SELECT id FROM churchops.events WHERE title = 'Sunday Morning Service' AND start_time::date = (CURRENT_DATE + INTERVAL '7 days')::date LIMIT 1),
    (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1),
    'Attending'
WHERE EXISTS (SELECT 1 FROM churchops.events WHERE title = 'Sunday Morning Service' AND start_time::date = (CURRENT_DATE + INTERVAL '7 days')::date)
AND NOT EXISTS (
    SELECT 1 FROM churchops.event_attendance 
    WHERE event_id = (SELECT id FROM churchops.events WHERE title = 'Sunday Morning Service' AND start_time::date = (CURRENT_DATE + INTERVAL '7 days')::date LIMIT 1)
    AND member_id = (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1)
);

INSERT INTO churchops.event_attendance (event_id, member_id, status)
SELECT 
    (SELECT id FROM churchops.events WHERE title = 'Youth Group Meeting' AND start_time::date = (CURRENT_DATE + INTERVAL '5 days')::date LIMIT 1),
    (SELECT id FROM churchops.members WHERE email = 'sarah.johnson@email.com' LIMIT 1),
    'Attending'
WHERE EXISTS (SELECT 1 FROM churchops.events WHERE title = 'Youth Group Meeting' AND start_time::date = (CURRENT_DATE + INTERVAL '5 days')::date)
AND NOT EXISTS (
    SELECT 1 FROM churchops.event_attendance 
    WHERE event_id = (SELECT id FROM churchops.events WHERE title = 'Youth Group Meeting' AND start_time::date = (CURRENT_DATE + INTERVAL '5 days')::date LIMIT 1)
    AND member_id = (SELECT id FROM churchops.members WHERE email = 'sarah.johnson@email.com' LIMIT 1)
);

-- Sample Donations
INSERT INTO churchops.donations (member_id, category_id, amount, donation_date, method, source_label, note)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1),
    (SELECT id FROM churchops.donation_categories WHERE name = 'Tithe' LIMIT 1),
    500.00,
    CURRENT_DATE - INTERVAL '3 days',
    'check',
    'Check #1001',
    'Monthly tithe'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.donations 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'john.johnson@email.com' LIMIT 1)
    AND donation_date = CURRENT_DATE - INTERVAL '3 days'
    AND amount = 500.00
);

INSERT INTO churchops.donations (member_id, category_id, amount, donation_date, method, source_label, note)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1),
    (SELECT id FROM churchops.donation_categories WHERE name = 'Missions' LIMIT 1),
    150.00,
    CURRENT_DATE - INTERVAL '1 week',
    'cash',
    NULL,
    'Special offering for missions'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.donations 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'mary.johnson@email.com' LIMIT 1)
    AND donation_date = CURRENT_DATE - INTERVAL '1 week'
    AND amount = 150.00
);

INSERT INTO churchops.donations (member_id, category_id, amount, donation_date, method, source_label, note)
SELECT 
    NULL, -- Anonymous donation
    (SELECT id FROM churchops.donation_categories WHERE name = 'Building' LIMIT 1),
    250.00,
    CURRENT_DATE - INTERVAL '5 days',
    'cash',
    NULL,
    'Anonymous building fund donation'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.donations 
    WHERE member_id IS NULL
    AND donation_date = CURRENT_DATE - INTERVAL '5 days'
    AND amount = 250.00
);

INSERT INTO churchops.donations (member_id, category_id, amount, donation_date, method, source_label, note)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'robert.smith@email.com' LIMIT 1),
    (SELECT id FROM churchops.donation_categories WHERE name = 'Tithe' LIMIT 1),
    300.00,
    CURRENT_DATE - INTERVAL '2 days',
    'online',
    'TX-2025-001',
    'Online tithe payment'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.donations 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'robert.smith@email.com' LIMIT 1)
    AND donation_date = CURRENT_DATE - INTERVAL '2 days'
    AND amount = 300.00
);

INSERT INTO churchops.donations (member_id, category_id, amount, donation_date, method, source_label, note)
SELECT 
    (SELECT id FROM churchops.members WHERE email = 'susan.smith@email.com' LIMIT 1),
    (SELECT id FROM churchops.donation_categories WHERE name = 'Missions' LIMIT 1),
    75.00,
    CURRENT_DATE - INTERVAL '10 days',
    'card',
    NULL,
    'Credit card donation'
WHERE NOT EXISTS (
    SELECT 1 FROM churchops.donations 
    WHERE member_id = (SELECT id FROM churchops.members WHERE email = 'susan.smith@email.com' LIMIT 1)
    AND donation_date = CURRENT_DATE - INTERVAL '10 days'
    AND amount = 75.00
);

COMMIT;