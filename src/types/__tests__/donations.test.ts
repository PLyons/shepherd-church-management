import { describe, it, expect } from 'vitest';
import {
  // Core Types
  Donation,
  DonationDocument,
  DonationCategory,
  DonationCategoryDocument,
  
  // Enums and Type Unions
  DonationMethod,
  DonationStatus,
  Form990LineItem,
  RestrictionType,
  
  // Form 990 Fields
  Form990Fields,
  Form990FieldsDocument,
  
  // Reporting Types
  FinancialSummary,
  TaxReceiptData,
  DonationReportFilters,
  
  // Form Data Types
  DonationFormData,
  DonationCategoryFormData,
  BulkDonationImportData,
  
  // Validation Types
  DonationValidationRules,
  DonationValidationError,
  DonationValidationResult,
  
  // Migration Types
  DonationMigrationData,
  EnhancedDonation,
} from '../donations';

describe('Donation Types', () => {
  describe('Core Donation Interface', () => {
    it('should define Donation interface with all required fields', () => {
      const donation: Donation = {
        id: 'donation-123',
        memberId: 'member-456',
        memberName: 'John Smith',
        amount: 100.00,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'credit_card',
        sourceLabel: 'Online Portal',
        note: 'Monthly tithe',
        categoryId: 'category-789',
        categoryName: 'Tithes',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
          restrictionType: 'unrestricted',
        },
        receiptNumber: 'R-2025-001',
        isReceiptSent: true,
        receiptSentAt: '2025-01-15T10:05:00Z',
        isTaxDeductible: true,
        taxYear: 2025,
        createdAt: '2025-01-15T10:00:00Z',
        createdBy: 'admin-123',
        updatedAt: '2025-01-15T10:00:00Z',
        updatedBy: 'admin-123',
        status: 'verified',
        verifiedBy: 'admin-123',
        verifiedAt: '2025-01-15T10:01:00Z',
      };

      expect(donation.id).toBe('donation-123');
      expect(donation.amount).toBe(100.00);
      expect(donation.method).toBe('credit_card');
      expect(donation.status).toBe('verified');
      expect(donation.isTaxDeductible).toBe(true);
    });

    it('should support anonymous donations without member information', () => {
      const anonymousDonation: Donation = {
        id: 'donation-anonymous-123',
        amount: 50.00,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'cash',
        categoryId: 'category-789',
        categoryName: 'General Fund',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: true,
          restrictionType: 'unrestricted',
        },
        receiptNumber: 'R-2025-002',
        isReceiptSent: false,
        isTaxDeductible: true,
        taxYear: 2025,
        createdAt: '2025-01-15T10:00:00Z',
        createdBy: 'admin-123',
        updatedAt: '2025-01-15T10:00:00Z',
        status: 'verified',
      };

      expect(anonymousDonation.memberId).toBeUndefined();
      expect(anonymousDonation.memberName).toBeUndefined();
      expect(anonymousDonation.form990Fields.isAnonymous).toBe(true);
    });

    it('should support optional populated member and category data', () => {
      const donationWithPopulatedData: Donation = {
        id: 'donation-123',
        memberId: 'member-456',
        memberName: 'John Smith',
        amount: 100.00,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'credit_card',
        categoryId: 'category-789',
        categoryName: 'Tithes',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
          restrictionType: 'unrestricted',
        },
        receiptNumber: 'R-2025-001',
        isReceiptSent: true,
        isTaxDeductible: true,
        taxYear: 2025,
        createdAt: '2025-01-15T10:00:00Z',
        createdBy: 'admin-123',
        updatedAt: '2025-01-15T10:00:00Z',
        status: 'verified',
        member: {
          id: 'member-456',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          role: 'member',
          memberStatus: 'active',
          joinedDate: '2020-01-01',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
        },
        category: {
          id: 'category-789',
          name: 'Tithes',
          isActive: true,
          defaultForm990LineItem: '1a_cash_contributions',
          isTaxDeductible: true,
          currentYearTotal: 5000,
          lastYearTotal: 4500,
          totalAmount: 50000,
          donationCount: 120,
          averageDonation: 416.67,
          includeInReports: true,
          displayOrder: 1,
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2025-01-15T00:00:00Z',
          createdBy: 'admin-123',
        }
      };

      expect(donationWithPopulatedData.member).toBeDefined();
      expect(donationWithPopulatedData.member?.firstName).toBe('John');
      expect(donationWithPopulatedData.category).toBeDefined();
      expect(donationWithPopulatedData.category?.name).toBe('Tithes');
    });
  });

  describe('DonationMethod Type Union', () => {
    it('should support all valid donation methods', () => {
      const validMethods: DonationMethod[] = [
        'cash',
        'check',
        'credit_card',
        'debit_card',
        'bank_transfer',
        'online',
        'stock',
        'cryptocurrency',
        'in_kind',
        'other'
      ];

      validMethods.forEach(method => {
        const donation: Pick<Donation, 'method'> = { method };
        expect(donation.method).toBe(method);
      });
    });
  });

  describe('DonationStatus Type Union', () => {
    it('should support all valid donation statuses', () => {
      const validStatuses: DonationStatus[] = [
        'pending',
        'verified',
        'rejected',
        'refunded'
      ];

      validStatuses.forEach(status => {
        const donation: Pick<Donation, 'status'> = { status };
        expect(donation.status).toBe(status);
      });
    });
  });

  describe('Form990LineItem Type Union', () => {
    it('should support all IRS Form 990 line items', () => {
      const validLineItems: Form990LineItem[] = [
        '1a_cash_contributions',
        '1b_noncash_contributions',
        '1c_contributions_reported_990',
        '1d_related_organizations',
        '1e_government_grants',
        '1f_other_contributions',
        '2_program_service_revenue',
        '3_investment_income',
        '4_other_revenue',
        'not_applicable'
      ];

      validLineItems.forEach(lineItem => {
        const form990Fields: Form990Fields = {
          lineItem,
          isQuidProQuo: false,
          isAnonymous: false,
          restrictionType: 'unrestricted'
        };
        expect(form990Fields.lineItem).toBe(lineItem);
      });
    });
  });

  describe('RestrictionType Type Union', () => {
    it('should support all restriction types for donations', () => {
      const validRestrictions: RestrictionType[] = [
        'unrestricted',
        'temporarily_restricted',
        'permanently_restricted',
        'program_restricted',
        'capital_campaign'
      ];

      validRestrictions.forEach(restriction => {
        const form990Fields: Form990Fields = {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
          restrictionType: restriction
        };
        expect(form990Fields.restrictionType).toBe(restriction);
      });
    });
  });

  describe('Form990Fields Interface', () => {
    it('should define complete Form 990 compliance fields', () => {
      const form990Fields: Form990Fields = {
        lineItem: '1a_cash_contributions',
        isQuidProQuo: true,
        quidProQuoValue: 25.00,
        isAnonymous: false,
        restrictionType: 'temporarily_restricted',
        restrictionDescription: 'Building fund contribution',
        fairMarketValue: 500.00,
        donorProvidedValue: 480.00
      };

      expect(form990Fields.lineItem).toBe('1a_cash_contributions');
      expect(form990Fields.isQuidProQuo).toBe(true);
      expect(form990Fields.quidProQuoValue).toBe(25.00);
      expect(form990Fields.fairMarketValue).toBe(500.00);
      expect(form990Fields.restrictionDescription).toBe('Building fund contribution');
    });

    it('should handle minimal Form 990 fields for simple donations', () => {
      const minimalForm990Fields: Form990Fields = {
        lineItem: '1a_cash_contributions',
        isQuidProQuo: false,
        isAnonymous: false,
        restrictionType: 'unrestricted'
      };

      expect(minimalForm990Fields.quidProQuoValue).toBeUndefined();
      expect(minimalForm990Fields.fairMarketValue).toBeUndefined();
      expect(minimalForm990Fields.restrictionDescription).toBeUndefined();
    });
  });

  describe('DonationCategory Interface', () => {
    it('should define enhanced donation category with reporting features', () => {
      const category: DonationCategory = {
        id: 'category-123',
        name: 'Building Fund',
        description: 'Funds for church building maintenance and improvements',
        isActive: true,
        defaultForm990LineItem: '1a_cash_contributions',
        isTaxDeductible: true,
        annualGoal: 50000,
        currentYearTotal: 12500,
        lastYearTotal: 45000,
        totalAmount: 125000,
        donationCount: 85,
        lastDonationDate: '2025-01-15T10:00:00Z',
        averageDonation: 1470.59,
        includeInReports: true,
        reportingCategory: 'Capital Campaigns',
        displayOrder: 3,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'admin-123'
      };

      expect(category.name).toBe('Building Fund');
      expect(category.annualGoal).toBe(50000);
      expect(category.defaultForm990LineItem).toBe('1a_cash_contributions');
      expect(category.averageDonation).toBe(1470.59);
    });
  });

  describe('FinancialSummary Interface', () => {
    it('should define comprehensive financial summary with breakdowns', () => {
      const summary: FinancialSummary = {
        totalDonations: 125000,
        donationCount: 250,
        averageDonation: 500,
        periodStart: '2025-01-01T00:00:00Z',
        periodEnd: '2025-12-31T23:59:59Z',
        byMethod: {
          'credit_card': { amount: 75000, count: 150, percentage: 60 },
          'cash': { amount: 25000, count: 75, percentage: 20 },
          'check': { amount: 25000, count: 25, percentage: 20 }
        },
        byCategory: {
          'tithes': {
            categoryName: 'Tithes & Offerings',
            amount: 100000,
            count: 200,
            percentage: 80,
            goalProgress: 75
          }
        },
        form990Breakdown: {
          '1a_cash_contributions': {
            amount: 120000,
            count: 240,
            percentage: 96
          },
          '1b_noncash_contributions': {
            amount: 5000,
            count: 10,
            percentage: 4
          }
        },
        topDonorRanges: [
          {
            range: '$1000-$2499',
            count: 15,
            totalAmount: 22500
          },
          {
            range: '$500-$999',
            count: 25,
            totalAmount: 18750
          }
        ]
      };

      expect(summary.totalDonations).toBe(125000);
      expect(summary.byMethod['credit_card'].percentage).toBe(60);
      expect(summary.topDonorRanges).toHaveLength(2);
    });
  });

  describe('TaxReceiptData Interface', () => {
    it('should define complete tax receipt information', () => {
      const receipt: TaxReceiptData = {
        donationId: 'donation-123',
        receiptNumber: 'R-2025-001',
        donorName: 'John Smith',
        donorAddress: {
          line1: '123 Main St',
          line2: 'Apt 4B',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345'
        },
        amount: 1000,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'credit_card',
        category: 'Building Fund',
        isTaxDeductible: true,
        taxYear: 2025,
        isQuidProQuo: true,
        quidProQuoValue: 50,
        deductibleAmount: 950,
        churchName: 'Grace Community Church',
        churchAddress: '456 Church St, Anytown, CA 12345',
        churchEIN: '12-3456789',
        generatedAt: '2025-01-15T10:05:00Z',
        generatedBy: 'admin-123'
      };

      expect(receipt.deductibleAmount).toBe(950);
      expect(receipt.donorAddress?.city).toBe('Anytown');
      expect(receipt.churchEIN).toBe('12-3456789');
    });
  });

  describe('Form Data Interfaces', () => {
    it('should define DonationFormData for UI forms', () => {
      const formData: DonationFormData = {
        memberId: 'member-456',
        memberName: 'John Smith',
        amount: 100,
        donationDate: '2025-01-15',
        method: 'credit_card',
        sourceLabel: 'Online Portal',
        note: 'Monthly tithe',
        categoryId: 'category-789',
        form990LineItem: '1a_cash_contributions',
        isQuidProQuo: false,
        restrictionType: 'unrestricted',
        sendReceipt: true,
        receiptEmail: 'john@example.com',
        isTaxDeductible: true
      };

      expect(formData.amount).toBe(100);
      expect(formData.sendReceipt).toBe(true);
      expect(formData.receiptEmail).toBe('john@example.com');
    });

    it('should define BulkDonationImportData for CSV imports', () => {
      const importData: BulkDonationImportData = {
        memberName: 'Jane Doe',
        memberId: 'member-789',
        amount: 250,
        donationDate: '2025-01-15',
        method: 'check',
        category: 'Missions',
        note: 'Quarterly missions support',
        receiptNumber: 'R-2025-003'
      };

      expect(importData.memberName).toBe('Jane Doe');
      expect(importData.category).toBe('Missions');
    });
  });

  describe('Validation Interfaces', () => {
    it('should define validation rules structure', () => {
      const rules: DonationValidationRules = {
        amount: {
          min: 0.01,
          max: 1000000,
          required: true
        },
        donationDate: {
          required: true,
          maxDate: '2025-12-31',
          minDate: '2020-01-01'
        },
        method: {
          required: true,
          allowedMethods: ['cash', 'check', 'credit_card', 'online']
        },
        categoryId: {
          required: true
        },
        form990Fields: {
          required: true
        }
      };

      expect(rules.amount.min).toBe(0.01);
      expect(rules.method.allowedMethods).toContain('credit_card');
    });

    it('should define validation result structure', () => {
      const result: DonationValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'amount',
            message: 'Amount must be greater than 0',
            code: 'MIN_VALUE'
          }
        ],
        warnings: [
          {
            field: 'donationDate',
            message: 'Donation date is more than 1 year old',
            code: 'OLD_DATE'
          }
        ]
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('Migration and Enhancement Types', () => {
    it('should define migration data structure', () => {
      const migration: DonationMigrationData = {
        legacyId: 'old-system-123',
        migrationSource: 'ChurchTrac Export',
        migrationDate: '2025-01-15T00:00:00Z',
        migrationNotes: 'Imported from legacy system with manual validation',
        dataQualityScore: 85,
        requiresReview: true
      };

      expect(migration.dataQualityScore).toBe(85);
      expect(migration.requiresReview).toBe(true);
    });

    it('should define enhanced donation with migration data', () => {
      const enhancedDonation: EnhancedDonation = {
        id: 'donation-123',
        amount: 100,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'credit_card',
        categoryId: 'category-789',
        categoryName: 'Tithes',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
          restrictionType: 'unrestricted'
        },
        receiptNumber: 'R-2025-001',
        isReceiptSent: true,
        isTaxDeductible: true,
        taxYear: 2025,
        createdAt: '2025-01-15T10:00:00Z',
        createdBy: 'admin-123',
        updatedAt: '2025-01-15T10:00:00Z',
        status: 'verified',
        migration: {
          legacyId: 'legacy-456',
          migrationSource: 'Old Church DB',
          migrationDate: '2025-01-01T00:00:00Z',
          dataQualityScore: 90,
          requiresReview: false
        }
      };

      expect(enhancedDonation.migration?.legacyId).toBe('legacy-456');
      expect(enhancedDonation.migration?.dataQualityScore).toBe(90);
    });
  });

  describe('Edge Cases and Boundary Values', () => {
    it('should handle zero amounts (edge case)', () => {
      const donation: Pick<Donation, 'amount'> = {
        amount: 0
      };

      expect(donation.amount).toBe(0);
    });

    it('should handle very large donation amounts', () => {
      const largeDonation: Pick<Donation, 'amount'> = {
        amount: 999999.99
      };

      expect(largeDonation.amount).toBe(999999.99);
    });

    it('should handle donations with decimal precision', () => {
      const precisionDonation: Pick<Donation, 'amount'> = {
        amount: 123.45
      };

      expect(precisionDonation.amount).toBe(123.45);
    });

    it('should handle undefined optional fields gracefully', () => {
      const minimalDonation: Donation = {
        id: 'donation-minimal',
        amount: 50,
        donationDate: '2025-01-15T10:00:00Z',
        method: 'cash',
        categoryId: 'category-general',
        categoryName: 'General Fund',
        form990Fields: {
          lineItem: '1a_cash_contributions',
          isQuidProQuo: false,
          isAnonymous: false,
          restrictionType: 'unrestricted'
        },
        receiptNumber: 'R-2025-004',
        isReceiptSent: false,
        isTaxDeductible: true,
        taxYear: 2025,
        createdAt: '2025-01-15T10:00:00Z',
        createdBy: 'admin-123',
        updatedAt: '2025-01-15T10:00:00Z',
        status: 'pending'
      };

      expect(minimalDonation.memberId).toBeUndefined();
      expect(minimalDonation.note).toBeUndefined();
      expect(minimalDonation.verifiedBy).toBeUndefined();
      expect(minimalDonation.receiptSentAt).toBeUndefined();
    });
  });
});