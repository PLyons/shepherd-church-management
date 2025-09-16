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
  | 'stripe' // Added for Stripe payment processing
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

// ============================================================================
// PAYMENT PROCESSING TYPES (PRP-2C-008)
// ============================================================================

/**
 * Request structure for creating a Stripe payment intent
 */
export interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency: string;
  memberId: string;
  donationCategoryId: string;
  paymentMethodId: string;
  description?: string;
  receiptEmail?: string;
  confirmationMethod?: 'automatic' | 'manual';
  metadata?: Record<string, string>;
}

/**
 * Response structure from Stripe payment intent creation
 */
export interface PaymentIntentResponse {
  id: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  error?: {
    code: string;
    message: string;
    type: 'card_error' | 'api_error' | 'authentication_error' | 'idempotency_error' | 'invalid_request_error' | 'rate_limit_error';
  };
}

/**
 * Response structure for Stripe setup intent (for saving payment methods)
 */
export interface SetupIntentResponse {
  id: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret: string;
  paymentMethodId?: string;
  error?: {
    code: string;
    message: string;
    type: string;
  };
}

/**
 * Payment method information from Stripe
 */
export interface PaymentMethod {
  id: string;
  type: 'card' | 'us_bank_account';
  customerId: string;
  card?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  usBankAccount?: {
    bankName: string;
    accountType: 'checking' | 'savings';
    last4: string;
    routingNumber: string;
  };
}

/**
 * Recurring donation configuration
 */
export interface RecurringDonation {
  id: string;
  memberId: string;
  amount: number; // Amount in cents
  currency: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  paymentMethodId: string;
  categoryId: string;
  status: 'active' | 'paused' | 'cancelled';
  startDate: string; // ISO date string
  nextPaymentDate: string; // ISO date string
  endDate?: string; // Optional end date
  description?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Stripe configuration for the application
 */
export interface StripeConfig {
  publicKey: string;
  webhookSecret?: string;
  currency: string;
  minDonationAmount: number; // In cents
  maxDonationAmount: number; // In cents
  allowedCountries?: string[];
  enableApplePay?: boolean;
  enableGooglePay?: boolean;
}

// ============================================================================
// DONATION STATEMENTS & RECEIPTS TYPES (PRP-2C-009)
// ============================================================================

/**
 * Type unions for statement system
 */
export type StatementStatus = 
  | 'pending' 
  | 'generating' 
  | 'generated' 
  | 'sent' 
  | 'failed' 
  | 'cancelled';

export type StatementType = 
  | 'annual_tax_statement' 
  | 'quarterly_summary' 
  | 'monthly_summary' 
  | 'year_end_summary' 
  | 'custom_range';

export type StatementFormat = 
  | 'pdf' 
  | 'html' 
  | 'excel';

export type StatementDeliveryMethod = 
  | 'download' 
  | 'email' 
  | 'email_with_download';

/**
 * Comprehensive donation statement interface for tax reporting and member communications
 */
export interface DonationStatement {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  
  // Statement configuration
  statementType: StatementType;
  taxYear: number;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  
  // Donation data
  donationIds: string[];
  totalAmount: number;
  totalDeductibleAmount: number;
  donationCount: number;
  includesQuidProQuo: boolean;
  
  // Church information
  churchName: string;
  churchAddress: string;
  churchEIN: string;
  
  // Statement generation
  generatedAt: string; // ISO timestamp
  generatedBy: string; // Member ID who generated
  status: StatementStatus;
  format: StatementFormat;
  fileSize?: number; // File size in bytes
  downloadUrl?: string;
  
  // Delivery tracking
  deliveryMethod: StatementDeliveryMethod;
  sentAt?: string; // ISO timestamp
  downloadedAt?: string; // ISO timestamp
  
  // Administrative
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Individual donation receipt interface for immediate confirmation
 */
export interface DonationReceipt {
  id: string;
  donationId: string;
  memberId: string;
  memberName: string;
  receiptNumber: string;
  
  // Donation details
  donationAmount: number;
  deductibleAmount: number;
  donationDate: string; // ISO timestamp
  donationMethod: string;
  categoryName: string;
  
  // Tax deductibility information
  isQuidProQuo: boolean;
  quidProQuoValue?: number;
  quidProQuoDescription?: string;
  
  // Church information
  churchName: string;
  churchEIN: string;
  
  // Receipt generation
  generatedAt: string; // ISO timestamp
  status: StatementStatus;
  format: StatementFormat;
}

/**
 * Statement template interface for customizable statement generation
 */
export interface StatementTemplate {
  id: string;
  name: string;
  templateType: string;
  isDefault: boolean;
  isActive: boolean;
  
  // Header content configuration
  headerContent: {
    churchLogo?: string;
    churchName: string;
    churchEIN: string;
  };
  
  // Body content configuration
  bodyContent: {
    greeting: string;
    introText: string;
  };
  
  // Styling configuration
  styling: {
    primaryColor: string;
    fontFamily: string;
  };
  
  // Section inclusion configuration
  includeSections: {
    donationSummary: boolean;
    donationDetails: boolean;
    quidProQuoDetails: boolean;
  };
  
  version: string;
}

/**
 * Bulk statement generation job interface for batch processing
 */
export interface BulkStatementJob {
  id: string;
  jobName: string;
  jobType: string;
  taxYear?: number;
  templateId?: string;
  
  // Member targeting
  memberIds?: string[];
  totalMembers: number;
  processedMembers: number;
  successfulStatements: number;
  failedStatements: number;
  
  // Job configuration
  status: string;
  deliveryMethod: StatementDeliveryMethod;
  sendImmediately: boolean;
  notifyOnCompletion?: boolean;
}