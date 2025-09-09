# PRP-2C-002: Donations Firebase Service

**Phase**: 2C Donations & Financial Management System  
**Task**: 2C.2  
**Priority**: HIGH - Core service layer for donation management  
**Estimated Time**: 4-5 hours  

## Purpose

Implement the DonationsService class extending BaseFirestoreService to provide complete CRUD operations and specialized query methods for donation management. This service will handle Firestore interactions, data conversion, role-based access control, and audit logging for financial data security. The service enforces strict role-based access where members only see their own donations, pastors see aggregate data, and admins see all financial records.

## Context Required

**Essential Files to Read:**
- `CLAUDE.md` - Service layer patterns and security requirements
- `src/services/firebase/base/base-firestore-service.ts` - BaseFirestoreService pattern
- `src/services/firebase/events.service.ts` - Recent service implementation example
- `src/utils/converters/donation-converters.ts` - Existing donation conversion functions
- `src/types/firestore.ts` - Donation and DonationCategory types
- `docs/prps/phase-2c-donations/PRP-2C-001-donation-data-model.md` - Type definitions (dependency)

**Key Patterns to Follow:**
- Extend BaseFirestoreService for consistency
- Use existing donation converters from utils/converters/donation-converters.ts
- Implement strict role-based access control for financial data
- Add audit logging for all donation data access
- Follow error handling patterns from existing services

## Requirements

**Dependencies:**
- **MUST complete PRP-2C-001 first** - requires Donation types and form data structures
- BaseFirestoreService implementation
- Firebase configuration
- Existing donation converters

**Critical Security Requirements:**
1. **Role-Based Access Control**: Members only see own donations, pastors see aggregates, admins see all
2. **Audit Logging**: Log all access to financial data with user/timestamp
3. **Data Sanitization**: Never expose sensitive financial data to unauthorized roles
4. **Input Validation**: Validate all donation amounts and dates
5. **Anonymous Donations**: Support anonymous donations (no member association)

**Service Architecture Requirements:**
1. **Service Architecture**: Extend BaseFirestoreService consistently
2. **Data Conversion**: Use existing donation converters from utils/converters/
3. **Query Methods**: Role-based, date-based, and category-based filtering
4. **Error Handling**: Comprehensive financial data error management
5. **Real-time Updates**: Support for Firestore listeners with proper security

## Detailed Procedure

### Step 1: Create Donations Service Foundation

Create `src/services/firebase/donations.service.ts`:

```typescript
import { 
  Timestamp,
  QueryOrderByConstraint,
  orderBy,
  where,
  WhereFilterOp
} from 'firebase/firestore';
import { BaseFirestoreService } from './base.service';
import { Donation, DonationDocument, DonationCategory, Role } from '../../types';
import { 
  donationToDonationDocument,
  donationDocumentToDonation,
} from '../../utils/converters/donation-converters';

export interface DonationFormData {
  memberId?: string;
  memberName?: string;
  amount: number;
  donationDate: string; // ISO string
  method?: string;
  sourceLabel?: string;
  note?: string;
  categoryId: string;
  categoryName: string;
}

export interface DonationAuditLog {
  action: 'view' | 'create' | 'update' | 'delete';
  donationId?: string;
  accessedBy: string;
  userRole: Role;
  timestamp: Date;
  details?: string;
}

export class DonationsService extends BaseFirestoreService<Donation, DonationFormData> {
  private auditLogs: DonationAuditLog[] = [];

  constructor() {
    super(
      'donations',
      (client: Donation) => donationToDonationDocument(client),
      (doc: any, id: string) => donationDocumentToDonation(id, doc)
    );
  }

  private logAudit(log: Omit<DonationAuditLog, 'timestamp'>) {
    this.auditLogs.push({
      ...log,
      timestamp: new Date(),
    });
  }
}
```

### Step 2: Implement Core CRUD Operations with Security

Add enhanced CRUD methods with role-based access:

