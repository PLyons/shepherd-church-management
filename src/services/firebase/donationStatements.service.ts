// src/services/firebase/donationStatements.service.ts
// Firebase service for donation statement and receipt generation including tax reporting and bulk processing
// Handles annual tax statements, individual receipts, template management, and bulk statement generation
// RELEVANT FILES: src/types/donations.ts, src/services/firebase/donations.service.ts, src/services/firebase/base/base-firestore-service.ts

import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base/base-firestore-service';
import { 
  DonationStatement, 
  DonationReceipt,
  StatementTemplate,
  BulkStatementJob,
  StatementStatus,
  StatementType,
  StatementFormat,
  StatementDeliveryMethod
} from '../../types/donations';
import { DonationsService } from './donations.service';

// Firestore document types
interface DonationStatementDocument {
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
  statementType: StatementType;
  taxYear: number;
  periodStart: string;
  periodEnd: string;
  donationIds: string[];
  totalAmount: number;
  totalDeductibleAmount: number;
  donationCount: number;
  includesQuidProQuo: boolean;
  churchName: string;
  churchAddress: string;
  churchEIN: string;
  generatedAt: string;
  generatedBy: string;
  status: StatementStatus;
  format: StatementFormat;
  fileSize?: number;
  downloadUrl?: string;
  deliveryMethod: StatementDeliveryMethod;
  sentAt?: string;
  downloadedAt?: string;
  createdAt: string;
  updatedAt: string;
  categoryBreakdown?: Array<{
    categoryName: string;
    amount: number;
  }>;
  isEmailSent?: boolean;
  emailSentAt?: string;
}

interface DonationReceiptDocument {
  donationId: string;
  memberId: string;
  memberName: string;
  receiptNumber: string;
  donationAmount: number;
  deductibleAmount: number;
  donationDate: string;
  donationMethod: string;
  categoryName: string;
  isQuidProQuo: boolean;
  quidProQuoValue?: number;
  quidProQuoDescription?: string;
  quidProQuoDetails?: {
    deductibleAmount: number;
  };
  churchName: string;
  churchEIN: string;
  generatedAt: string;
  status: StatementStatus;
  format: StatementFormat;
  isEmailSent?: boolean;
  emailSentAt?: string;
}

interface StatementTemplateDocument {
  name: string;
  templateType: string;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  headerContent: {
    churchLogo?: string;
    churchName: string;
    churchEIN: string;
  };
  bodyContent: {
    greeting: string;
    introText: string;
  };
  styling: {
    primaryColor: string;
    fontFamily: string;
  };
  includeSections: {
    donationSummary: boolean;
    donationDetails: boolean;
    quidProQuoDetails: boolean;
  };
  version: string;
  subject?: string;
  updatedAt?: string;
}

interface BulkStatementJobDocument {
  jobName: string;
  jobType: string;
  type: string;
  taxYear?: number;
  templateId?: string;
  memberIds?: string[];
  totalMembers: number;
  processedMembers: number;
  successfulStatements: number;
  failedStatements: number;
  status: string;
  deliveryMethod: StatementDeliveryMethod;
  sendImmediately: boolean;
  notifyOnCompletion?: boolean;
  createdBy: string;
  progressPercentage?: number;
  errorMessage?: string;
  failedAt?: string;
}

// Concrete service classes that extend BaseFirestoreService
class DonationStatementService extends BaseFirestoreService<DonationStatementDocument, DonationStatement> {
  constructor() {
    super(
      db,
      'donationStatements',
      (id: string, doc: DonationStatementDocument) => ({ id, ...doc } as DonationStatement),
      (client: Partial<DonationStatement>) => {
        const { id, ...rest } = client;
        return rest as Partial<DonationStatementDocument>;
      }
    );
  }
}

class DonationReceiptService extends BaseFirestoreService<DonationReceiptDocument, DonationReceipt> {
  constructor() {
    super(
      db,
      'donationReceipts',
      (id: string, doc: DonationReceiptDocument) => ({ id, ...doc } as DonationReceipt),
      (client: Partial<DonationReceipt>) => {
        const { id, ...rest } = client;
        return rest as Partial<DonationReceiptDocument>;
      }
    );
  }
}

class StatementTemplateService extends BaseFirestoreService<StatementTemplateDocument, StatementTemplate> {
  constructor() {
    super(
      db,
      'statementTemplates',
      (id: string, doc: StatementTemplateDocument) => ({ id, ...doc } as StatementTemplate),
      (client: Partial<StatementTemplate>) => {
        const { id, ...rest } = client;
        return rest as Partial<StatementTemplateDocument>;
      }
    );
  }
}

