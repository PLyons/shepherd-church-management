// src/types/donations.ts
// TypeScript type definitions for the comprehensive donation tracking and financial reporting system
// This file exists to define all donation-related types with Form 990 compliance and role-based financial data access
// RELEVANT FILES: src/services/firebase/donations.service.ts, src/services/firebase/donation-categories.service.ts, src/types/index.ts, src/utils/converters/donation-converters.ts

import { Member } from './index';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE DONATION TYPES
// ============================================================================

export interface Donation {
  // Core identification
  id: string;
  
  // Donor Information (nullable for anonymous)
  memberId?: string;
  memberName?: string; // Denormalized for reports
  
  // Basic donation details
  amount: number;
  donationDate: string; // ISO string
  method: DonationMethod;
  sourceLabel?: string;
  note?: string;
  
  // Category classification
  categoryId: string;
  categoryName: string; // Denormalized for reporting
  
  // Form 990 compliance fields
  form990Fields: Form990Fields;
  
  // Receipt and tracking
  receiptNumber?: string;
  isReceiptSent: boolean;
  receiptSentAt?: string; // ISO string
  
  // Tax information
  isTaxDeductible: boolean;
  taxYear: number;
  
  // Administrative
  createdAt: string; // ISO string
  createdBy: string; // Admin/Pastor member ID
  updatedAt: string; // ISO string
  updatedBy?: string;
  
  // Status and verification
  status: DonationStatus;
  verifiedBy?: string; // Admin member ID
  verifiedAt?: string; // ISO string
  
  // Optional populated data
  member?: Member;
  category?: DonationCategory;
}

export interface DonationDocument {
  // Donor Information (nullable for anonymous)
  memberId?: string;
  memberName?: string;
  
  // Basic donation details
  amount: number;
  donationDate: Timestamp;
  method: DonationMethod;
  sourceLabel?: string;
  note?: string;
  
  // Category classification
  categoryId: string;
  categoryName: string;
  
  // Form 990 compliance fields
  form990Fields: Form990FieldsDocument;
  
  // Receipt and tracking
  receiptNumber?: string;
  isReceiptSent: boolean;
  receiptSentAt?: Timestamp;
  
  // Tax information
  isTaxDeductible: boolean;
  taxYear: number;
  
  // Administrative
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy?: string;
  
  // Status and verification
  status: DonationStatus;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
}

export type DonationMethod = 
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'online'
  | 'stock'
  | 'cryptocurrency'
  | 'in_kind'
  | 'other';

export type DonationStatus = 
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'refunded';

export type Form990LineItem = 
  | '1a_cash_contributions'
  | '1b_noncash_contributions'
  | '1c_contributions_reported_990'
  | '1d_related_organizations'
  | '1e_government_grants'
  | '1f_other_contributions'
  | '2_program_service_revenue'
  | '3_investment_income'
  | '4_other_revenue'
  | 'not_applicable';

export type RestrictionType = 
  | 'unrestricted'
  | 'temporarily_restricted'
  | 'permanently_restricted'
  | 'program_restricted'
  | 'capital_campaign';

export interface Form990Fields {
  lineItem: Form990LineItem;
  isQuidProQuo: boolean; // Quid pro quo contribution
  quidProQuoValue?: number;
  isAnonymous: boolean;
  restrictionType?: RestrictionType;
  restrictionDescription?: string;
  fairMarketValue?: number; // For non-cash donations
  donorProvidedValue?: number; // For non-cash donations
}

export interface Form990FieldsDocument {
  lineItem: Form990LineItem;
  isQuidProQuo: boolean;
  quidProQuoValue?: number;
  isAnonymous: boolean;
  restrictionType?: RestrictionType;
  restrictionDescription?: string;
  fairMarketValue?: number;
  donorProvidedValue?: number;
}

export interface DonationCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  
  // Form 990 classification
  defaultForm990LineItem: Form990LineItem;
  isTaxDeductible: boolean;
  
  // Budget and planning
  annualGoal?: number;
  currentYearTotal: number;
  lastYearTotal: number;
  
  // Statistics (computed/updated via Cloud Functions)
  totalAmount: number;
  donationCount: number;
  lastDonationDate?: string; // ISO string
  averageDonation: number;
  
  // Reporting configuration
  includeInReports: boolean;
  reportingCategory?: string;
  displayOrder: number;
  
  // Administrative
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdBy: string;
}

export interface DonationCategoryDocument {
  name: string;
  description?: string;
  isActive: boolean;
  
  // Form 990 classification
  defaultForm990LineItem: Form990LineItem;
  isTaxDeductible: boolean;
  
  // Budget and planning
  annualGoal?: number;
  currentYearTotal: number;
  lastYearTotal: number;
  
  // Statistics
  totalAmount: number;
  donationCount: number;
  lastDonationDate?: Timestamp;
  averageDonation: number;
  
  // Reporting configuration
  includeInReports: boolean;
  reportingCategory?: string;
  displayOrder: number;
  
  // Administrative
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ============================================================================
// FINANCIAL REPORTING TYPES
// ============================================================================

export interface FinancialSummary {
  totalDonations: number;
  totalTaxDeductible: number;
  donationCount: number;
  averageDonation: number;
  periodStart?: string; // ISO string
  periodEnd?: string; // ISO string
  
  // Breakdown by category (simplified for test compatibility)
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  
  // Breakdown by method (simplified for test compatibility)  
  methodBreakdown: {
    method: DonationMethod;
    amount: number;
    percentage: number;
  }[];
  