```typescript
// Add to DonationsService class

async create(donationData: DonationFormData, createdBy: string, userRole: Role): Promise<Donation> {
  // Security check: Only admins and pastors can create donations
  if (userRole === 'member') {
    throw new Error('Unauthorized: Members cannot create donations');
  }

  const now = new Date();
  const donation: Donation = {
    id: '', // Will be set by Firestore
    ...donationData,
    donationDate: donationData.donationDate,
    amount: Math.round(donationData.amount * 100) / 100, // Round to 2 decimal places
    createdAt: now.toISOString(),
    createdBy,
  };

  this.logAudit({
    action: 'create',
    accessedBy: createdBy,
    userRole,
    details: `Created donation of $${donation.amount} for ${donation.memberName || 'Anonymous'}`,
  });

  return super.create(donation);
}

async update(
  id: string, 
  updates: Partial<DonationFormData>, 
  updatedBy: string, 
  userRole: Role
): Promise<void> {
  // Security check: Only admins and pastors can update donations
  if (userRole === 'member') {
    throw new Error('Unauthorized: Members cannot update donations');
  }

  const updateData: Partial<Donation> = {
    ...updates,
  };

  // Round amount if provided
  if (updates.amount !== undefined) {
    updateData.amount = Math.round(updates.amount * 100) / 100;
  }

  this.logAudit({
    action: 'update',
    donationId: id,
    accessedBy: updatedBy,
    userRole,
    details: `Updated donation ${id}`,
  });

  return super.update(id, updateData);
}

async delete(id: string, deletedBy: string, userRole: Role): Promise<void> {
  // Security check: Only admins can delete donations
  if (userRole !== 'admin') {
    throw new Error('Unauthorized: Only admins can delete donations');
  }

  this.logAudit({
    action: 'delete',
    donationId: id,
    accessedBy: deletedBy,
    userRole,
    details: `Deleted donation ${id}`,
  });

  return super.delete(id);
}
```

### Step 3: Implement Role-Based Access Methods

Add role-based filtering for secure data access:

```typescript
// Add to DonationsService class

async getDonationsForRole(userId: string, userRole: Role): Promise<Donation[]> {
  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Fetched donations with role: ${userRole}`,
  });

  switch (userRole) {
    case 'admin':
      // Admins see all donations
      return this.getAll();

    case 'pastor':
      // Pastors see all donations for pastoral care
      return this.getAll();

    case 'member':
      // Members only see their own donations
      return this.getDonationsByMember(userId);

    default:
      throw new Error('Invalid user role');
  }
}

async getDonationsByMember(memberId: string): Promise<Donation[]> {
  return this.getWhere([
    where('memberId', '==', memberId),
  ], [
    orderBy('donationDate', 'desc'),
  ]);
}

async getAnonymousDonations(userId: string, userRole: Role): Promise<Donation[]> {
  // Only admins and pastors can see anonymous donations
  if (userRole === 'member') {
    throw new Error('Unauthorized: Members cannot view anonymous donations');
  }

  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: 'Fetched anonymous donations',
  });

  return this.getWhere([
    where('memberId', '==', null),
  ], [
    orderBy('donationDate', 'desc'),
  ]);
}
```

### Step 4: Implement Date-Based and Category-Based Query Methods

Add time-based and category filtering methods:

```typescript
// Add to DonationsService class

async getDonationsByDateRange(
  startDate: Date,
  endDate: Date,
  userId: string,
  userRole: Role,
  memberId?: string
): Promise<Donation[]> {
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);

  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Fetched donations for date range: ${startDate.toISOString()} - ${endDate.toISOString()}`,
  });

  let whereConditions = [
    where('donationDate', '>=', startTimestamp),
    where('donationDate', '<=', endTimestamp),
  ];

  // Apply role-based filtering
  if (userRole === 'member') {
    whereConditions.push(where('memberId', '==', userId));
  } else if (memberId) {
    whereConditions.push(where('memberId', '==', memberId));
  }

  return this.getWhere(whereConditions, [
    orderBy('donationDate', 'desc'),
  ]);
}

async getDonationsByCategory(
  categoryId: string,
  userId: string,
  userRole: Role
): Promise<Donation[]> {
  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Fetched donations for category: ${categoryId}`,
  });

  let whereConditions = [
    where('categoryId', '==', categoryId),
  ];

  // Apply role-based filtering
  if (userRole === 'member') {
    whereConditions.push(where('memberId', '==', userId));
  }

  return this.getWhere(whereConditions, [
    orderBy('donationDate', 'desc'),
  ]);
}

