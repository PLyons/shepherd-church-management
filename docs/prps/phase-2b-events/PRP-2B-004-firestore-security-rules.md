# PRP-2B-004: Firestore Security Rules for Events

**Phase**: 2B Event Calendar & Attendance System  
**Task**: 2B.4  
**Priority**: CRITICAL - Security foundation for event system  
**Estimated Time**: 2-3 hours  

## Purpose

Implement comprehensive Firestore security rules for events, RSVPs, and attendance data following the existing role-based access control patterns. Ensure proper data security while enabling required functionality for different user roles.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Security requirements and role definitions
- `firestore.rules` - Existing security patterns
- `docs/prps/phase-2b-events/PRP-2B-001-event-data-model.md` - Data structure
- Output from PRP-2B-001, PRP-2B-002, PRP-2B-003 - Event system components

**Key Security Principles:**
- Admin/pastor: Full event management access
- Member: Read public events, RSVP to allowed events
- Role-based event visibility
- Members can only manage their own RSVPs

## Requirements

**Dependencies:**
- **MUST complete PRP-2B-001, PRP-2B-002, PRP-2B-003 first**
- Existing security rule foundation
- Event and RSVP data structures

**Critical Requirements:**
1. **Role-based Access**: Respect admin/pastor/member hierarchy
2. **Event Visibility**: Public vs. private event access
3. **RSVP Security**: Members manage own RSVPs only
4. **Attendance Protection**: Admin/pastor only access
5. **Data Validation**: Ensure data integrity

## Detailed Procedure

### Step 1: Add Event Security Rules

Add to `firestore.rules` in events collection section:

```javascript
// Events collection
match /events/{eventId} {
  // Read access rules
  allow read: if isAuthenticated() && (
    // Public events readable by all
    resource.data.isPublic == true ||
    // Private events readable by required roles
    hasRole(resource.data.requiredRoles) ||
    // Admin/pastor can read all events
    isAdminOrPastor()
  );
  
  // Write access rules
  allow create: if isAdminOrPastor() && 
    isValidEventData() &&
    request.resource.data.createdBy == request.auth.uid;
    
  allow update: if isAdminOrPastor() && 
    isValidEventData() &&
    // Preserve original creator
    request.resource.data.createdBy == resource.data.createdBy;
    
  allow delete: if isAdminOrPastor();
  
  // RSVP subcollection
  match /rsvps/{rsvpId} {
    // Members can read RSVPs for events they can access
    allow read: if isAuthenticated() && (
      // Can read own RSVP
      resource.data.memberId == request.auth.uid ||
      // Admin/pastor can read all RSVPs
      isAdminOrPastor() ||
      // Event creators can read RSVPs
      get(/databases/$(database)/documents/events/$(eventId)).data.createdBy == request.auth.uid
    );
    
    // RSVP creation rules
    allow create: if isAuthenticated() && 
      isValidRSVPData() &&
      request.resource.data.memberId == request.auth.uid &&
      // Can only RSVP to events you can read
      canReadEvent(eventId);
      
    // RSVP update rules
    allow update: if isAuthenticated() && (
      // Members can update their own RSVPs
      (resource.data.memberId == request.auth.uid && 
       request.resource.data.memberId == request.auth.uid) ||
      // Admin/pastor can update any RSVP
      isAdminOrPastor()
    ) && isValidRSVPData();
    
    // RSVP deletion rules
    allow delete: if isAuthenticated() && (
      resource.data.memberId == request.auth.uid ||
      isAdminOrPastor()
    );
  }
  
  // Attendance subcollection
  match /attendance/{attendanceId} {
    // Only admin/pastor can access attendance data
    allow read, write: if isAdminOrPastor();
  }
}
```

### Step 2: Add Helper Functions

Add new helper functions to `firestore.rules`:

