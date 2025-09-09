# PRP-2C-004: Firestore Security Rules for Donations

**Phase**: 2C Donation Tracking & Financial Management  
**Task**: 2C.4  
**Priority**: CRITICAL - Security foundation for financial data  
**Estimated Time**: 3-4 hours  

## Purpose

Implement comprehensive Firestore security rules for donations and donation categories with strict financial data protection. Ensure members can only access their own donation data, pastors can read aggregate data without individual donation details, and admins have full access with audit logging requirements.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Security requirements and financial data protection principles
- `firestore.rules` - Existing security patterns and helper functions
- `docs/prps/phase-2c-donations/PRP-2C-001-donation-data-model.md` - Data structure
- Output from PRP-2C-001, PRP-2C-002, PRP-2C-003 - Donation system components

**Key Security Principles:**
- **CRITICAL**: Members can ONLY see their own donations (memberId == request.auth.uid)
- Pastors can read aggregate data but NOT individual donation details
- Admins have full read/write access to all donation data
- All financial data access must be auditable
- Donation categories are read-only for members, write access for admin/pastor only

## Requirements

**Dependencies:**
- **MUST complete PRP-2C-001, PRP-2C-002, PRP-2C-003 first**
- Existing security rule foundation
- Donation and donation-categories data structures

**Critical Security Requirements:**
1. **Financial Privacy**: Members see only their own donation history
2. **Pastoral Aggregates**: Pastors access summary data only, no individual amounts
3. **Admin Full Access**: Complete financial data access for administration
4. **Audit Trail**: All financial data access must be trackable
5. **Data Validation**: Ensure donation data integrity and prevent tampering

## Detailed Procedure

### Step 1: Add Donation Helper Functions

Add to `firestore.rules` helper functions section:

```javascript
// Add to helper functions section

function isValidDonationData() {
  return request.resource.data.keys().hasAll(['memberId', 'amount', 'method', 'category', 'date']) &&
         request.resource.data.amount is number &&
         request.resource.data.amount > 0 &&
         request.resource.data.method in ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'other'] &&
         request.resource.data.category is string &&
         request.resource.data.date is timestamp &&
         (!('isRecurring' in request.resource.data) || request.resource.data.isRecurring is bool) &&
         (!('recurringFrequency' in request.resource.data) || request.resource.data.recurringFrequency in ['weekly', 'monthly', 'quarterly', 'annually']) &&
         (!('notes' in request.resource.data) || request.resource.data.notes is string);
}

function isValidDonationCategoryData() {
  return request.resource.data.keys().hasAll(['name', 'description', 'isActive']) &&
         request.resource.data.name is string &&
         request.resource.data.description is string &&
         request.resource.data.isActive is bool &&
         (!('sortOrder' in request.resource.data) || request.resource.data.sortOrder is number) &&
         (!('targetAmount' in request.resource.data) || request.resource.data.targetAmount is number);
}

function canAccessDonationData(donationMemberId) {
  return isAdmin() || 
         (isAuthenticated() && request.auth.uid == donationMemberId);
}

function canAccessAggregateFinancialData() {
  return isAdminOrPastor();
}

function isValidDonationQuery() {
  // Ensure members can only query their own donations
  return isAdmin() || 
         (isAuthenticated() && 
          request.query != null && 
          request.query.where != null &&
          'memberId' in request.query.where &&
          request.query.where.memberId == request.auth.uid);
}
```

### Step 2: Add Donation Security Rules

Add donation collection rules to `firestore.rules`:

```javascript
// Donations collection - CRITICAL FINANCIAL DATA PROTECTION
match /donations/{donationId} {
  // Read access rules - STRICT MEMBER PRIVACY
  allow read: if isAuthenticated() && (
    // Members can ONLY read their own donations
    (resource.data.memberId == request.auth.uid) ||
    // Admins can read all donations
    isAdmin()
    // NOTE: Pastors CANNOT read individual donations
  );
  
  // Write access rules
  allow create: if isAuthenticated() && 
    isValidDonationData() &&
    (
      // Admin can create donations for any member
      isAdmin() ||
      // Members can create their own donations (self-reporting)
      (request.resource.data.memberId == request.auth.uid)
    ) &&
    // Ensure creator information is logged
    request.resource.data.createdBy == request.auth.uid;
    
  allow update: if isAuthenticated() && 
    isValidDonationData() &&
    (
      // Admins can update any donation
      isAdmin() ||
      // Members can only update their own donations within time limit
      (resource.data.memberId == request.auth.uid && 
       request.resource.data.memberId == request.auth.uid &&
       // Allow updates only within 24 hours of creation
       (request.time.toMillis() - resource.data.createdAt.toMillis()) < 86400000)
    ) &&
    // Preserve critical audit fields
    request.resource.data.createdBy == resource.data.createdBy &&
    request.resource.data.createdAt == resource.data.createdAt;
    
  allow delete: if isAdmin(); // Only admins can delete donations
}

// Donation Categories collection
match /donation-categories/{categoryId} {
  // Read access - anyone authenticated can read categories
  allow read: if isAuthenticated();
  
  // Write access - only admin/pastor can modify categories
  allow create: if isAdminOrPastor() && 
    isValidDonationCategoryData() &&
    request.resource.data.createdBy == request.auth.uid;
    
  allow update: if isAdminOrPastor() && 
    isValidDonationCategoryData() &&
    // Preserve original creator
    request.resource.data.createdBy == resource.data.createdBy;
    
  allow delete: if isAdmin(); // Only admins can delete categories
}
```

### Step 3: Add Donation Summary Collection Rules

Add rules for aggregated financial reports (pastor-accessible):

```javascript
// Donation Summary collection - Aggregated data for pastors
match /donation-summaries/{summaryId} {
  // Read access for aggregated financial data
  allow read: if isAdminOrPastor();
  
  // Write access - only system-generated summaries
  allow create, update: if isAdmin() &&
    request.resource.data.keys().hasAll(['period', 'totalAmount', 'donorCount', 'categoryBreakdown']) &&
    request.resource.data.totalAmount is number &&
    request.resource.data.donorCount is number &&
    request.resource.data.categoryBreakdown is map &&
    // Ensure no individual donor information
    !('donorDetails' in request.resource.data) &&
    !('individualDonations' in request.resource.data);
    
  allow delete: if isAdmin();
}
```

### Step 4: Add Collection Group Rules

Add rules for collection group queries across donations:

```javascript
// Collection group for donation queries - STRICT ACCESS CONTROL
match /{path=**}/donations/{donationId} {
  allow read: if isAuthenticated() && (
    // Members can only read their own donations
    resource.data.memberId == request.auth.uid ||
    // Admins can read all donations
    isAdmin()
    // Pastors CANNOT use collection group queries for individual donations
  );
}

// Collection group for donation summaries
match /{path=**}/donation-summaries/{summaryId} {
  allow read: if isAdminOrPastor();
}
```

### Step 5: Add Audit Logging Rules

Add audit logging for financial data access:

```javascript
// Financial Audit Log collection - Track all financial data access
match /financial-audit-log/{auditId} {
  // Only admins can read audit logs
  allow read: if isAdmin();
  
  // System creates audit entries automatically
  allow create: if isAuthenticated() &&
    request.resource.data.keys().hasAll(['userId', 'action', 'resourceType', 'resourceId', 'timestamp']) &&
    request.resource.data.userId == request.auth.uid &&
    request.resource.data.action in ['read', 'create', 'update', 'delete'] &&
    request.resource.data.resourceType in ['donation', 'donation-category', 'donation-summary'] &&
    request.resource.data.timestamp is timestamp;
    
  // Audit logs are immutable
  allow update, delete: if false;
}
```

### Step 6: Update Query Security

Ensure query-level security for donations:

```javascript
// Add to existing helper functions

function isValidDonationListQuery() {
  // For donation list queries, ensure proper member filtering
  return isAdmin() || 
         (isAuthenticated() && 
          // Members must filter by their own memberId
          request.query.where.memberId == request.auth.uid);
}

function canAccessFinancialReports() {
  // Only admin/pastor can access financial reporting
  return isAdminOrPastor();
}

function isValidDateRangeQuery() {
  // Validate date range queries don't exceed reasonable limits
  return request.query != null &&
         request.query.where != null &&
         'date' in request.query.where &&
         // Limit query range to prevent excessive data access
         request.query.limit <= 1000;
}
```

### Step 7: Add Donation Pledge Rules (Optional)

Add rules for donation pledges if implemented:

```javascript
// Donation Pledges collection (if implemented)
match /donation-pledges/{pledgeId} {
  // Members can read their own pledges, admin/pastor can read all
  allow read: if isAuthenticated() && (
    resource.data.memberId == request.auth.uid ||
    isAdminOrPastor()
  );
  
  // Admin/pastor can create pledges, members can create their own
  allow create: if isAuthenticated() &&
    isValidPledgeData() &&
    (isAdminOrPastor() || 
     request.resource.data.memberId == request.auth.uid);
    
  // Admin/pastor can update any, members can update their own
  allow update: if isAuthenticated() &&
    isValidPledgeData() &&
    (isAdminOrPastor() || 
     (resource.data.memberId == request.auth.uid &&
      request.resource.data.memberId == request.auth.uid));
      
  allow delete: if isAdminOrPastor();
}
```

### Step 8: Deploy and Validate Rules

1. **Deploy rules to Firebase**: `firebase deploy --only firestore:rules`
2. **Test with Firebase emulator** if available
3. **Validate with different user roles**:
   - Member: Can only see own donations
   - Pastor: Can access summaries but not individual donations
   - Admin: Full access to all financial data
4. **Verify collection group queries** work correctly
5. **Test audit logging** functionality

## Success Criteria

**Financial Data Security:**
- [ ] Members can ONLY read their own donations (memberId filtering enforced)
- [ ] Pastors CANNOT access individual donation details
- [ ] Pastors CAN access aggregated donation summaries
- [ ] Admins have full read/write access to all financial data
- [ ] Donation categories are readable by all, writable by admin/pastor only

**Data Integrity:**
- [ ] Donation data validation prevents invalid amounts or methods
- [ ] Category data validation ensures proper structure
- [ ] Required fields enforced correctly
- [ ] Enum values validated properly

**Audit & Compliance:**
- [ ] All financial data access is logged in audit trail
- [ ] Audit logs are immutable and admin-only readable
- [ ] Donation update time limits enforced (24-hour window)
- [ ] Creator information preserved in audit fields

**Query Security:**
- [ ] Collection group queries respect member privacy
- [ ] Date range queries have reasonable limits
- [ ] Member queries automatically filtered by memberId
- [ ] Financial report access restricted to admin/pastor

**Performance:**
- [ ] Rules don't cause excessive Firestore reads
- [ ] Query limits prevent data over-access
- [ ] Security checks are optimized for financial data

## Files Created/Modified

**Modified Files:**
- `firestore.rules` (add donations, donation-categories, donation-summaries, audit-log rules)

## Next Task

After completion, proceed to **PRP-2C-005: Donation Form Component** which will implement the UI for recording and managing donations using these secured data structures.

## Notes

**Critical Security Considerations:**
- **Financial Privacy**: Strictest possible member data access (own donations only)
- **Pastoral Access**: Summary data only, no individual donation amounts
- **Admin Control**: Full financial oversight with audit trail
- **Time Limits**: Member donation updates limited to 24-hour window
- **Audit Trail**: Comprehensive logging of all financial data access
- **Data Validation**: Strict validation prevents invalid financial data
- **Query Security**: Collection-level and query-level access control

**Implementation Priority:**
1. Financial data protection (highest priority)
2. Audit logging (essential for compliance)
3. Aggregate reporting for pastors (pastoral care access)
4. Data validation (prevent corruption)
5. Performance optimization (efficient queries)

This security model ensures that financial data remains private and secure while enabling necessary pastoral and administrative functions.