async getDonationsByMethod(
  method: string,
  userId: string,
  userRole: Role
): Promise<Donation[]> {
  // Only admins and pastors can filter by method
  if (userRole === 'member') {
    throw new Error('Unauthorized: Members cannot filter donations by method');
  }

  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Fetched donations by method: ${method}`,
  });

  return this.getWhere([
    where('method', '==', method),
  ], [
    orderBy('donationDate', 'desc'),
  ]);
}

async getRecentDonations(
  limit: number = 50,
  userId: string,
  userRole: Role
): Promise<Donation[]> {
  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Fetched recent donations (limit: ${limit})`,
  });

  let whereConditions = [];

  // Apply role-based filtering
  if (userRole === 'member') {
    whereConditions.push(where('memberId', '==', userId));
  }

  return this.getWhere(whereConditions, [
    orderBy('donationDate', 'desc'),
  ], limit);
}
```

### Step 5: Implement Financial Analytics and Reporting Methods

Add analytics methods with role-based access:

```typescript
// Add to DonationsService class

async getDonationStatistics(
  userId: string,
  userRole: Role,
  memberId?: string
): Promise<{
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  donationCount: number;
  donationsByMethod: Record<string, { count: number; total: number }>;
  donationsByCategory: Record<string, { count: number; total: number }>;
  monthlyTotals: Record<string, number>;
}> {
  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Generated donation statistics${memberId ? ` for member: ${memberId}` : ''}`,
  });

  let donations: Donation[];

  if (userRole === 'member') {
    donations = await this.getDonationsByMember(userId);
  } else if (memberId) {
    donations = await this.getDonationsByMember(memberId);
  } else {
    donations = await this.getAll();
  }

  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const donationCount = donations.length;
  const averageDonation = donationCount > 0 ? totalAmount / donationCount : 0;

  // Group by method
  const donationsByMethod = donations.reduce((acc, donation) => {
    const method = donation.method || 'Unknown';
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count++;
    acc[method].total += donation.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by category
  const donationsByCategory = donations.reduce((acc, donation) => {
    const category = donation.categoryName || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { count: 0, total: 0 };
    }
    acc[category].count++;
    acc[category].total += donation.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  // Group by month
  const monthlyTotals = donations.reduce((acc, donation) => {
    const month = donation.donationDate.substring(0, 7); // YYYY-MM format
    acc[month] = (acc[month] || 0) + donation.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalDonations: donations.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    averageDonation: Math.round(averageDonation * 100) / 100,
    donationCount,
    donationsByMethod,
    donationsByCategory,
    monthlyTotals,
  };
}

async getYearlyDonationSummary(
  year: number,
  userId: string,
  userRole: Role,
  memberId?: string
): Promise<{
  year: number;
  totalAmount: number;
  donationCount: number;
  monthlyBreakdown: Array<{ month: number; amount: number; count: number }>;
}> {
  const startDate = new Date(year, 0, 1); // January 1st
  const endDate = new Date(year, 11, 31, 23, 59, 59); // December 31st

  const donations = await this.getDonationsByDateRange(startDate, endDate, userId, userRole, memberId);

  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const donationCount = donations.length;

  // Group by month
  const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthlyDonations = donations.filter(donation => {
      const donationDate = new Date(donation.donationDate);
      return donationDate.getFullYear() === year && donationDate.getMonth() === index;
    });

    return {
      month,
      amount: Math.round(monthlyDonations.reduce((sum, d) => sum + d.amount, 0) * 100) / 100,
      count: monthlyDonations.length,
    };
  });

  return {
    year,
    totalAmount: Math.round(totalAmount * 100) / 100,
    donationCount,
    monthlyBreakdown,
  };
}
```

### Step 6: Implement Search and Utility Methods

Add search functionality with security:

```typescript
// Add to DonationsService class

async searchDonations(
  query: string,
  userId: string,
  userRole: Role
): Promise<Donation[]> {
  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Searched donations: "${query}"`,
  });

  const donations = await this.getDonationsForRole(userId, userRole);
  const lowercaseQuery = query.toLowerCase();

  return donations.filter(donation => 
    donation.memberName?.toLowerCase().includes(lowercaseQuery) ||
    donation.categoryName.toLowerCase().includes(lowercaseQuery) ||
    donation.note?.toLowerCase().includes(lowercaseQuery) ||
    donation.amount.toString().includes(query)
  );
}

