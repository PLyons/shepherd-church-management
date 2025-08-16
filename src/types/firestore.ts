import { Timestamp, DocumentSnapshot } from 'firebase/firestore';

// ============================================================================
// FIRESTORE TYPE DEFINITIONS
// ============================================================================
// These types correspond to the Firestore document structure
// as defined in /docs/firebase/firestore-schema-design.md

// ============================================================================
// MEMBER TYPES
// ============================================================================

export interface MemberDocument {
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

// Client-side representation with string dates for compatibility
export interface Member {
  id: string; // Firebase Auth UID
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthdate?: string; // ISO string
  gender?: 'Male' | 'Female';
  role: 'admin' | 'pastor' | 'member';
  memberStatus: 'active' | 'inactive' | 'visitor';
  joinedAt?: string; // ISO string
  householdId: string;
  isPrimaryContact: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  householdName?: string;
  fullName: string;

  // Optional populated data
  household?: Household;
}

// ============================================================================
// HOUSEHOLD TYPES
// ============================================================================

export interface AddressData {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface HouseholdDocument {
  // Basic Information
  familyName: string;

  // Standardization fields
  normalizedName?: string; // Lowercase, trimmed version for uniqueness checks
  status?: 'pending' | 'approved'; // Admin approval status
  createdBy?: string; // UID of the member who created this household

  // Address Information
  address: AddressData;

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

export interface Household {
  id: string;
  familyName: string;
  address: AddressData;
  primaryContactId?: string;
  primaryContactName?: string;
  memberIds: string[];
  memberCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Optional populated data
  members?: Member[];
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface RSVPStats {
  yes: number;
  no: number;
  maybe: number;
  total: number;
}

export interface EventDocument {
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
  rsvpStats: RSVPStats;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  rsvpStats: RSVPStats;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Event RSVP Subcollection
export interface EventRSVPDocument {
  memberId: string;
  memberName: string; // Denormalized
  response: 'yes' | 'no' | 'maybe';
  respondedAt: Timestamp;
  note?: string;
}

export interface EventRSVP {
  id: string; // memberId
  memberId: string;
  memberName: string;
  response: 'yes' | 'no' | 'maybe';
  respondedAt: string; // ISO string
  note?: string;
}

// Event Attendance Subcollection
export interface EventAttendanceDocument {
  memberId: string;
  memberName: string; // Denormalized
  attended: boolean;
  checkedInAt?: Timestamp;
  checkedInBy?: string; // Admin/Pastor member ID
}

export interface EventAttendance {
  id: string; // memberId
  memberId: string;
  memberName: string;
  attended: boolean;
  checkedInAt?: string; // ISO string
  checkedInBy?: string;
}

// ============================================================================
// DONATION TYPES
// ============================================================================

export interface DonationDocument {
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

export interface Donation {
  id: string;
  memberId?: string;
  memberName?: string;
  amount: number;
  donationDate: string; // ISO string
  method?: string;
  sourceLabel?: string;
  note?: string;
  categoryId: string;
  categoryName: string;
  createdAt: string; // ISO string
  createdBy: string;

  // Optional populated data
  member?: Member;
  category?: DonationCategory;
}

export interface DonationCategoryDocument {
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

export interface DonationCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  totalAmount: number;
  donationCount: number;
  lastDonationDate?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// ============================================================================
// SERMON TYPES
// ============================================================================

export interface ScriptureReference {
  book: string;
  chapter: number;
  verses: string;
}

export interface MediaFiles {
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // seconds
  fileSize?: number; // bytes
}

export interface SermonDocument {
  // Sermon Information
  title: string;
  speakerName: string;
  datePreached: Timestamp;
  notes?: string;

  // Scripture References
  scriptureReferences?: ScriptureReference[];

  // Media Files
  mediaFiles: MediaFiles;

