# Firestore Schema Design for Shepherd CMS

## Overview
This document defines the Firestore document structure for migrating from PostgreSQL to Firebase. The design optimizes for Firebase/Firestore best practices while maintaining data integrity and query efficiency.

## Migration Strategy

### PostgreSQL to Firestore Mapping
- **PostgreSQL Tables** → **Firestore Collections**
- **PostgreSQL Rows** → **Firestore Documents**
- **PostgreSQL Foreign Keys** → **Firestore Document References**
- **PostgreSQL UUIDs** → **Firestore Auto-generated IDs or custom strings**

### Key Design Decisions

1. **Authentication Integration**: Member documents use Firebase Auth UID as document ID
2. **Denormalization**: Strategic data duplication for query performance
3. **Subcollections**: Used for one-to-many relationships with heavy write loads
4. **References**: Used for many-to-one relationships
5. **Composite Indexes**: Required for complex queries

---

## Collection Structure

### 1. `/members/{uid}` Collection

Maps Firebase Auth users to member profiles using Auth UID as document ID.

```typescript
interface MemberDocument {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthdate?: Timestamp;
  gender?: 'Male' | 'Female';
  
  // Church Information
  role: 'admin' | 'pastor' | 'member';
  memberStatus: 'active' | 'inactive' | 'visitor';
  joinedAt?: Timestamp;
  
  // Household Relationship
  householdId: string; // Reference to household document ID
  isPrimaryContact: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Denormalized Data (for query optimization)
  householdName?: string; // From household.familyName
  fullName: string; // Computed: firstName + lastName
}
```

**Key Features:**
- Document ID matches Firebase Auth UID
- Denormalized household name for member directory queries
- Computed fullName field for search optimization

---

### 2. `/households/{householdId}` Collection

Stores family/household information with member relationships.

```typescript
interface HouseholdDocument {
  // Basic Information
  familyName: string;
  
  // Address Information
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  
  // Primary Contact
  primaryContactId?: string; // Reference to member document ID
  primaryContactName?: string; // Denormalized for display
  
  // Member Management
  memberIds: string[]; // Array of member document IDs
  memberCount: number; // Computed for statistics
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Key Features:**
- Member IDs array for efficient member listing
- Denormalized primary contact name
- Nested address object for better organization

---

### 3. `/events/{eventId}` Collection

Church events with RSVP and attendance tracking.

```typescript
interface EventDocument {
  // Event Information
  title: string;
  description?: string;
  location?: string;
  
  // Timing
  startTime: Timestamp;
  endTime?: Timestamp;
  
  // Visibility
  isPublic: boolean;
  
  // Creator Information
  createdBy: string; // Member document ID
  createdByName: string; // Denormalized for display
  
