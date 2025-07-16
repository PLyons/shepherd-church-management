-- Create test household and member for login testing
-- First, insert a test household
INSERT INTO public.households (family_name, city, state, country) 
VALUES ('Test Family', 'Test City', 'TX', 'USA');

-- Get the household ID (replace with actual ID from above insert)
-- Then insert a test member with admin role
INSERT INTO public.members (
    household_id, 
    first_name, 
    last_name, 
    email, 
    role, 
    member_status,
    joined_at
) VALUES (
    (SELECT id FROM public.households WHERE family_name = 'Test Family' LIMIT 1),
    'Test',
    'Admin',
    'admin@test.com',
    'admin',
    'active',
    CURRENT_DATE
);

-- Verify the test user was created
SELECT m.*, h.family_name 
FROM public.members m 
JOIN public.households h ON m.household_id = h.id 
WHERE m.email = 'admin@test.com';