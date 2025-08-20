// ============================================================================
// CORE TYPES - FIREBASE-BASED
// ============================================================================

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  birthDate?: Date | any;
  birthdate?: string; // Alternative format for compatibility
  anniversaryDate?: Date | any;
  maritalStatus?: 'single' | 'married' | 'widowed' | 'divorced';
  memberStatus: 'active' | 'inactive';
  role: 'admin' | 'pastor' | 'member';
  gender?: 'Male' | 'Female';
  joinedAt?: string;
  createdAt?: Date | any;
  updatedAt?: Date | any;
  fullName?: string;
}

export interface Household {
  id: string;
  familyName: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  createdAt?: Date | any; // Firestore Timestamp
  updatedAt?: Date | any; // Firestore Timestamp
}

export interface MemberEvent {
  id: string;
  member_id: string;
  event_type: 'baptism' | 'marriage' | 'death' | 'membership' | 'other';
  event_date: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalMembers?: number;
  activeMembers?: number;
  totalHouseholds?: number;
  upcomingEvents?: number;
  monthlyDonations?: number;
  totalDonations?: number;
  myDonationsThisYear?: number;
  myUpcomingCommitments?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity?: any[];
  upcomingEvents?: Event[];
  quickActions?: any[];
  personalInfo?: any;
}
