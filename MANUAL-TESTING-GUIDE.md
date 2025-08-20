# Phase 0.1 Enhanced Member Form - Manual Testing Guide

**Application URL**: http://localhost:5176  
**Testing Date**: 2025-08-20  
**Phase**: 0.1 Integration Testing

## Pre-Testing Setup

1. **Ensure Development Server is Running**
   ```bash
   npm run dev
   # Should show: ➜ Local: http://localhost:5176/
   ```

2. **Login Requirements**
   - You'll need admin or pastor role to create/edit members
   - Navigate to login page if not authenticated

3. **Browser Developer Tools**
   - Open browser dev tools (F12)
   - Monitor Console tab for errors
   - Monitor Network tab for API calls

---

## PHASE 1: CREATE MEMBER TESTING

### Test 1.1: Simple Member Creation (Required Fields Only)

**Navigation**: http://localhost:5176/members/new

**Steps**:
1. Click "Basic Information" section (should be expanded by default)
2. Fill required fields:
   - First Name: "John"
   - Last Name: "Doe"
3. Click "Administrative" section
4. Verify defaults:
   - Member Status: "Active"
   - Role: "Member"
5. Click "Create Member" button

**Expected Results**:
✅ Form submits successfully  
✅ Redirected to member list (/members)  
✅ "John Doe" appears in member list  
✅ Email column shows "N/A"  
✅ Phone column shows "N/A"  
✅ No console errors  

### Test 1.2: Complex Member Creation (All Fields + Arrays)

**Navigation**: http://localhost:5176/members/new

**Steps**:
1. **Basic Information Section**:
   - Prefix: "Dr."
   - First Name: "Jane"
   - Middle Name: "Marie"
   - Last Name: "Smith"
   - Suffix: "Jr."
   - Gender: "Female"
   - Birth Date: "1990-05-15"
   - Anniversary Date: "2015-06-20"
   - Marital Status: "Married"

2. **Contact Information Section**:
   - **Emails**: 
     - Add Email 1: Type="Home", Address="jane.home@example.com", Primary=✓
     - Click "Add Email"
     - Add Email 2: Type="Work", Address="jane.work@company.com", Primary=☐
   - **Phones**:
     - Phone 1: Type="Mobile", Number="555-0123", Primary=✓, SMS Opt-in=✓
     - Click "Add Phone"
     - Phone 2: Type="Home", Number="555-4567", Primary=☐

3. **Addresses Section** (click to expand):
   - Click "Add Address"
   - Type: "Home"
   - Address Line 1: "123 Main Street"
   - Address Line 2: "Apt 4B"
   - City: "Anytown"
   - State: "CA"
   - ZIP Code: "12345"
   - Country: "United States"
   - Primary: ✓

4. **Administrative Section**:
   - Member Status: "Active"
   - Role: "Pastor"

5. Click "Create Member"

**Expected Results**:
✅ All collapsible sections work correctly  
✅ SMS opt-in checkbox only appears for mobile phones  
✅ Add/remove buttons for arrays work  
✅ Form submits successfully  
✅ Redirected to member list  
✅ "Dr. Jane Marie Smith Jr." appears in list  
✅ Email column shows "jane.home@example.com" (primary)  
✅ Phone column shows "555-0123" (primary mobile)  
✅ Role shows "Pastor" badge  
✅ No console errors  

---

## PHASE 2: EDIT MEMBER TESTING

### Test 2.1: Edit Existing Member (Data Migration)

**Setup**: First create a member using old form if available, or use existing data

**Navigation**: http://localhost:5176/members  
**Steps**:
1. Find a member in the list
2. Click "View" next to member name
3. Look for an "Edit" button or navigate to `/members/edit/{member-id}`

**Expected Results for Edit Form**:
✅ Form loads with existing data  
✅ If old member has deprecated `email` field, it should appear in emails array  
✅ If old member has deprecated `phone` field, it should appear in phones array  
✅ All sections populate correctly  
✅ Can modify arrays (add/remove emails, phones, addresses)  
✅ Save button works  

### Test 2.2: Array Manipulation

**Steps**:
1. Edit an existing member
2. **Email Array Tests**:
   - Add a new email
   - Remove an existing email (if multiple exist)
   - Change primary email designation
   - Try to remove all emails (should still save)
3. **Phone Array Tests**:
   - Add a new phone with type "Mobile"
   - Verify SMS opt-in checkbox appears
   - Add a "Home" phone, verify no SMS checkbox
   - Change primary phone
4. **Address Array Tests**:
   - Add a new address
   - Remove an address
   - Change primary address
5. Click "Update Member"

**Expected Results**:
✅ Add/remove buttons work correctly  
✅ Primary designations can be changed  
✅ SMS opt-in only appears for mobile phones  
✅ Arrays can be empty (fallback to 'N/A' in list)  
✅ Updates save successfully  
✅ Member list reflects changes  

---

## PHASE 3: VALIDATION TESTING

### Test 3.1: Required Field Validation

**Navigation**: http://localhost:5176/members/new

**Steps**:
1. Leave First Name empty, try to submit
2. Leave Last Name empty, try to submit
3. Enter invalid email format in email array
4. Try various combinations of empty required fields