async getDonationsByCreator(
  creatorId: string,
  userId: string,
  userRole: Role
): Promise<Donation[]> {
  // Only admins and pastors can view donations by creator
  if (userRole === 'member') {
    throw new Error('Unauthorized: Members cannot view donations by creator');
  }

  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Fetched donations created by: ${creatorId}`,
  });

  return this.getWhere([
    where('createdBy', '==', creatorId),
  ], [
    orderBy('createdAt', 'desc'),
  ]);
}

async getLargeDonations(
  threshold: number,
  userId: string,
  userRole: Role
): Promise<Donation[]> {
  // Only admins and pastors can view large donations
  if (userRole === 'member') {
    throw new Error('Unauthorized: Members cannot view large donations');
  }

  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: `Fetched large donations above $${threshold}`,
  });

  const donations = await this.getAll();
  return donations.filter(donation => donation.amount >= threshold);
}

// Audit log management
getAuditLogs(userId: string, userRole: Role): DonationAuditLog[] {
  // Only admins can view audit logs
  if (userRole !== 'admin') {
    throw new Error('Unauthorized: Only admins can view audit logs');
  }

  this.logAudit({
    action: 'view',
    accessedBy: userId,
    userRole,
    details: 'Fetched donation audit logs',
  });

  return [...this.auditLogs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
```

### Step 7: Export Service Instance

Add at the bottom of the file:

```typescript
// Create and export service instance
export const donationsService = new DonationsService();
```

### Step 8: Update Service Index

Update `src/services/firebase/index.ts`:

```typescript
// Add to existing exports
export { donationsService, DonationsService } from './donations.service';
export type { DonationFormData, DonationAuditLog } from './donations.service';
```

### Step 9: Validation & Testing

1. Run TypeScript compilation: `npm run typecheck`
2. Test basic CRUD operations with different roles
3. Verify audit logging works correctly
4. Test role-based filtering logic
5. Verify financial calculations are accurate
6. Test security restrictions for each role

## Success Criteria

**Technical Validation:**
- [ ] TypeScript compiles without errors
- [ ] Service extends BaseFirestoreService correctly
- [ ] Uses existing donation converters properly
- [ ] All CRUD operations implemented with role checks
- [ ] Service exports correctly

**Security Validation:**
- [ ] Members can only access their own donations
- [ ] Pastors can access all donations for pastoral care
- [ ] Admins have full access to all financial data
- [ ] Audit logging captures all data access
- [ ] Unauthorized access attempts are blocked

**Functional Validation:**
- [ ] Financial calculations are accurate (rounded to 2 decimal places)
- [ ] Date-based queries return correct results
- [ ] Category and method filtering works properly
- [ ] Analytics and reporting functions correctly
- [ ] Search functionality operates securely

**Integration Readiness:**
- [ ] Service instance exported and available
- [ ] Compatible with existing service patterns
- [ ] Error handling follows project standards
- [ ] Ready for UI component integration

## Files Created/Modified

**New Files:**
- `src/services/firebase/donations.service.ts`

**Modified Files:**
- `src/services/firebase/index.ts` (add exports)

**Files Referenced (Not Modified):**
- `src/utils/converters/donation-converters.ts` (existing converters)
- `src/types/firestore.ts` (existing types)

## Next Task

After completion, proceed to **PRP-2C-003: Donation Categories Service** which will implement donation category management using this donations service as a foundation.

## Notes

- This service implements strict role-based access control for financial data security
- Audit logging tracks all access to donation data for compliance
- Uses existing donation converters to maintain consistency with current data patterns
- Financial amounts are always rounded to 2 decimal places for accuracy
- Anonymous donations are supported (memberId can be null/undefined)
- Search is implemented client-side for simplicity (can be enhanced with Firestore full-text search later)
- Analytics methods support dashboard and reporting features with proper role restrictions
- All date operations handle both ISO strings and Firestore Timestamps appropriately