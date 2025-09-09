# PRP-2C-001: Donation Data Model & Types

**Phase**: 2C Donation Management & Financial Reporting System  
**Task**: 2C.1  
**Priority**: CRITICAL - Foundation for all donation functionality  
**Status**: ✅ **COMPLETE** (January 9, 2025)  
**Implementation Time**: 2-3 hours (as estimated)  
**TDD Achievement**: 22 comprehensive test cases covering all interfaces, enums, and edge cases  

## Purpose

Establish enhanced TypeScript data model foundation for the Donation Management & Financial Reporting System. This includes enhancing existing donation types in `src/types/firestore.ts` with Form 990 compliance fields, validation interfaces, and comprehensive financial reporting capabilities that follow Shepherd's existing type patterns.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Project standards and type safety requirements
- `src/types/firestore.ts` - Existing Donation and DonationCategory interfaces
- `src/types/index.ts` - Existing Member and core type patterns
- `src/utils/firestore-converters.ts` - Type conversion patterns

**Key Patterns to Follow:**
- Strict TypeScript typing (NEVER use `any`)
- camelCase for all TypeScript interfaces
- Firestore Timestamp handling for dates
- Role-based access control fields
- Consistent ID field naming

## Requirements

**Dependencies:**
- Existing donation types in `src/types/firestore.ts`
- Must align with existing type architecture
- Member and household relationship patterns

**Critical Requirements:**
1. **Type Safety**: All interfaces must be strongly typed
2. **Form 990 Compliance**: Include fields required for IRS nonprofit reporting
3. **Role Integration**: Support admin/pastor/member role-based access
4. **Financial Reporting**: Enable comprehensive reporting capabilities
5. **Validation Support**: Include validation types for form handling

## Detailed Procedure

### Step 1: Create Enhanced Donation Types

Create `src/types/donations.ts` with comprehensive donation interfaces:

```typescript
import { Member, Household } from './index';

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
```

### Step 2: Define Supporting Types and Enums

Add comprehensive enums and supporting types:

```typescript
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

export type RestrictionType = 
  | 'unrestricted'
  | 'temporarily_restricted'
  | 'permanently_restricted'
  | 'program_restricted'
  | 'capital_campaign';
```

### Step 3: Create Enhanced Donation Category Interface

Define comprehensive DonationCategory interface:

```typescript
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
```

### Step 4: Create Financial Reporting Interfaces

Add comprehensive reporting interfaces:

```typescript
// ============================================================================
// FINANCIAL REPORTING TYPES
// ============================================================================

export interface FinancialSummary {
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  periodStart: string; // ISO string
  periodEnd: string; // ISO string
  
  // Breakdown by method
  byMethod: Record<DonationMethod, {
    amount: number;
    count: number;
    percentage: number;
  }>;
  
  // Breakdown by category
  byCategory: Record<string, {
    categoryName: string;
    amount: number;
    count: number;
    percentage: number;
    goalProgress?: number; // Percentage of annual goal
  }>;
  
  // Form 990 breakdown
  form990Breakdown: Record<Form990LineItem, {
    amount: number;
    count: number;
    percentage: number;
  }>;
  
  // Top donors (anonymized for privacy)
  topDonorRanges: {
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
```

### Step 5: Create Form Data Interfaces

Add form-specific interfaces for UI components:

```typescript
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
```

### Step 6: Create Validation Types

Add comprehensive validation interfaces:

```typescript
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
```

### Step 7: Update Type Exports

Update `src/types/index.ts` to export new types:

```typescript
// Add to existing exports
export * from './donations';
```

### Step 8: Create Migration Interface

Add interface for migrating existing donation data:

```typescript
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
```

### Step 9: Validation & Testing

1. Run TypeScript compilation: `npm run typecheck`
2. Verify no errors in type definitions
3. Test import/export chain works correctly
4. Validate Form 990 field mappings

## Success Criteria

**Technical Validation:**
- [ ] TypeScript compiles without errors
- [ ] All interfaces follow camelCase convention
- [ ] No use of `any` types
- [ ] Proper Date/Timestamp type usage for temporal fields
- [ ] Consistent ID field naming

**Architectural Validation:**
- [ ] Types support role-based access control
- [ ] Form 990 compliance fields included
- [ ] Financial reporting interfaces complete
- [ ] Tax receipt generation supported
- [ ] Donation validation system ready

**Integration Readiness:**
- [ ] Types exported correctly from `src/types/index.ts`
- [ ] Compatible with Firestore converter pattern
- [ ] Form data interfaces ready for React Hook Form
- [ ] Validation types ready for form validation
- [ ] Reporting interfaces ready for financial reports

## Files Created/Modified

**New Files:**
- `src/types/donations.ts`

**Modified Files:**
- `src/types/index.ts` (add exports)

## Next Task

After completion, proceed to **PRP-2C-002: Donations Firebase Service** which will implement the service layer using these enhanced type definitions.

## Notes

- This task enhances existing donation types with Form 990 compliance
- All Form 990 line items mapped to common church donation scenarios
- Validation types support comprehensive form validation
- Financial reporting interfaces enable detailed analytics
- Tax receipt generation supported with required fields
- Migration support for existing donation data