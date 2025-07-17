# Member & Household Management Testing

## Module Overview

The Member & Household Management module provides comprehensive tools for managing church members and their family relationships. This module includes member directories, individual profiles, household groupings, and relationship management with role-based permissions for data access and modification.

### Key Components
- **Member Directory**: Searchable, paginated list of all church members
- **Member Profiles**: Individual member information and contact details
- **Household Management**: Family groupings and relationship tracking
- **Member Creation**: New member onboarding and data entry
- **Contact Management**: Phone, email, and address information
- **Relationship Tracking**: Family connections and household structure

### Permission Levels
- **Admin**: Full CRUD access to all members and households
- **Pastor**: Full read access, limited edit access to member information
- **Member**: View access to directory, edit access to own profile only

## Test Scenarios

### TS-MEMBER-001: Member Directory Display and Navigation

**Objective**: Verify member directory loads correctly with proper display and navigation

**Preconditions**: 
- User is logged in with appropriate role
- Test data includes 14 members across 6 households
- Member directory is accessible

**Test Steps**:
1. Navigate to Members page (`/members`)
2. Verify member list displays with all required columns:
   - Name (First, Last)
   - Email address
   - Phone number
   - Household name
   - Member status (Active/Inactive)
   - Role (Admin/Pastor/Member)
3. Check pagination controls (if more than page size)
4. Verify member count display
5. Test navigation through pages (if applicable)
6. Verify member cards/rows are clickable
7. Check responsive design on mobile devices

**Expected Results**:
- All 14 test members display correctly
- Member information is accurate and complete
- Pagination works if more than page limit
- Member list is sorted alphabetically by last name
- All member links are functional
- Mobile layout displays properly
- Loading states appear appropriately

**Test Data**:
- 14 test members with complete profiles
- Various member statuses and roles
- Different household assignments

**Pass Criteria**: Member directory displays accurately with functional navigation

---

### TS-MEMBER-002: Member Search Functionality

**Objective**: Verify member search works across all searchable fields

**Preconditions**:
- Member directory is loaded
- Test members have diverse information for search testing
- Search functionality is available

**Test Steps**:
1. Test search by first name:
   - Enter "John" in search box
   - Verify results show only matching first names
2. Test search by last name:
   - Enter "Smith" in search box
   - Verify results show only matching last names
3. Test search by email:
   - Enter "admin@test.com" in search box
   - Verify results show matching email addresses
4. Test search by phone number:
   - Enter partial phone number
   - Verify results show matching phone numbers
5. Test partial matches:
   - Enter "Joh" and verify "John" appears
6. Test case insensitive search:
   - Enter "smith" and verify "Smith" appears
7. Test empty search results:
   - Enter "NonExistentName"
   - Verify "No members found" message
8. Test search clearing:
   - Clear search box
   - Verify all members return

**Expected Results**:
- Search works across all specified fields
- Partial matches return appropriate results
- Case insensitive search functions properly
- Empty results show appropriate message
- Search clearing restores full list
- Search is responsive and real-time
- Search performance is acceptable (< 1 second)

**Test Data**:
- Members with names: John, Jane, Smith, Johnson
- Various email formats and phone numbers
- Special characters in names

**Pass Criteria**: Search returns accurate results across all searchable fields

---

### TS-MEMBER-003: Individual Member Profile Display

**Objective**: Verify individual member profiles display complete and accurate information

**Preconditions**:
- User has access to member profiles
- Test member has complete profile data
- Member profile page is accessible

**Test Steps**:
1. Click on a member from the directory
2. Verify navigation to member profile page (`/members/{id}`)
3. Check personal information display:
   - Full name (first, middle, last)
   - Email address with mailto link
   - Phone number with tel link
   - Date of birth (if available)
   - Gender
   - Member status
   - Church role
4. Verify household information:
   - Household name with link
   - Relationship to household
   - Other household members listed
5. Check additional information:
   - Join date
   - Member notes (if any)
   - Recent activity (if displayed)
6. Verify action buttons appropriate to user role:
   - Edit Profile (Admin/Pastor/Own profile)
   - Contact links functional
   - Household navigation working

**Expected Results**:
- All member information displays accurately
- Contact links (email, phone) function properly
- Household relationships display correctly
- Role-appropriate action buttons appear
- Navigation links work properly
- Profile loads quickly (< 3 seconds)
- Mobile layout is functional

**Test Data**:
- Complete member profile with all fields populated
- Member with household relationships
- Member with various contact methods

**Pass Criteria**: Member profile displays complete, accurate information with functional links

---

### TS-MEMBER-004: Member Profile Editing (Admin/Pastor)

**Objective**: Verify admin and pastor users can edit member profiles correctly

**Preconditions**:
- User is logged in as Admin or Pastor
- Test member profile exists
- Edit permissions are properly configured

**Test Steps**:
1. Navigate to member profile page
2. Click "Edit Profile" button
3. Verify edit form displays with current data populated
4. Test field editing:
   - Modify first name
   - Update email address
   - Change phone number
   - Update member status
   - Modify church role (Admin only)
   - Change household assignment