**Expected Results**:
✅ Form shows validation errors for required fields  
✅ Cannot submit form with missing required fields  
✅ Email validation works (proper format required)  
✅ Error messages are clear and helpful  

### Test 3.2: UI/UX Features

**Steps**:
1. Test all collapsible sections (Basic, Contact, Addresses, Administrative)
2. Test form sections expand/collapse properly
3. Add multiple emails/phones/addresses to test scrolling
4. Test responsive behavior (resize browser window)

**Expected Results**:
✅ Collapsible sections work smoothly  
✅ Icons change (chevron up/down)  
✅ Form is responsive on different screen sizes  
✅ Array items display clearly  
✅ No layout issues or overlapping elements  

---

## PHASE 4: DATA VERIFICATION

### Test 4.1: Firestore Console Verification

**Steps**:
1. Create a complex member with arrays
2. Open Firebase Console: https://console.firebase.google.com
3. Navigate to Firestore Database
4. Find the `members` collection
5. Locate the document for the member you just created

**Expected Firestore Document Structure**:
```json
{
  "first_name": "Jane",
  "middle_name": "Marie", 
  "last_name": "Smith",
  "prefix": "Dr.",
  "suffix": "Jr.",
  "marital_status": "married",
  "member_status": "active",
  "role": "pastor",
  "emails": [
    {
      "type": "home",
      "address": "jane.home@example.com",
      "primary": true
    },
    {
      "type": "work", 
      "address": "jane.work@company.com",
      "primary": false
    }
  ],
  "phones": [
    {
      "type": "mobile",
      "number": "555-0123",
      "primary": true,
      "sms_opt_in": true
    },
    {
      "type": "home",
      "number": "555-4567", 
      "primary": false
    }
  ],
  "addresses": [
    {
      "type": "home",
      "address_line1": "123 Main Street",
      "address_line2": "Apt 4B", 
      "city": "Anytown",
      "state": "CA",
      "postal_code": "12345",
      "country": "United States",
      "primary": true
    }
  ],
  "created_at": "Timestamp",
  "updated_at": "Timestamp"
}
```

**Verification Checklist**:
✅ All field names are in snake_case (first_name, not firstName)  
✅ Nested arrays preserved with correct structure  
✅ Boolean values correct (true/false, not strings)  
✅ Timestamps are Firestore Timestamp objects  
✅ No deprecated fields if using arrays  

### Test 4.2: Data Loading Verification

**Steps**:
1. Refresh the member list page
2. Verify member appears with correct primary email/phone
3. Edit the member again
4. Verify all data loads correctly in the form

**Expected Results**:
✅ snake_case data from Firestore converts to camelCase in React  
✅ Arrays populate correctly in form fields  
✅ Primary contact info displays correctly in member list  
✅ Edit form pre-populates all fields correctly  

---

## PHASE 5: ERROR HANDLING & EDGE CASES

### Test 5.1: Network Error Handling

**Steps**:
1. Open browser dev tools, go to Network tab
2. Block network requests (Chrome: right-click, "Block request URL")
3. Try to create/update a member
4. Restore network, try again

**Expected Results**:
✅ Appropriate error messages shown to user  
✅ Form doesn't crash or show white screen  
✅ Retry works when network restored  

### Test 5.2: Mixed Data Scenarios

**Test with existing data that has both old and new fields**:

**Expected Results**:
✅ Arrays take precedence over deprecated fields  
✅ If arrays are empty, falls back to deprecated fields  
✅ Migration happens seamlessly during edit  

---

## COMPLETION CHECKLIST

### Core Functionality ✓
- [ ] Create simple member (required fields only)
- [ ] Create complex member (all fields + arrays) 
- [ ] Edit existing members
- [ ] Data migration from old to new format
- [ ] Member list displays primary contacts correctly

### Technical Verification ✓
- [ ] No console errors during normal use
- [ ] TypeScript compilation successful (11 errors or fewer)
- [ ] Development server runs without issues
- [ ] Firestore data stored in snake_case format
- [ ] React components use camelCase data

### User Experience ✓  
- [ ] Collapsible sections work properly
- [ ] Add/remove array items functions correctly
- [ ] SMS opt-in conditional on mobile phone type
- [ ] Form validation prevents invalid submissions
- [ ] Success/error messages display appropriately

### Data Integrity ✓
- [ ] Primary email/phone selection works
- [ ] Arrays can be empty (graceful fallback)
- [ ] Timestamps generated correctly
- [ ] No data loss during edit operations
- [ ] Migration preserves existing data

---

## REPORTING ISSUES

**When reporting issues, please include**:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors (if any)
5. Screenshots (if UI-related)

**Issue Categories**:
- **Critical**: Prevents core functionality (create/edit members)
- **High**: Data loss or corruption
- **Medium**: UI/UX issues
- **Low**: Minor display or validation issues

---

## SUCCESS CRITERIA SUMMARY

✅ **Phase 0.1 Complete When**:
- All manual tests pass
- No critical or high severity issues
- Data flows correctly from React → Firestore and back
- Enhanced member form fully functional
- Backward compatibility maintained
- Member list displays enhanced data correctly

**Development Server**: http://localhost:5176  
**Test Duration**: Plan 30-45 minutes for complete testing  
**Recommended Browser**: Chrome or Firefox with dev tools open