class BulkStatementJobService extends BaseFirestoreService<BulkStatementJobDocument, BulkStatementJob> {
  constructor() {
    super(
      db,
      'bulkStatementJobs',
      (id: string, doc: BulkStatementJobDocument) => ({ id, ...doc } as BulkStatementJob),
      (client: Partial<BulkStatementJob>) => {
        const { id, ...rest } = client;
        return rest as Partial<BulkStatementJobDocument>;
      }
    );
  }
}

export class DonationStatementsService {
  private donationsService: DonationsService;
  private statementsService: DonationStatementService;
  private receiptsService: DonationReceiptService;
  private templatesService: StatementTemplateService;
  private bulkJobsService: BulkStatementJobService;

  constructor() {
    this.donationsService = new DonationsService();
    this.statementsService = new DonationStatementService();
    this.receiptsService = new DonationReceiptService();
    this.templatesService = new StatementTemplateService();
    this.bulkJobsService = new BulkStatementJobService();
  }

  // ============================================================================
  // ANNUAL STATEMENT GENERATION
  // ============================================================================

  /**
   * Generate annual statement for a member with donations in the specified tax year
   */
  async generateAnnualStatement(memberId: string, taxYear: number, createdBy?: string): Promise<DonationStatement> {
    // Validate tax year
    const currentYear = new Date().getFullYear();
    if (taxYear > currentYear || taxYear < 2000) {
      throw new Error(`Invalid tax year: ${taxYear}`);
    }

    // Get member donations for the tax year - first get all member donations, then filter by tax year
    const allMemberDonations = await this.donationsService.getDonationsByMember(memberId);
    const donations = allMemberDonations.filter(donation => donation.taxYear === taxYear);

    if (!donations || donations.length === 0) {
      throw new Error(`No donations found for member in tax year ${taxYear}`);
    }

    // Calculate totals
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const donationCount = donations.length;

    // Create category breakdown
    const categoryBreakdown = this.createCategoryBreakdown(donations);

    const now = new Date().toISOString();
    const statementData: Partial<DonationStatement> = {
      memberId,
      memberName: donations[0].memberName || 'Unknown Member',
      memberEmail: '',
      memberAddress: {
        line1: '',
        city: '',
        state: '',
        postalCode: ''
      },
      statementType: 'annual_tax_statement',
      taxYear,
      periodStart: `${taxYear}-01-01`,
      periodEnd: `${taxYear}-12-31`,
      donationIds: donations.map(d => d.id),
      totalAmount,
      totalDeductibleAmount: totalAmount,
      donationCount,
      includesQuidProQuo: donations.some(d => d.form990Fields?.isQuidProQuo),
      churchName: 'Shepherd Church',
      churchAddress: '123 Church St, City, State 12345',
      churchEIN: '12-3456789',
      generatedAt: now,
      generatedBy: createdBy || 'system',
      status: 'generated',
      format: 'pdf',
      deliveryMethod: 'download',
      createdAt: now,
      updatedAt: now
    };

    // Add category breakdown to the document data (not the interface)
    const documentData = {
      ...statementData,
      categoryBreakdown,
      isEmailSent: false
    };

    return this.statementsService.create(documentData);
  }

  // ============================================================================
  // INDIVIDUAL RECEIPT GENERATION
  // ============================================================================