5. Test form validation:
   - Enter invalid email format
   - Enter invalid phone format
   - Leave required fields empty
6. Save changes and verify:
   - Success message displays
   - Changes are reflected on profile
   - Data persists after page refresh
7. Test cancel functionality:
   - Make changes but click Cancel
   - Verify changes are not saved

**Expected Results**:
- Edit form loads with current data
- All editable fields can be modified
- Form validation works properly
- Changes save successfully
- Success/error messages display appropriately
- Cancel function works without saving
- Data validation prevents invalid entries

**Test Data**:
- Valid email: `newemail@test.com`
- Invalid email: `invalid-email`
- Valid phone: `555-123-4567`
- Invalid phone: `not-a-phone`

**Pass Criteria**: Profile editing works correctly with proper validation and persistence

---

### TS-MEMBER-005: Member Profile Self-Editing (Member Role)

**Objective**: Verify members can edit their own profiles with appropriate limitations

**Preconditions**:
- User is logged in as Member role
- User has access to their own profile
- Self-editing permissions configured

**Test Steps**:
1. Navigate to own member profile
2. Click "Edit Profile" button
3. Verify editable fields (should be limited):
   - First name
   - Last name
   - Email address
   - Phone number
   - Personal notes/preferences
4. Verify restricted fields (read-only):
   - Church role
   - Member status
   - Household assignment
   - Administrative fields
5. Test form validation for allowed fields
6. Save changes and verify persistence
7. Attempt to navigate to other member profiles
8. Verify edit access only to own profile

**Expected Results**:
- Member can edit personal contact information
- Administrative fields are read-only
- Cannot edit other members' profiles
- Form validation works for editable fields
- Changes save successfully
- Appropriate access restrictions enforced

**Test Data**:
- Member's own profile data
- Attempts to access other member profiles

**Pass Criteria**: Members can edit own profiles with appropriate restrictions

---

### TS-MEMBER-006: New Member Creation (Admin/Pastor)

**Objective**: Verify admin and pastor users can create new members successfully

**Preconditions**:
- User logged in as Admin or Pastor
- Member creation form is accessible
- Household data exists for assignment

**Test Steps**:
1. Navigate to Members page
2. Click "Add New Member" or similar button
3. Verify new member form displays
4. Fill out required fields:
   - First name: "Test"
   - Last name: "NewMember"
   - Email: "testnew@example.com"
   - Phone: "555-987-6543"
   - Member status: "Active"
   - Church role: "Member"
5. Select household assignment:
   - Choose existing household OR
   - Create new household
6. Fill optional fields:
   - Date of birth
   - Gender
   - Notes
7. Submit form and verify:
   - Success message displays
   - New member appears in directory
   - Profile page accessible
   - Household assignment correct
8. Test form validation with missing required fields
9. Test duplicate email validation

**Expected Results**:
- New member form accessible to authorized roles
- All fields validate properly
- Required field validation works
- Duplicate email detection functions
- New member created successfully
- Member appears in directory immediately
- Household assignment works correctly

**Test Data**:
- Complete new member information
- Existing household for assignment
- Duplicate email for validation test

**Pass Criteria**: New members created successfully with proper validation

---

### TS-MEMBER-007: Household Profile Display

**Objective**: Verify household profiles display complete family information

**Preconditions**:
- Household data exists with multiple members
- User has access to household information
- Household profiles are accessible

**Test Steps**:
1. Navigate to Households page (`/households`)
2. Click on a household from the list
3. Verify household profile displays:
   - Household name
   - Primary contact designation
   - Complete address information
   - Phone number (household)
   - Email (if available)
4. Check member list within household:
   - All household members listed
   - Member names are clickable links
   - Relationship to household shown
   - Member roles displayed
5. Verify household statistics:
   - Total member count
   - Active vs inactive members
   - Adult vs child counts (if applicable)
6. Test navigation links:
   - Member profile links work
   - Back to household list functions

**Expected Results**:
- Complete household information displays
- All household members listed accurately
- Member links navigate to individual profiles
- Relationship information is correct
- Contact information displays properly
- Navigation functions work

**Test Data**:
- Household with multiple members
- Household with various member relationships
- Complete address and contact information

**Pass Criteria**: Household profiles display complete, accurate family information

---

### TS-MEMBER-008: Household Management (Admin/Pastor)

**Objective**: Verify authorized users can manage household information

**Preconditions**:
- User logged in as Admin or Pastor
- Household exists with members
- Edit permissions configured

**Test Steps**:
1. Navigate to household profile
2. Click "Edit Household" button
3. Test household information editing:
   - Modify household name
   - Update address information
   - Change primary contact
   - Update household phone/email
4. Test member management within household:
   - Add existing member to household
   - Remove member from household
   - Change member relationships
   - Set primary contact designation
5. Test household creation:
   - Create new household
   - Set initial household information
   - Assign members to new household
6. Save changes and verify persistence
7. Test validation for required fields

