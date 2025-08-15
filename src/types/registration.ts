// ============================================================================
// REGISTRATION TYPES - QR SELF-REGISTRATION SYSTEM
// ============================================================================

// Registration Token - For generating QR codes
export interface RegistrationToken {
  id: string;
  token: string; // Unique, URL-safe token
  createdBy: string; // Admin/pastor member ID
  createdAt: string; // ISO string
  expiresAt?: string; // ISO string, optional
  maxUses: number; // -1 for unlimited
  currentUses: number;
  isActive: boolean;
  metadata: {
    purpose: string; // e.g., "Sunday Service", "Youth Event"
    notes?: string;
    eventDate?: string; // ISO string
    location?: string;
  };
}

// Pending Registration - Submitted by visitors
export interface PendingRegistration {
  id: string;
  tokenId: string; // Reference to registration_tokens
  
  // Personal Information
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthdate?: string; // ISO string
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
  submittedAt: string; // ISO string
  ipAddress?: string;
  userAgent?: string;
  
  // Approval Status
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // Admin/pastor member ID
  approvedAt?: string; // ISO string
  rejectionReason?: string;
  memberId?: string; // Reference to created member if approved
}

// Form data for the registration form
export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: 'Male' | 'Female' | '';
  memberStatus: 'member' | 'visitor';
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// Token validation result
export interface TokenValidationResult {
  isValid: boolean;
  token?: RegistrationToken;
  error?: string;
}

// Registration submission result
export interface RegistrationSubmissionResult {
  success: boolean;
  registrationId?: string;
  message: string;
  error?: string;
}

// Registration statistics
export interface RegistrationStats {
  totalTokens: number;
  activeTokens: number;
  totalRegistrations: number;
  pendingApprovals: number;
  approvedRegistrations: number;
  rejectedRegistrations: number;
  registrationsByToken: {
    tokenId: string;
    purpose: string;
    registrationCount: number;
  }[];
}