#!/bin/bash

# Script to update all components from Supabase to Firebase
# Run this from the project root directory

echo "🔄 Starting Firebase migration for all components..."

# List of files to update (from the audit)
FILES=(
    "src/pages/MemberProfile.tsx"
    "src/pages/HouseholdProfile.tsx" 
    "src/pages/Events.tsx"
    "src/pages/EventForm.tsx"
    "src/pages/EventDetail.tsx"
    "src/pages/Donations.tsx"
    "src/pages/Reports.tsx"
    "src/pages/Sermons.tsx"
    "src/pages/Volunteers.tsx"
    "src/pages/MyVolunteering.tsx"
    "src/pages/SetPassword.tsx"
    "src/pages/AuthCallback.tsx"
    "src/pages/QRRegistration.tsx"
    "src/components/members/MemberForm.tsx"
)

# Replace Supabase imports with Firebase
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating: $file"
        
        # Replace import statements
        sed -i '' 's/import { supabase } from.*supabase.*/import { firebaseService } from "..\/..\/services\/firebase";/g' "$file"
        sed -i '' 's/import.*supabase.*//g' "$file"
        
        # Replace common field mappings (PostgreSQL -> Firestore)
        sed -i '' 's/first_name/firstName/g' "$file"
        sed -i '' 's/last_name/lastName/g' "$file" 
        sed -i '' 's/member_status/memberStatus/g' "$file"
        sed -i '' 's/household_id/householdId/g' "$file"
        sed -i '' 's/family_name/familyName/g' "$file"
        sed -i '' 's/is_primary_contact/isPrimaryContact/g' "$file"
        sed -i '' 's/start_time/startTime/g' "$file"
        sed -i '' 's/end_time/endTime/g' "$file"
        sed -i '' 's/is_public/isPublic/g' "$file"
        sed -i '' 's/created_by/createdBy/g' "$file"
        
        echo "✅ Updated: $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo ""
echo "⚠️  MANUAL UPDATES STILL NEEDED:"
echo "These files need manual review for complex Supabase queries:"
echo "- Event pages may need RSVP/attendance logic updates"
echo "- Profile pages may need relationship queries updated"
echo "- Forms may need validation updates"
echo ""
echo "✅ Basic Firebase migration completed!"
echo "🔍 Please review and test each updated component."