**Expected Results**:
- Household information can be edited
- Members can be added/removed from household
- Primary contact can be designated
- New households can be created
- Changes persist correctly
- Form validation works properly

**Test Data**:
- Existing household with members
- New household information
- Members for household assignment

**Pass Criteria**: Household management functions work correctly with proper validation

---

### TS-MEMBER-009: Member Status Management

**Objective**: Verify member status changes work correctly and affect system behavior

**Preconditions**:
- User logged in as Admin or Pastor
- Members with different statuses exist
- Status change permissions configured

**Test Steps**:
1. Navigate to member profile with "Active" status
2. Edit member profile
3. Change status from "Active" to "Inactive"
4. Save changes and verify:
   - Status updates in profile
   - Status reflects in member directory
   - Inactive member behavior changes (if applicable)
5. Test status change from "Inactive" to "Active"
6. Verify status filtering in member directory:
   - Filter by "Active" members only
   - Filter by "Inactive" members only
   - Show all members regardless of status
7. Test status impact on other features:
   - Event RSVP availability
   - Volunteer assignment eligibility
   - Email/communication inclusion

**Expected Results**:
- Member status changes successfully
- Status updates reflect throughout system
- Filtering by status works correctly
- Status affects feature availability appropriately
- Inactive members handled properly in other modules

**Test Data**:
- Members with Active status
- Members with Inactive status
- Various system features that depend on member status

**Pass Criteria**: Member status management works correctly and affects system behavior appropriately

---

### TS-MEMBER-010: Data Integrity and Relationships

**Objective**: Verify data relationships and integrity are maintained correctly

**Preconditions**:
- Complex member and household relationships exist
- Related data in other modules (events, donations, etc.)
- Data integrity constraints configured

**Test Steps**:
1. Test member deletion (if allowed):
   - Attempt to delete member with related data
   - Verify appropriate warnings/restrictions
   - Test cascade behavior (if applicable)
2. Test household relationship integrity:
   - Move member between households
   - Verify old relationships are updated
   - Confirm new relationships are established
3. Test orphaned data handling:
   - Remove member from household
   - Verify household member count updates
   - Check for orphaned records
4. Test data validation across relationships:
   - Primary contact must be household member
   - Email uniqueness across all members
   - Phone number format consistency
5. Verify foreign key constraints:
   - Cannot assign member to non-existent household
   - Cannot set invalid primary contact
   - Related data maintains referential integrity

**Expected Results**:
- Data relationships maintained correctly
- Deletion restrictions protect data integrity
- Moving members updates all related records
- Validation prevents invalid relationships
- Foreign key constraints enforced properly
- No orphaned or corrupted data created

**Test Data**:
- Members with extensive related data
- Complex household relationships
- Invalid relationship scenarios for testing

**Pass Criteria**: Data integrity maintained across all operations

---

## Cross-Module Integration Tests

### TS-MEMBER-INT-001: Member to Event Integration
**Objective**: Verify member data integrates correctly with event management
- Member RSVP functionality
- Event attendance tracking
- Member event history

### TS-MEMBER-INT-002: Member to Donation Integration
**Objective**: Verify member data integrates with donation management
- Donation attribution to members
- Member giving history
- Anonymous vs member donations

### TS-MEMBER-INT-003: Member to Volunteer Integration
**Objective**: Verify member data integrates with volunteer management
- Volunteer signup using member data
- Member volunteer history
- Role-based volunteer eligibility

## Performance Benchmarks

- **Member Directory Load**: < 3 seconds for 100+ members
- **Member Search**: < 1 second response time
- **Member Profile Load**: < 2 seconds
- **Profile Edit Save**: < 2 seconds
- **New Member Creation**: < 3 seconds
- **Household Profile Load**: < 2 seconds

## Data Validation Rules

### Required Fields
- **Member**: First Name, Last Name, Email
- **Household**: Household Name, Primary Address

### Format Validation
- **Email**: Valid email format with @ and domain
- **Phone**: Consistent format (e.g., 555-123-4567)
- **Date of Birth**: Valid date format, reasonable age ranges

### Business Rules
- **Email Uniqueness**: No duplicate email addresses
- **Primary Contact**: Must be a member of the household
- **Member Status**: Must be Active or Inactive
- **Church Role**: Must be Admin, Pastor, or Member

## Common Issues and Solutions

### Member Not Found in Search
- **Check**: Name spelling variations
- **Verify**: Member status (Active vs Inactive)
- **Action**: Try partial name search

### Cannot Edit Member Profile
- **Check**: User role permissions
- **Verify**: Member is own profile (for Member role)
- **Action**: Contact administrator for access

### Household Assignment Issues
- **Check**: Household exists and is active
- **Verify**: User has permission to modify households
- **Action**: Create household first if needed

### Data Not Saving
- **Check**: All required fields completed
- **Verify**: Valid email and phone formats
- **Action**: Review validation error messages

---

**Module Testing Status**: ⚠️ In Progress  
**Last Updated**: July 17, 2025  
**Critical Test Count**: 10  
**Integration Test Count**: 3  
**Estimated Testing Time**: 6-8 hours