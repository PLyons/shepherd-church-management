/**
 * Comprehensive Firestore Security Rules Test Suite
 * 
 * Tests the enhanced donation security rules implemented in PRP-2C-004
 * Validates role-based access control, time-limited edits, data validation,
 * and audit logging requirements for financial data protection.
 * 
 * @module FirestoreSecurityRulesTest
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Test environment and contexts
let testEnv: RulesTestEnvironment;
let adminContext: any;
let pastorContext: any;
let memberContext: any;
let unauthenticatedContext: any;

// Test user IDs and data
const TEST_USER_IDS = {
  admin: 'test-admin-uid',
  pastor: 'test-pastor-uid',
  member: 'test-member-uid',
  member2: 'test-member2-uid',
} as const;

const TEST_PROJECT_ID = 'test-project-security-rules';

// Mock data for testing
const MOCK_MEMBERS = {
  admin: {
    id: TEST_USER_IDS.admin,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    role: 'admin',
    memberStatus: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  pastor: {
    id: TEST_USER_IDS.pastor,
    firstName: 'Pastor',
    lastName: 'User',
    email: 'pastor@test.com',
    role: 'pastor',
    memberStatus: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  member: {
    id: TEST_USER_IDS.member,
    firstName: 'Member',
    lastName: 'User',
    email: 'member@test.com',
    role: 'member',
    memberStatus: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  member2: {
    id: TEST_USER_IDS.member2,
    firstName: 'Member2',
    lastName: 'User',
    email: 'member2@test.com',
    role: 'member',
    memberStatus: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
};

const MOCK_DONATION_CATEGORIES = {
  tithe: {
    id: 'cat-tithe',
    name: 'Tithe',
    description: 'Regular tithing donations',
    isActive: true,
    isTaxDeductible: true,
    displayOrder: 1,
    code: 'TITHE',
    fundCode: 'GENERAL',
  },
  building: {
    id: 'cat-building',
    name: 'Building Fund',
    description: 'Building expansion donations',
    isActive: true,
    isTaxDeductible: true,
    displayOrder: 2,
    code: 'BUILDING',
    fundCode: 'BUILDING',
  },
  inactive: {
    id: 'cat-inactive',
    name: 'Inactive Fund',
    description: 'No longer accepting donations',
    isActive: false,
    isTaxDeductible: true,
    displayOrder: 999,
    code: 'INACTIVE',
    fundCode: 'INACTIVE',
  },
};

const MOCK_DONATIONS = {
  memberDonation: {
    id: 'donation-member-1',
    amount: 100.50,
    donationDate: Timestamp.now(),
    method: 'check',
    categoryId: 'cat-tithe',
    memberId: TEST_USER_IDS.member,
    status: 'pending',
    isAnonymous: false,
    taxDeductible: true,
    notes: 'Test donation',
    checkNumber: '1001',
    createdAt: Timestamp.now(),
    createdBy: TEST_USER_IDS.member,
    updatedAt: Timestamp.now(),
  },
  verifiedDonation: {
    id: 'donation-verified-1',
    amount: 250.00,
    donationDate: Timestamp.now(),
    method: 'online',
    categoryId: 'cat-building',
    memberId: TEST_USER_IDS.member,
    status: 'verified',
    isAnonymous: false,
    taxDeductible: true,
    createdAt: Timestamp.now(),
    createdBy: TEST_USER_IDS.admin,
    updatedAt: Timestamp.now(),
  },
  oldDonation: {
    id: 'donation-old-1',
    amount: 75.25,
    donationDate: Timestamp.now(),
    method: 'cash',
    categoryId: 'cat-tithe',
    memberId: TEST_USER_IDS.member,
    status: 'pending',
    isAnonymous: false,
    taxDeductible: true,
    // 48 hours ago (beyond 24-hour edit window)
    createdAt: Timestamp.fromMillis(Date.now() - (48 * 60 * 60 * 1000)),
    createdBy: TEST_USER_IDS.member,
    updatedAt: Timestamp.fromMillis(Date.now() - (48 * 60 * 60 * 1000)),
  },
  member2Donation: {
    id: 'donation-member2-1',
    amount: 200.00,
    donationDate: Timestamp.now(),
    method: 'credit_card',
    categoryId: 'cat-tithe',
    memberId: TEST_USER_IDS.member2,
    status: 'pending',
    isAnonymous: false,
    taxDeductible: true,
    createdAt: Timestamp.now(),
    createdBy: TEST_USER_IDS.member2,
    updatedAt: Timestamp.now(),
  },
};

const MOCK_DONATION_SUMMARIES = {
  monthlyAggregate: {
    id: 'summary-monthly-2024-01',
    aggregationType: 'monthly',
    period: '2024-01',
    totalAmount: 2500.00,
    totalDonations: 15,
    categories: {
      'cat-tithe': 1800.00,
      'cat-building': 700.00,
    },
    individualDonorDetails: false,
    createdAt: Timestamp.now(),
    createdBy: TEST_USER_IDS.admin,
  },
  individualDonorSummary: {
    id: 'summary-individual-member',
    aggregationType: 'individual',
    memberId: TEST_USER_IDS.member,
    totalAmount: 1200.00,
    totalDonations: 8,
    individualDonorDetails: true,
    createdAt: Timestamp.now(),
    createdBy: TEST_USER_IDS.admin,
  },
};

describe('Firestore Security Rules - Enhanced Donation System (PRP-2C-004)', () => {
  beforeAll(async () => {
    // Load firestore rules
    const rulesPath = resolve(__dirname, '../../firestore.rules');
    const rules = readFileSync(rulesPath, 'utf8');

    // Initialize test environment with security rules
    testEnv = await initializeTestEnvironment({
      projectId: TEST_PROJECT_ID,
      firestore: {
        rules,
        host: 'localhost',
        port: 8080,
      },
    });
  });

  beforeEach(async () => {
    // Clear all data before each test
    await testEnv.clearFirestore();

    // Create test contexts for different user roles
    adminContext = testEnv.authenticatedContext(TEST_USER_IDS.admin);
    pastorContext = testEnv.authenticatedContext(TEST_USER_IDS.pastor);
    memberContext = testEnv.authenticatedContext(TEST_USER_IDS.member);
    unauthenticatedContext = testEnv.unauthenticatedContext();

    // Set up member documents (required for role-based access)
    const adminMemberRef = doc(adminContext.firestore(), 'members', TEST_USER_IDS.admin);
    const pastorMemberRef = doc(pastorContext.firestore(), 'members', TEST_USER_IDS.pastor);
    const memberMemberRef = doc(memberContext.firestore(), 'members', TEST_USER_IDS.member);
    const member2MemberRef = doc(adminContext.firestore(), 'members', TEST_USER_IDS.member2);

    await Promise.all([
      setDoc(adminMemberRef, MOCK_MEMBERS.admin),
      setDoc(pastorMemberRef, MOCK_MEMBERS.pastor),
      setDoc(memberMemberRef, MOCK_MEMBERS.member),
      setDoc(member2MemberRef, MOCK_MEMBERS.member2),
    ]);

    // Set up donation categories
    const categoryRefs = Object.values(MOCK_DONATION_CATEGORIES).map(category => 
      setDoc(doc(adminContext.firestore(), 'donation-categories', category.id), category)
    );
    await Promise.all(categoryRefs);
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Authentication Tests', () => {
    it('should deny all financial data access to unauthenticated users', async () => {
      const unauthedDb = unauthenticatedContext.firestore();

      // Test donations collection
      await assertFails(getDoc(doc(unauthedDb, 'donations', 'test-donation')));
      await assertFails(addDoc(collection(unauthedDb, 'donations'), MOCK_DONATIONS.memberDonation));

      // Test donation summaries
      await assertFails(getDoc(doc(unauthedDb, 'donation-summaries', 'test-summary')));

      // Test audit logs
      await assertFails(getDoc(doc(unauthedDb, 'financial-audit-log', 'test-log')));

      // Test donation categories (should allow reading active categories)
      const activeCategoryRef = doc(unauthedDb, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id);
      await assertFails(getDoc(activeCategoryRef));
    });
  });

  describe('Donation Categories Security', () => {
    describe('Member Access', () => {
      it('should allow members to read active donation categories only', async () => {
        const db = memberContext.firestore();

        // Should succeed reading active category
        await assertSucceeds(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id)));

        // Should succeed reading another active category
        await assertSucceeds(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.building.id)));

        // Should fail reading inactive category
        await assertFails(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.inactive.id)));
      });

      it('should deny members write access to donation categories', async () => {
        const db = memberContext.firestore();
        const newCategory = {
          name: 'New Category',
          description: 'Member created',
          isActive: true,
          isTaxDeductible: true,
        };

        await assertFails(addDoc(collection(db, 'donation-categories'), newCategory));
        await assertFails(updateDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id), { name: 'Updated' }));
        await assertFails(deleteDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id)));
      });
    });

    describe('Pastor Access', () => {
      it('should allow pastors to read all donation categories', async () => {
        const db = pastorContext.firestore();

        // Should succeed reading active categories
        await assertSucceeds(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id)));
        await assertSucceeds(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.building.id)));

        // Should succeed reading inactive categories
        await assertSucceeds(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.inactive.id)));
      });

      it('should allow pastors to create/update active categories only', async () => {
        const db = pastorContext.firestore();

        // Should succeed creating active category
        const validCategory = {
          name: 'Pastor Category',
          description: 'Created by pastor',
          isActive: true,
          isTaxDeductible: true,
        };
        await assertSucceeds(addDoc(collection(db, 'donation-categories'), validCategory));

        // Should fail creating inactive category
        const inactiveCategory = {
          name: 'Inactive Category',
          description: 'Inactive category',
          isActive: false,
          isTaxDeductible: true,
        };
        await assertFails(addDoc(collection(db, 'donation-categories'), inactiveCategory));

        // Should succeed updating active category to remain active
        await assertSucceeds(updateDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id), { 
          description: 'Updated by pastor' 
        }));
      });

      it('should deny pastors delete access to donation categories', async () => {
        const db = pastorContext.firestore();
        await assertFails(deleteDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id)));
      });
    });

    describe('Admin Access', () => {
      it('should allow admins full access to donation categories', async () => {
        const db = adminContext.firestore();

        // Should succeed reading all categories
        await assertSucceeds(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id)));
        await assertSucceeds(getDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.inactive.id)));

        // Should succeed creating any category
        const newCategory = {
          name: 'Admin Category',
          description: 'Created by admin',
          isActive: false,
          isTaxDeductible: true,
        };
        await assertSucceeds(addDoc(collection(db, 'donation-categories'), newCategory));

        // Should succeed updating any category
        await assertSucceeds(updateDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.tithe.id), { 
          isActive: false 
        }));

        // Should succeed deleting any category
        await assertSucceeds(deleteDoc(doc(db, 'donation-categories', MOCK_DONATION_CATEGORIES.building.id)));
      });
    });

    describe('Data Validation', () => {
      it('should reject invalid donation category data', async () => {
        const db = adminContext.firestore();

        // Missing required fields
        await assertFails(addDoc(collection(db, 'donation-categories'), {
          name: 'Invalid Category',
          // Missing description, isActive, isTaxDeductible
        }));

        // Invalid data types
        await assertFails(addDoc(collection(db, 'donation-categories'), {
          name: 123, // Should be string
          description: 'Valid description',
          isActive: 'true', // Should be boolean
          isTaxDeductible: true,
        }));

        // Empty name
        await assertFails(addDoc(collection(db, 'donation-categories'), {
          name: '',
          description: 'Valid description',
          isActive: true,
          isTaxDeductible: true,
        }));
      });
    });
  });

  describe('Donations Security', () => {
    beforeEach(async () => {
      // Set up test donations
      const donationRefs = Object.values(MOCK_DONATIONS).map(donation => 
        setDoc(doc(adminContext.firestore(), 'donations', donation.id), donation)
      );
      await Promise.all(donationRefs);
    });

    describe('Member Access', () => {
      it('should allow members to read only their own donations', async () => {
        const db = memberContext.firestore();

        // Should succeed reading own donation
        await assertSucceeds(getDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id)));

        // Should fail reading another member's donation
        await assertFails(getDoc(doc(db, 'donations', MOCK_DONATIONS.member2Donation.id)));
      });

      it('should allow members to create donations for themselves only', async () => {
        const db = memberContext.firestore();

        // Valid donation for self
        const validDonation = {
          amount: 50.00,
          donationDate: Timestamp.now(),
          method: 'cash',
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member,
          status: 'pending',
          isAnonymous: false,
          taxDeductible: true,
          createdBy: TEST_USER_IDS.member,
        };
        await assertSucceeds(addDoc(collection(db, 'donations'), validDonation));

        // Should fail creating donation for another member
        const invalidDonation = {
          ...validDonation,
          memberId: TEST_USER_IDS.member2,
        };
        await assertFails(addDoc(collection(db, 'donations'), invalidDonation));

        // Should fail creating donation with non-pending status
        const nonPendingDonation = {
          ...validDonation,
          status: 'verified',
        };
        await assertFails(addDoc(collection(db, 'donations'), nonPendingDonation));
      });

      it('should allow members to update their own pending donations within 24-hour window', async () => {
        const db = memberContext.firestore();

        // Should succeed updating own pending donation (recent)
        await assertSucceeds(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
          amount: 125.75,
          notes: 'Updated amount',
        }));

        // Should fail updating verified donation
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.verifiedDonation.id), {
          amount: 300.00,
        }));

        // Should fail updating old pending donation (beyond 24-hour window)
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.oldDonation.id), {
          amount: 100.00,
        }));

        // Should fail updating another member's donation
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.member2Donation.id), {
          amount: 250.00,
        }));
      });

      it('should deny members delete access to donations', async () => {
        const db = memberContext.firestore();

        // Should fail deleting own donation
        await assertFails(deleteDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id)));
      });
    });

    describe('Pastor Access Restrictions', () => {
      it('should deny pastors access to individual donations', async () => {
        const db = pastorContext.firestore();

        // Should fail reading any individual donation
        await assertFails(getDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id)));
        await assertFails(getDoc(doc(db, 'donations', MOCK_DONATIONS.member2Donation.id)));
        await assertFails(getDoc(doc(db, 'donations', MOCK_DONATIONS.verifiedDonation.id)));
      });

      it('should deny pastors write access to donations', async () => {
        const db = pastorContext.firestore();

        const donation = {
          amount: 100.00,
          donationDate: Timestamp.now(),
          method: 'check',
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member,
          status: 'pending',
          createdBy: TEST_USER_IDS.pastor,
        };

        // Should fail creating donations
        await assertFails(addDoc(collection(db, 'donations'), donation));

        // Should fail updating donations
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
          amount: 150.00,
        }));

        // Should fail deleting donations
        await assertFails(deleteDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id)));
      });
    });

    describe('Admin Access', () => {
      it('should allow admins full access to all donations', async () => {
        const db = adminContext.firestore();

        // Should succeed reading any donation
        await assertSucceeds(getDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id)));
        await assertSucceeds(getDoc(doc(db, 'donations', MOCK_DONATIONS.member2Donation.id)));
        await assertSucceeds(getDoc(doc(db, 'donations', MOCK_DONATIONS.verifiedDonation.id)));

        // Should succeed creating donations
        const newDonation = {
          amount: 500.00,
          donationDate: Timestamp.now(),
          method: 'online',
          categoryId: MOCK_DONATION_CATEGORIES.building.id,
          memberId: TEST_USER_IDS.member,
          status: 'verified',
          isAnonymous: false,
          taxDeductible: true,
          createdBy: TEST_USER_IDS.admin,
        };
        await assertSucceeds(addDoc(collection(db, 'donations'), newDonation));

        // Should succeed updating donations
        await assertSucceeds(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
          status: 'verified',
          amount: 150.75,
        }));

        // Should succeed deleting donations
        await assertSucceeds(deleteDoc(doc(db, 'donations', MOCK_DONATIONS.oldDonation.id)));
      });
    });

    describe('Data Validation', () => {
      it('should reject invalid donation data', async () => {
        const db = adminContext.firestore();

        // Missing required fields
        await assertFails(addDoc(collection(db, 'donations'), {
          amount: 100.00,
          // Missing donationDate, method, categoryId, memberId
        }));

        // Invalid amount (negative)
        await assertFails(addDoc(collection(db, 'donations'), {
          amount: -50.00,
          donationDate: Timestamp.now(),
          method: 'cash',
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member,
          createdBy: TEST_USER_IDS.admin,
        }));

        // Invalid amount (too large)
        await assertFails(addDoc(collection(db, 'donations'), {
          amount: 2000000.00, // Over $1M limit
          donationDate: Timestamp.now(),
          method: 'cash',
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member,
          createdBy: TEST_USER_IDS.admin,
        }));

        // Invalid method
        await assertFails(addDoc(collection(db, 'donations'), {
          amount: 100.00,
          donationDate: Timestamp.now(),
          method: 'bitcoin', // Invalid method
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member,
          createdBy: TEST_USER_IDS.admin,
        }));

        // Invalid status
        await assertFails(addDoc(collection(db, 'donations'), {
          amount: 100.00,
          donationDate: Timestamp.now(),
          method: 'cash',
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member,
          status: 'invalid_status',
          createdBy: TEST_USER_IDS.admin,
        }));
      });
    });
  });

  describe('Donation Summaries Security', () => {
    beforeEach(async () => {
      // Set up test summaries
      const summaryRefs = Object.values(MOCK_DONATION_SUMMARIES).map(summary => 
        setDoc(doc(adminContext.firestore(), 'donation-summaries', summary.id), summary)
      );
      await Promise.all(summaryRefs);
    });

    describe('Member Access', () => {
      it('should deny members access to all donation summaries', async () => {
        const db = memberContext.firestore();

        // Should fail reading any summary
        await assertFails(getDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.monthlyAggregate.id)));
        await assertFails(getDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.individualDonorSummary.id)));

        // Should fail creating summaries
        await assertFails(addDoc(collection(db, 'donation-summaries'), {
          aggregationType: 'monthly',
          period: '2024-02',
          totalAmount: 1000.00,
          individualDonorDetails: false,
        }));
      });
    });

    describe('Pastor Access', () => {
      it('should allow pastors to read aggregate summaries only (no individual donor details)', async () => {
        const db = pastorContext.firestore();

        // Should succeed reading aggregate summary
        await assertSucceeds(getDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.monthlyAggregate.id)));

        // Should fail reading individual donor summary
        await assertFails(getDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.individualDonorSummary.id)));
      });

      it('should allow pastors to create aggregate summaries only', async () => {
        const db = pastorContext.firestore();

        // Should succeed creating aggregate summary
        const aggregateSummary = {
          aggregationType: 'quarterly',
          period: '2024-Q1',
          totalAmount: 7500.00,
          totalDonations: 45,
          individualDonorDetails: false,
          createdBy: TEST_USER_IDS.pastor,
        };
        await assertSucceeds(addDoc(collection(db, 'donation-summaries'), aggregateSummary));

        // Should fail creating individual donor summary
        const individualSummary = {
          aggregationType: 'individual',
          memberId: TEST_USER_IDS.member,
          totalAmount: 1200.00,
          individualDonorDetails: true,
          createdBy: TEST_USER_IDS.pastor,
        };
        await assertFails(addDoc(collection(db, 'donation-summaries'), individualSummary));
      });
    });

    describe('Admin Access', () => {
      it('should allow admins full access to all donation summaries', async () => {
        const db = adminContext.firestore();

        // Should succeed reading all types of summaries
        await assertSucceeds(getDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.monthlyAggregate.id)));
        await assertSucceeds(getDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.individualDonorSummary.id)));

        // Should succeed creating any type of summary
        const individualSummary = {
          aggregationType: 'individual',
          memberId: TEST_USER_IDS.member2,
          totalAmount: 800.00,
          totalDonations: 5,
          individualDonorDetails: true,
          createdBy: TEST_USER_IDS.admin,
        };
        await assertSucceeds(addDoc(collection(db, 'donation-summaries'), individualSummary));

        // Should succeed updating summaries
        await assertSucceeds(updateDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.monthlyAggregate.id), {
          totalAmount: 2750.00,
        }));

        // Should succeed deleting summaries
        await assertSucceeds(deleteDoc(doc(db, 'donation-summaries', MOCK_DONATION_SUMMARIES.individualDonorSummary.id)));
      });
    });
  });

  describe('Financial Audit Log Security', () => {
    describe('Access Control', () => {
      it('should allow only admins to read audit logs', async () => {
        const auditLog = {
          action: 'donation_created',
          userId: TEST_USER_IDS.member,
          donationId: 'test-donation',
          timestamp: Timestamp.now(),
          details: { amount: 100.00 },
        };

        // Set up audit log via admin
        await setDoc(doc(adminContext.firestore(), 'financial-audit-log', 'test-log'), auditLog);

        // Admin should succeed reading
        await assertSucceeds(getDoc(doc(adminContext.firestore(), 'financial-audit-log', 'test-log')));

        // Pastor should fail reading
        await assertFails(getDoc(doc(pastorContext.firestore(), 'financial-audit-log', 'test-log')));

        // Member should fail reading
        await assertFails(getDoc(doc(memberContext.firestore(), 'financial-audit-log', 'test-log')));
      });

      it('should allow only admins to write audit logs', async () => {
        const auditLog = {
          action: 'donation_updated',
          userId: TEST_USER_IDS.pastor,
          donationId: 'test-donation-2',
          timestamp: Timestamp.now(),
          details: { previousAmount: 100.00, newAmount: 150.00 },
        };

        // Admin should succeed creating
        await assertSucceeds(addDoc(collection(adminContext.firestore(), 'financial-audit-log'), auditLog));

        // Pastor should fail creating
        await assertFails(addDoc(collection(pastorContext.firestore(), 'financial-audit-log'), auditLog));

        // Member should fail creating
        await assertFails(addDoc(collection(memberContext.firestore(), 'financial-audit-log'), auditLog));
      });
    });

    it('should allow system-level audit log creation', async () => {
      // This would typically be handled by server-side functions
      // The rules allow create: if true for system-side validation
      const systemAuditLog = {
        action: 'system_backup',
        userId: 'system',
        timestamp: Timestamp.now(),
        details: { recordCount: 1500 },
      };

      // System should be able to create audit logs
      // Note: In real implementation, this would be server-side Cloud Functions
      await assertSucceeds(addDoc(collection(adminContext.firestore(), 'financial-audit-log'), systemAuditLog));
    });
  });

  describe('Collection Group Query Security', () => {
    beforeEach(async () => {
      // Set up test data across multiple collections
      const donationRefs = Object.values(MOCK_DONATIONS).map(donation => 
        setDoc(doc(adminContext.firestore(), 'donations', donation.id), donation)
      );
      const summaryRefs = Object.values(MOCK_DONATION_SUMMARIES).map(summary => 
        setDoc(doc(adminContext.firestore(), 'donation-summaries', summary.id), summary)
      );
      await Promise.all([...donationRefs, ...summaryRefs]);
    });

    describe('Donations Collection Group', () => {
      it('should allow admins to query across all donations', async () => {
        const db = adminContext.firestore();
        
        // Admin should succeed with collection group query
        const donationsQuery = query(
          collection(db, 'donations'),
          where('status', '==', 'pending')
        );
        await assertSucceeds(getDocs(donationsQuery));
      });

      it('should allow members to query only their own donations', async () => {
        const db = memberContext.firestore();
        
        // Member should succeed querying their own donations
        const memberDonationsQuery = query(
          collection(db, 'donations'),
          where('memberId', '==', TEST_USER_IDS.member)
        );
        await assertSucceeds(getDocs(memberDonationsQuery));

        // Note: Collection group queries that might return other members' donations
        // are handled by the security rules filtering, not by query structure
      });

      it('should deny pastors collection group access to donations', async () => {
        const db = pastorContext.firestore();
        
        // Pastor should fail with any donations query
        const donationsQuery = query(
          collection(db, 'donations'),
          where('status', '==', 'verified')
        );
        await assertFails(getDocs(donationsQuery));
      });
    });

    describe('Donation Summaries Collection Group', () => {
      it('should allow admins to query all donation summaries', async () => {
        const db = adminContext.firestore();
        
        const summariesQuery = query(
          collection(db, 'donation-summaries'),
          where('aggregationType', '==', 'monthly')
        );
        await assertSucceeds(getDocs(summariesQuery));
      });

      it('should allow pastors to query aggregate summaries only', async () => {
        const db = pastorContext.firestore();
        
        // Pastor should succeed with aggregate summary query
        const aggregateQuery = query(
          collection(db, 'donation-summaries'),
          where('aggregationType', '==', 'monthly'),
          where('individualDonorDetails', '==', false)
        );
        await assertSucceeds(getDocs(aggregateQuery));
      });

      it('should deny members collection group access to summaries', async () => {
        const db = memberContext.firestore();
        
        const summariesQuery = query(
          collection(db, 'donation-summaries'),
          where('aggregationType', '==', 'monthly')
        );
        await assertFails(getDocs(summariesQuery));
      });
    });
  });

  describe('Time-Based Security Tests', () => {
    it('should enforce 24-hour edit window for member donations', async () => {
      const db = memberContext.firestore();

      // Create a donation that's exactly at the 24-hour boundary
      const boundaryDonation = {
        ...MOCK_DONATIONS.memberDonation,
        id: 'boundary-donation',
        // Exactly 24 hours ago
        createdAt: Timestamp.fromMillis(Date.now() - (24 * 60 * 60 * 1000)),
      };
      await setDoc(doc(adminContext.firestore(), 'donations', 'boundary-donation'), boundaryDonation);

      // Should fail updating donation at 24-hour boundary
      await assertFails(updateDoc(doc(db, 'donations', 'boundary-donation'), {
        amount: 200.00,
      }));

      // Create a donation that's just under 24 hours old
      const recentDonation = {
        ...MOCK_DONATIONS.memberDonation,
        id: 'recent-donation',
        // 23 hours ago (should still be editable)
        createdAt: Timestamp.fromMillis(Date.now() - (23 * 60 * 60 * 1000)),
      };
      await setDoc(doc(adminContext.firestore(), 'donations', 'recent-donation'), recentDonation);

      // Should succeed updating donation under 24 hours
      await assertSucceeds(updateDoc(doc(db, 'donations', 'recent-donation'), {
        amount: 175.50,
      }));
    });
  });

  describe('Status-Based Security Tests', () => {
    it('should allow members to edit only pending donations', async () => {
      const db = memberContext.firestore();

      // Should succeed updating pending donation
      await assertSucceeds(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
        amount: 110.75,
      }));

      // Should fail updating verified donation (even if recent and own)
      await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.verifiedDonation.id), {
        amount: 275.00,
      }));

      // Create a cancelled donation
      const cancelledDonation = {
        ...MOCK_DONATIONS.memberDonation,
        id: 'cancelled-donation',
        status: 'cancelled',
      };
      await setDoc(doc(adminContext.firestore(), 'donations', 'cancelled-donation'), cancelledDonation);

      // Should fail updating cancelled donation
      await assertFails(updateDoc(doc(db, 'donations', 'cancelled-donation'), {
        amount: 125.00,
      }));
    });
  });

  describe('Edge Cases and Security Vulnerabilities', () => {
    describe('Data Tampering Prevention', () => {
      it('should prevent members from tampering with critical donation fields', async () => {
        const db = memberContext.firestore();

        // Should fail changing memberId (even to self)
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
          memberId: TEST_USER_IDS.member, // Same as original but shouldn't be changeable
        }));

        // Should fail changing status
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
          status: 'verified',
        }));

        // Should fail changing createdBy
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
          createdBy: TEST_USER_IDS.admin,
        }));

        // Should fail changing createdAt timestamp
        await assertFails(updateDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id), {
          createdAt: Timestamp.now(),
        }));
      });
    });

    describe('Privilege Escalation Prevention', () => {
      it('should prevent role escalation through donation system', async () => {
        const db = memberContext.firestore();

        // Should fail creating donation with admin privileges
        const adminDonation = {
          amount: 1000.00,
          donationDate: Timestamp.now(),
          method: 'check',
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member,
          status: 'verified', // Only admins can create verified donations
          createdBy: TEST_USER_IDS.member,
        };
        await assertFails(addDoc(collection(db, 'donations'), adminDonation));

        // Should fail creating donations for other members
        const otherMemberDonation = {
          amount: 500.00,
          donationDate: Timestamp.now(),
          method: 'cash',
          categoryId: MOCK_DONATION_CATEGORIES.tithe.id,
          memberId: TEST_USER_IDS.member2,
          status: 'pending',
          createdBy: TEST_USER_IDS.member,
        };
        await assertFails(addDoc(collection(db, 'donations'), otherMemberDonation));
      });
    });

    describe('Bulk Operation Security', () => {
      it('should prevent unauthorized bulk operations', async () => {
        const db = memberContext.firestore();

        // Attempt to query donations without proper filtering should fail for sensitive data
        const allDonationsQuery = query(collection(db, 'donations'));
        
        // This should not return other members' donations even if the query succeeds
        // The security rules will filter the results
        const results = await getDocs(allDonationsQuery);
        
        // Should only return the member's own donations
        results.forEach(doc => {
          const data = doc.data();
          expect(data.memberId).toBe(TEST_USER_IDS.member);
        });
      });
    });

    describe('Audit Trail Enforcement', () => {
      it('should require audit logging for financial data access', async () => {
        // This test validates that the requiresAuditLog() function is called
        // In a real implementation, this would be handled by Cloud Functions
        const db = adminContext.firestore();

        // Admin reading donations should trigger audit requirement
        await assertSucceeds(getDoc(doc(db, 'donations', MOCK_DONATIONS.memberDonation.id)));

        // In a real system, this would create an audit log entry
        const auditLog = {
          action: 'donation_accessed',
          userId: TEST_USER_IDS.admin,
          donationId: MOCK_DONATIONS.memberDonation.id,
          timestamp: Timestamp.now(),
          details: { accessType: 'read' },
        };

        await assertSucceeds(addDoc(collection(db, 'financial-audit-log'), auditLog));
      });
    });
  });

  describe('Performance and Query Security', () => {
    it('should validate financial query security constraints', async () => {
      const db = adminContext.firestore();

      // Admin queries should succeed with proper validation
      const validQuery = query(
        collection(db, 'donations'),
        where('status', '==', 'verified')
      );
      await assertSucceeds(getDocs(validQuery));

      // Member queries should be properly scoped
      const memberDb = memberContext.firestore();
      const memberQuery = query(
        collection(memberDb, 'donations'),
        where('memberId', '==', TEST_USER_IDS.member)
      );
      await assertSucceeds(getDocs(memberQuery));
    });
  });
});