```javascript
// Add to helper functions section

function isValidEventData() {
  return request.resource.data.keys().hasAll(['title', 'startDate', 'endDate', 'eventType', 'isPublic']) &&
         request.resource.data.eventType in ['service', 'bible_study', 'prayer_meeting', 'youth_group', 'seniors_group', 'womens_ministry', 'mens_ministry', 'special_event', 'outreach', 'volunteer_activity', 'board_meeting', 'training', 'other'] &&
         request.resource.data.isPublic is bool &&
         request.resource.data.isActive is bool &&
         (!('requiredRoles' in request.resource.data) || request.resource.data.requiredRoles is list);
}

function isValidRSVPData() {
  return request.resource.data.keys().hasAll(['eventId', 'memberId', 'status']) &&
         request.resource.data.status in ['yes', 'no', 'maybe', 'waitlist'] &&
         request.resource.data.numberOfGuests is number &&
         request.resource.data.numberOfGuests >= 0;
}

function canReadEvent(eventId) {
  let eventData = get(/databases/$(database)/documents/events/$(eventId)).data;
  return eventData.isPublic == true || 
         hasRole(eventData.requiredRoles) || 
         isAdminOrPastor();
}

function isEventCreator(eventId) {
  return get(/databases/$(database)/documents/events/$(eventId)).data.createdBy == request.auth.uid;
}
```

### Step 3: Add Collection Group Rules

Add rules for collection group queries:

```javascript
// Add after existing collection rules

// Collection group for RSVP queries across events
match /{path=**}/rsvps/{rsvpId} {
  allow read: if isAuthenticated() && (
    resource.data.memberId == request.auth.uid ||
    isAdminOrPastor()
  );
}

// Collection group for attendance queries across events
match /{path=**}/attendance/{attendanceId} {
  allow read: if isAdminOrPastor();
}
```

### Step 4: Update Existing Helper Functions (if needed)

Ensure compatibility with existing role functions:

```javascript
// Verify these functions exist and work with event requirements
function hasRole(roles) {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/members/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role in roles;
}

function canManageEvents() {
  return isAdminOrPastor();
}

function canViewEventAnalytics() {
  return isAdminOrPastor();
}
```

### Step 5: Test Security Rules

Create test scenarios to validate rules:

```javascript
// Test cases for security rules (for documentation/validation)

// Test: Public event access
// - Any authenticated user should read public events
// - Only admin/pastor should write events

// Test: Private event access  
// - Only users with required roles should read private events
// - Admin/pastor should read all private events

// Test: RSVP access
// - Members should only RSVP to events they can read
// - Members should only manage their own RSVPs
// - Admin/pastor should manage any RSVP

// Test: Attendance access
// - Only admin/pastor should access attendance data
// - Collection group queries should respect permissions
```

### Step 6: Deploy and Validate Rules

1. Deploy rules to Firebase: `firebase deploy --only firestore:rules`
2. Test with Firebase emulator if available
3. Validate with different user roles
4. Verify collection group queries work correctly

## Success Criteria

**Security Validation:**
- [ ] Public events readable by all authenticated users
- [ ] Private events readable only by required roles + admin/pastor
- [ ] Only admin/pastor can create/update/delete events
- [ ] Members can only RSVP to events they can read
- [ ] Members can only manage their own RSVPs
- [ ] Only admin/pastor can access attendance data

**Data Integrity:**
- [ ] Event data validation prevents invalid data
- [ ] RSVP data validation ensures proper structure
- [ ] Required fields enforced correctly
- [ ] Enum values validated properly

**Performance:**
- [ ] Rules don't cause excessive Firestore reads
- [ ] Collection group queries work efficiently
- [ ] Security checks are optimized

## Files Created/Modified

**Modified Files:**
- `firestore.rules` (add events, RSVPs, attendance rules)

## Next Task

After completion, proceed to **PRP-2B-005: Event Form Component** which will implement the UI for creating and editing events using these secured data structures.

## Notes

- Rules follow the established pattern from members and households collections
- Event visibility is determined by isPublic flag and requiredRoles array
- RSVP permissions ensure members can only manage their own responses
- Attendance data is strictly protected for admin/pastor use only
- Collection group rules enable efficient cross-event queries while maintaining security
- Data validation prevents malformed events and RSVPs from being stored