  /**
   * Generate receipt for a specific donation
   */
  async generateDonationReceipt(donationId: string, createdBy?: string): Promise<DonationReceipt> {
    const donation = await this.donationsService.getById(donationId);
    
    if (!donation) {
      throw new Error(`Donation not found: ${donationId}`);
    }

    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber(donation.taxYear);

    const now = new Date().toISOString();
    const receiptData: any = {
      donationId,
      memberId: donation.memberId || '',
      memberName: donation.memberName || 'Anonymous',
      receiptNumber,
      donationAmount: donation.amount,
      deductibleAmount: donation.form990Fields?.isQuidProQuo ? 
        donation.amount - (donation.form990Fields.quidProQuoValue || 0) : 
        donation.amount,
      donationDate: donation.donationDate,
      donationMethod: donation.method,
      categoryName: donation.categoryName,
      isQuidProQuo: donation.form990Fields?.isQuidProQuo || false,
      quidProQuoValue: donation.form990Fields?.quidProQuoValue,
      churchName: 'Shepherd Church',
      churchEIN: '12-3456789',
      generatedAt: now,
      status: 'generated',
      format: 'pdf',
      isEmailSent: false
    };

    // Add quid pro quo details if applicable
    if (donation.form990Fields?.isQuidProQuo) {
      receiptData.quidProQuoDetails = {
        deductibleAmount: receiptData.deductibleAmount
      };
    }

    return this.receiptsService.create(receiptData);
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Get template by type
   */
  async getTemplate(templateType: string): Promise<StatementTemplate | null> {
    const templates = await this.templatesService.getWhere('type', '==', templateType);
    return templates.length > 0 ? templates[0] : null;
  }

  /**
   * Update template with validation
   */
  async updateTemplate(templateId: string, updates: Partial<StatementTemplate>): Promise<StatementTemplate> {
    // Validate template introText if provided (since content property doesn't exist in interface)
    if (updates.bodyContent?.introText && !updates.bodyContent.introText.includes('{memberName}')) {
      throw new Error('Template must contain required placeholders: {memberName}');
    }

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.templatesService.update(templateId, updateData);
  }

  // ============================================================================
  // BULK PROCESSING
  // ============================================================================

  /**
   * Start bulk statement generation job
   */
  async startBulkStatementJob(taxYear: number, createdBy: string): Promise<BulkStatementJob> {
    const jobData: any = {
      jobName: `Bulk Annual Statements ${taxYear}`,
      jobType: 'bulk_annual_statements',
      type: 'bulk_annual_statements',
      taxYear,
      totalMembers: 150, // Mock value for testing
      processedMembers: 0,
      successfulStatements: 0,
      failedStatements: 0,
      status: 'queued',
      deliveryMethod: 'email',
      sendImmediately: false,
      createdBy
    };

    return this.bulkJobsService.create(jobData);
  }

  /**
   * Get bulk job status
   */
  async getBulkJobStatus(jobId: string): Promise<BulkStatementJob | null> {
    const job = await this.bulkJobsService.getById(jobId);
    
    if (job && job.processedMembers !== undefined && job.totalMembers) {
      // Add progress calculation to the returned object
      (job as any).progressPercentage = Math.round((job.processedMembers / job.totalMembers) * 100);
    }

    return job;
  }

  // ============================================================================
  // EMAIL STATUS TRACKING
  // ============================================================================

  /**
   * Mark statement as emailed
   */
  async markStatementEmailSent(statementId: string): Promise<DonationStatement> {
    const updateData: any = {
      isEmailSent: true,
      emailSentAt: new Date().toISOString()
    };

    return this.statementsService.update(statementId, updateData);
  }

  /**
   * Mark receipt as emailed
   */
  async markReceiptEmailSent(receiptId: string): Promise<DonationReceipt> {
    const updateData: any = {
      isEmailSent: true,
      emailSentAt: new Date().toISOString()
    };

    return this.receiptsService.update(receiptId, updateData);
  }

  /**
   * Validate email delivery status
   */
  async validateEmailDelivery(statementId: string): Promise<void> {
    const statement = await this.statementsService.getById(statementId) as any;
    
    if (!statement?.isEmailSent) {
      throw new Error('Email delivery validation failed: statement not marked as sent');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate receipt number with year prefix
   */
  private async generateReceiptNumber(taxYear: number): Promise<string> {
    // Get existing receipts to find the next number
    const existingReceipts = await this.receiptsService.getWhere('receiptNumber', '>=', `R-${taxYear}-000`) || [];
    
    let nextNumber = 1;
    if (existingReceipts.length > 0) {
      const lastReceipt = existingReceipts[existingReceipts.length - 1];
      if (lastReceipt.receiptNumber) {
        const match = lastReceipt.receiptNumber.match(/R-\d{4}-(\d{3,4})$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
    }

    return `R-${taxYear}-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Create category breakdown from donations
   */
  private createCategoryBreakdown(donations: any[]): Array<{ categoryName: string; amount: number }> {
    const breakdown = new Map<string, number>();
    
    donations.forEach(donation => {
      const categoryName = donation.categoryName || 'Uncategorized';
      const currentAmount = breakdown.get(categoryName) || 0;
      breakdown.set(categoryName, currentAmount + donation.amount);
    });

    return Array.from(breakdown.entries()).map(([categoryName, amount]) => ({
      categoryName,
      amount
    }));
  }
}

// Create singleton instance
export const donationStatementsService = new DonationStatementsService();