  // RSVP Statistics (denormalized for performance)
  rsvpStats: {
    yes: number;
    no: number;
    maybe: number;
    total: number;
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection: `/events/{eventId}/rsvps/{memberId}`**

```typescript
interface EventRSVPDocument {
  memberId: string;
  memberName: string; // Denormalized
  response: 'yes' | 'no' | 'maybe';
  respondedAt: Timestamp;
  note?: string;
}
```

**Subcollection: `/events/{eventId}/attendance/{memberId}`**

```typescript
interface EventAttendanceDocument {
  memberId: string;
  memberName: string; // Denormalized
  attended: boolean;
  checkedInAt?: Timestamp;
  checkedInBy?: string; // Admin/Pastor member ID
}
```

---

### 4. `/donations/{donationId}` Collection

Financial donation records with member attribution.

```typescript
interface DonationDocument {
  // Donor Information (nullable for anonymous)
  memberId?: string;
  memberName?: string; // Denormalized for reports
  
  // Donation Details
  amount: number;
  donationDate: Timestamp;
  method?: string; // 'cash', 'check', 'credit', 'bank-transfer'
  sourceLabel?: string;
  note?: string;
  
  // Category
  categoryId: string;
  categoryName: string; // Denormalized for reporting
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string; // Admin/Pastor member ID
}
```

---

### 5. `/donation-categories/{categoryId}` Collection

Categories for organizing donations.

```typescript
interface DonationCategoryDocument {
  name: string;
  description?: string;
  isActive: boolean;
  
  // Statistics (computed/updated via Cloud Functions)
  totalAmount: number;
  donationCount: number;
  lastDonationDate?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 6. `/sermons/{sermonId}` Collection

Sermon archive with media files.

```typescript
interface SermonDocument {
  // Sermon Information
  title: string;
  speakerName: string;
  datePreached: Timestamp;
  notes?: string;
  
  // Scripture References
  scriptureReferences?: {
    book: string;
    chapter: number;
    verses: string;
  }[];
  
  // Media Files
  mediaFiles: {
    audioUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number; // seconds
    fileSize?: number; // bytes
  };
  
  // Creator Information
  createdBy: string;
  createdByName: string; // Denormalized
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Search Optimization
  searchTerms: string[]; // Generated from title, speaker, scripture
}
```

---

### 7. `/volunteer-roles/{roleId}` Collection

Available volunteer positions.

```typescript
interface VolunteerRoleDocument {
  name: string;
  description?: string;
  isActive: boolean;
  
  // Statistics
  totalSlots: number; // Computed
  filledSlots: number; // Computed
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 8. `/volunteer-slots/{slotId}` Collection

Individual volunteer assignments for events.

```typescript
interface VolunteerSlotDocument {
  // Event Reference
  eventId: string;
  eventTitle: string; // Denormalized
  eventStartTime: Timestamp; // Denormalized
  
  // Role Reference
  roleId: string;
  roleName: string; // Denormalized
  
  // Assignment
  assignedTo?: string; // Member ID
  assignedToName?: string; // Denormalized
  status: 'Open' | 'Filled' | 'Cancelled';
  
  // Notes
  note?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 9. `/member-events/{eventId}` Collection

Individual member lifecycle events (baptism, marriage, etc.).

```typescript
interface MemberEventDocument {
  memberId: string;
  memberName: string; // Denormalized
  
  eventType: 'baptism' | 'marriage' | 'death' | 'membership' | 'other';
  eventDate: Timestamp;
  description?: string;
  notes?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Query Optimization Strategy

### 1. Composite Indexes Required

#### Member Queries
```javascript
// Member directory with filtering and sorting
members (firstName, lastName) // Name-based sorting
members (memberStatus, lastName) // Status filtering
members (householdId, lastName) // Household members
```

#### Event Queries
```javascript
// Event calendar and filtering
events (isPublic, startTime) // Public events chronologically
events (createdBy, startTime) // Events by creator
```

#### Donation Queries
```javascript
// Financial reporting
donations (donationDate, amount) // Date range reporting
donations (memberId, donationDate) // Member giving history
donations (categoryId, donationDate) // Category reporting
```

#### Volunteer Queries
```javascript
// Volunteer management
volunteer-slots (eventId, status) // Event volunteer needs
volunteer-slots (assignedTo, eventStartTime) // Member schedule
volunteer-slots (status, eventStartTime) // Available opportunities
```

### 2. Denormalization Strategy

**Benefits:**
- Faster read queries (no joins needed)
- Better performance for list views
- Reduced Firestore read costs

**Maintenance:**
- Use Cloud Functions triggers to maintain consistency
- Update denormalized data when source documents change
- Batch writes for related updates

---

## Security Rules Structure

### Collection-Level Security

```javascript
// Members: Users can read directory, edit own profile
match /members/{memberId} {
  allow read: if request.auth != null;
  allow write: if isOwner(memberId) || isAdminOrPastor();
}

// Households: Read access to all authenticated, write to admin/pastor
match /households/{householdId} {
  allow read: if request.auth != null;
  allow write: if isAdminOrPastor();
}

// Events: Public events readable by all, private by members only
match /events/{eventId} {
  allow read: if resource.data.isPublic || request.auth != null;
  allow write: if isAdminOrPastor();
}

// Donations: Admin/Pastor only
match /donations/{donationId} {
  allow read, write: if isAdminOrPastor();
}

// Sermons: Read by all, write by admin/pastor
match /sermons/{sermonId} {
  allow read: if true; // Public sermon archive
  allow write: if isAdminOrPastor();
}
```

---

## Migration Considerations

### 1. Data Transformation

**UUID to String Conversion:**
- PostgreSQL UUIDs become Firestore document IDs
- Auth-linked members use Firebase Auth UID
- Other entities use Firestore auto-generated IDs

**Date/Time Conversion:**
- PostgreSQL TIMESTAMP → Firestore Timestamp
- DATE fields → Firestore Timestamp (midnight)

**JSON/Array Fields:**
- Complex objects become nested Firestore objects
- Arrays preserved as Firestore arrays

### 2. Referential Integrity

**During Migration:**
- Maintain reference mapping between old UUIDs and new IDs
- Update all foreign key relationships
- Verify data consistency after migration

**Post-Migration:**
- Use Cloud Functions for maintaining relationships
- Implement transaction-based updates for critical operations
- Regular data integrity checks

### 3. Performance Optimization

**Batch Operations:**
- Use Firestore batch writes (500 doc limit)
- Implement batching for large datasets
- Parallel processing where possible

**Index Creation:**
- Create all composite indexes before migration
- Monitor index creation progress
- Test query performance post-migration

---

## Implementation Phases

### Phase 1: Core Collections
1. Members (with Auth integration)
2. Households
3. Basic member-household relationships

### Phase 2: Ministry Features
1. Events (with RSVP subcollections)
2. Sermons
3. Event attendance tracking

### Phase 3: Financial & Volunteer
1. Donation categories
2. Donations
3. Volunteer roles and slots

### Phase 4: Optimization
1. Denormalized data population
2. Search optimization
3. Performance tuning

---

## Success Metrics

**Data Integrity:**
- 100% data migration success
- All relationships maintained
- No orphaned references

**Performance:**
- Query response times < 2 seconds
- List views load < 3 seconds
- Form submissions complete < 1 second

**Functionality:**
- All existing features work identically
- Search performance improved
- Real-time updates functional

---

*This schema design enables the beta testing to proceed with full feature parity while leveraging Firestore's strengths for scalability and performance.*