  // Monthly trends for charts
  monthlyTrends: {
    month: string; // YYYY-MM format
    amount: number;
  }[];
  
  // Legacy breakdown by method (for backwards compatibility)
  byMethod?: Record<DonationMethod, {
    amount: number;
    count: number;
    percentage: number;
  }>;
  
  // Legacy breakdown by category (for backwards compatibility)
  byCategory?: Record<string, {
    categoryName: string;
    amount: number;
    count: number;
    percentage: number;
    goalProgress?: number; // Percentage of annual goal
  }>;
  
  // Form 990 breakdown
  form990Breakdown?: Record<Form990LineItem, {
    amount: number;
    count: number;
    percentage: number;
  }>;
  
  // Top donors (anonymized for privacy)
  topDonorRanges?: {
    range: string; // e.g., "$1000-$2499"
    count: number;
    totalAmount: number;
  }[];
}

export interface TaxReceiptData {
  donationId: string;
  receiptNumber: string;
  donorName: string;
  donorAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  
  amount: number;
  donationDate: string;
  method: DonationMethod;
  category: string;
  
  // Tax information
  isTaxDeductible: boolean;
  taxYear: number;
  
  // Quid pro quo information
  isQuidProQuo: boolean;
  quidProQuoValue?: number;
  deductibleAmount: number;
  
  // Church information
  churchName: string;
  churchAddress: string;
  churchEIN: string;
  
  generatedAt: string; // ISO string
  generatedBy: string; // Member ID
}

export interface DonationReportFilters {
  startDate?: string;
  endDate?: string;
  memberId?: string;
  categoryIds?: string[];
  methods?: DonationMethod[];
  status?: DonationStatus[];
  minAmount?: number;
  maxAmount?: number;
  form990LineItems?: Form990LineItem[];
  includeAnonymous?: boolean;
}

// ============================================================================
// FORM DATA INTERFACES
// ============================================================================

export interface DonationFormData {
  memberId?: string;
  memberName?: string;
  amount: number;
  donationDate: string; // Date input format
  method: DonationMethod;
  sourceLabel?: string;
  note?: string;
  categoryId: string;
  checkNumber?: string;
  
  // Form 990 fields
  form990LineItem: Form990LineItem;
  isQuidProQuo: boolean;
  quidProQuoValue?: number;
  restrictionType?: RestrictionType;
  restrictionDescription?: string;
  fairMarketValue?: number;
  donorProvidedValue?: number;
  
  // Receipt options
  sendReceipt: boolean;
  receiptEmail?: string;
  
  // Tax information
  isTaxDeductible: boolean;
}

export interface DonationCategoryFormData {
  name: string;
  description?: string;
  defaultForm990LineItem: Form990LineItem;
  isTaxDeductible: boolean;
  annualGoal?: number;
  includeInReports: boolean;
  reportingCategory?: string;
  displayOrder: number;
}

export interface BulkDonationImportData {
  memberName?: string;
  memberId?: string;
  amount: number;
  donationDate: string;
  method: string;
  category: string;
  note?: string;
  receiptNumber?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface DonationValidationRules {
  amount: {
    min: number;
    max: number;
    required: true;
  };
  donationDate: {
    required: true;
    maxDate?: string; // Cannot be future date
    minDate?: string; // Cannot be too far in past
  };
  method: {
    required: true;
    allowedMethods: DonationMethod[];
  };
  categoryId: {
    required: true;
  };
  form990Fields: {
    required: true;
  };
}

export interface DonationValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DonationValidationResult {
  isValid: boolean;
  errors: DonationValidationError[];
  warnings?: DonationValidationError[];
}

// ============================================================================
// FORM 990 REPORTING TYPES
// ============================================================================

export interface Form990Data {
  taxYear: number;
  organizationName: string;
  ein: string;
  totalRevenue: number;
  partVIII: Form990PartVIII;
  quidProQuoDisclosures: QuidProQuoDisclosure[];
  restrictedFunds: RestrictedFund[];
  contributions: {
    cash: number;
    nonCash: number;
    restricted: number;
    quidProQuo: number;
  };
  programServiceRevenue: number;
  investmentIncome: number;
  otherRevenue: number;
  lineItems: Form990LineItemDetail[];
}

export interface Form990PartVIII {
  '1a_cash_contributions': number;
  '1b_noncash_contributions': number;
  '1c_contributions_reported_990': number;
  '1d_related_organizations': number;
  '1e_government_grants': number;
  '1f_other_contributions': number;
  '2_program_service_revenue': number;
  '3_investment_income': number;
  '4_other_revenue': number;
  total_revenue: number;
}

export interface Form990LineItemDetail {
  line: string;
  description: string;
  amount: number;
  percentage: number;
}

export interface QuidProQuoDisclosure {
  donationId: string;
  totalAmount: number;
  quidProQuoValue: number;
  deductibleAmount: number;
  description: string;
}

export interface RestrictedFund {
  categoryName: string;
  amount: number;
  restrictionType: RestrictionType;
  description: string;
}

// ============================================================================
// MIGRATION TYPES
// ============================================================================

export interface DonationMigrationData {
  legacyId?: string;
  migrationSource: string;
  migrationDate: string;
  migrationNotes?: string;
  dataQualityScore: number; // 0-100
  requiresReview: boolean;
}

export interface EnhancedDonation extends Donation {
  migration?: DonationMigrationData;
}