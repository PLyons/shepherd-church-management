-- Create trigger function to handle new user authentication
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    member_record RECORD;
BEGIN
    -- Check if there's a member with matching email
    SELECT * INTO member_record 
    FROM public.members 
    WHERE email = NEW.email;
    
    -- If member exists, update their auth metadata with role
    IF FOUND THEN
        UPDATE auth.users 
        SET app_metadata = app_metadata || jsonb_build_object('role', member_record.role)
        WHERE id = NEW.id;
    ELSE
        -- No matching member found - for security, we'll allow registration
        -- but with default 'member' role. Admin can update later.
        UPDATE auth.users 
        SET app_metadata = app_metadata || jsonb_build_object('role', 'member')
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();