  // Creator Information
  createdBy: string;
  createdByName: string; // Denormalized

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Search Optimization
  searchTerms: string[]; // Generated from title, speaker, scripture
}

export interface Sermon {
  id: string;
  title: string;
  speakerName: string;
  datePreached: string; // ISO string
  notes?: string;
  scriptureReferences?: ScriptureReference[];
  mediaFiles: MediaFiles;
  createdBy: string;
  createdByName: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  searchTerms: string[];
}

// ============================================================================
// VOLUNTEER TYPES
// ============================================================================

export interface VolunteerRoleDocument {
  name: string;
  description?: string;
  isActive: boolean;

  // Statistics
  totalSlots: number; // Computed
  filledSlots: number; // Computed

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VolunteerRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  totalSlots: number;
  filledSlots: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface VolunteerSlotDocument {
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

export interface VolunteerSlot {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartTime: string; // ISO string
  roleId: string;
  roleName: string;
  assignedTo?: string;
  assignedToName?: string;
  status: 'Open' | 'Filled' | 'Cancelled';
  note?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string

  // Optional populated data
  event?: Event;
  role?: VolunteerRole;
  assignedMember?: Member;
}

// ============================================================================
// REGISTRATION TYPES - QR SELF-REGISTRATION SYSTEM
// ============================================================================

export interface RegistrationTokenDocument {
  token: string; // Unique, URL-safe token
  createdBy: string; // Admin/pastor member ID
  createdAt: Timestamp;
  expiresAt?: Timestamp; // Optional expiration
  maxUses: number; // -1 for unlimited
  currentUses: number;
  isActive: boolean;
  metadata: {
    purpose: string; // e.g., "Sunday Service", "Youth Event"
    notes?: string;
    eventDate?: Timestamp;
    location?: string;
  };
}

export interface PendingRegistrationDocument {
  tokenId: string; // Reference to registration_tokens document ID
  
  // Personal Information
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthdate?: Timestamp;
  gender?: 'Male' | 'Female' | '';
  
  // Address Information
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  
  // Status
  memberStatus: 'member' | 'visitor';
  
  // Metadata
  submittedAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  
  // Approval Status
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // Admin/pastor member ID
  approvedAt?: Timestamp;
  rejectionReason?: string;
  memberId?: string; // Reference to created member if approved
}

// ============================================================================
// MEMBER EVENT TYPES
// ============================================================================

export interface MemberEventDocument {
  memberId: string;
  memberName: string; // Denormalized

  eventType: 'baptism' | 'marriage' | 'death' | 'membership' | 'other';
  eventDate: Timestamp;
  description?: string;
  notes?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MemberEvent {
  id: string;
  memberId: string;
  memberName: string;
  eventType: 'baptism' | 'marriage' | 'death' | 'membership' | 'other';
  eventDate: string; // ISO string
  description?: string;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string;

  // Optional populated data
  member?: Member;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Type for converting Firestore Timestamp to string
export type TimestampToString<T> = {
  [K in keyof T]: T[K] extends Timestamp ? string : T[K];
};

// Type for converting string to Firestore Timestamp
export type StringToTimestamp<T> = {
  [K in keyof T]: T[K] extends string ? Timestamp : T[K];
};

// Generic document converter types
export interface WithId<T> {
  id: string;
  data: T;
}

export interface QueryOptions {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: {
    field: string;
    operator:
      | '=='
      | '!='
      | '<'
      | '<='
      | '>'
      | '>='
      | 'in'
      | 'not-in'
      | 'array-contains'
      | 'array-contains-any';
    value: string | number | boolean | Timestamp | string[] | number[];
  }[];
  startAfter?: DocumentSnapshot;
}

// ============================================================================
// COLLECTION NAMES CONSTANTS
// ============================================================================

export const COLLECTIONS = {
  MEMBERS: 'members',
  HOUSEHOLDS: 'households',
  EVENTS: 'events',
  DONATIONS: 'donations',
  DONATION_CATEGORIES: 'donation-categories',
  SERMONS: 'sermons',
  VOLUNTEER_ROLES: 'volunteer-roles',
  VOLUNTEER_SLOTS: 'volunteer-slots',
  MEMBER_EVENTS: 'member-events',
} as const;

// Subcollection names
export const SUBCOLLECTIONS = {
  EVENT_RSVPS: 'rsvps',
  EVENT_ATTENDANCE: 'attendance',
} as const;

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}
