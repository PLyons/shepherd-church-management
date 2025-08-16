// import { Timestamp } from 'firebase/firestore'; // Not used in this service
import { BaseFirestoreService } from './base.service';
import { PendingRegistrationDocument } from '../../types/firestore';
import {
  PendingRegistration,
  RegistrationFormData,
  RegistrationSubmissionResult,
} from '../../types/registration';
import {
  timestampToString,
  stringToTimestamp,
  removeUndefined,
} from '../../utils/firestore-converters';

class PublicRegistrationService extends BaseFirestoreService<
  PendingRegistrationDocument,
  PendingRegistration
> {
  constructor() {
    super('pending_registrations');
  }

  // ============================================================================
  // DOCUMENT CONVERSION METHODS
  // ============================================================================

  protected documentToClient(
    id: string,
    document: PendingRegistrationDocument
  ): PendingRegistration {
    return {
      id,
      tokenId: document.tokenId,
      firstName: document.firstName,
      lastName: document.lastName,
      email: document.email,
      phone: document.phone,
      birthdate: timestampToString(document.birthdate),
      gender: document.gender,
      address: document.address,
      memberStatus: document.memberStatus,
      submittedAt: timestampToString(document.submittedAt) || '',
      ipAddress: document.ipAddress,
      userAgent: document.userAgent,
      approvalStatus: document.approvalStatus,
      approvedBy: document.approvedBy,
      approvedAt: timestampToString(document.approvedAt),
      rejectionReason: document.rejectionReason,
      memberId: document.memberId,
    };
  }

  protected clientToDocument(
    client: Partial<PendingRegistration>
  ): Partial<PendingRegistrationDocument> {
    const document: Partial<PendingRegistrationDocument> = {
      tokenId: client.tokenId,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      birthdate: stringToTimestamp(client.birthdate),
      gender: client.gender,
      address: client.address,
      memberStatus: client.memberStatus,
      submittedAt: stringToTimestamp(client.submittedAt),
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      approvalStatus: client.approvalStatus,
      approvedBy: client.approvedBy,
      approvedAt: stringToTimestamp(client.approvedAt),
      rejectionReason: client.rejectionReason,
      memberId: client.memberId,
    };

    return removeUndefined(document);
  }

  // ============================================================================
  // REGISTRATION SUBMISSION METHODS
  // ============================================================================

  /**
   * Submit a new registration (public endpoint - no authentication required)
   */
  async submitRegistration(
    tokenId: string,
    formData: RegistrationFormData,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<RegistrationSubmissionResult> {
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName) {
        return {
          success: false,
          error: 'First name and last name are required',
          message: 'Please fill in all required fields',
        };
      }

      // Check for potential duplicates
      const duplicates = await this.detectDuplicates(
        formData.email,
        formData.phone
      );
      if (duplicates.length > 0) {
        console.warn('Potential duplicate registration detected:', duplicates);
        // Note: In production, you might want to handle this differently
        // For now, we'll allow the registration but could flag it for admin review
      }

      // Create pending registration
      const registrationData: Partial<PendingRegistration> = {
        tokenId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email ? formData.email.trim().toLowerCase() : undefined,
        phone: formData.phone ? formData.phone.trim() : undefined,
        birthdate: formData.birthdate || undefined,
        gender: formData.gender || undefined,
        address: this.cleanAddress(formData.address),
        memberStatus: formData.memberStatus,
        submittedAt: new Date().toISOString(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        approvalStatus: 'pending',
      };

      const created = await this.create(registrationData);

      console.log('Registration submitted successfully:', created.id);

      return {
        success: true,
        registrationId: created.id,
        message:
          'Thank you for registering! A church administrator will review your information.',
      };
    } catch (error) {
      console.error('Error submitting registration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        message:
          'We encountered an error processing your registration. Please try again.',
      };
    }
  }

  /**
   * Detect potential duplicate registrations
   */
  async detectDuplicates(
    email?: string,
    phone?: string
  ): Promise<PendingRegistration[]> {
    try {
      const duplicates: PendingRegistration[] = [];

      // Check by email if provided
      if (email) {
        const emailMatches = await this.getWhere(
          'email',
          '==',
          email.toLowerCase()
        );
        duplicates.push(...emailMatches);
      }

      // Check by phone if provided
      if (phone) {
        const phoneMatches = await this.getWhere('phone', '==', phone);
        duplicates.push(...phoneMatches);
      }

      // Remove duplicates from the array
      const uniqueDuplicates = duplicates.filter(
        (item, index, arr) =>
          arr.findIndex((dup) => dup.id === item.id) === index
      );

      return uniqueDuplicates;
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      return [];
    }
  }

  /**
   * Clean and validate address data
   */
  private cleanAddress(
    address: Record<string, string>
  ): Record<string, string> | undefined {
    if (!address) return undefined;

    const cleaned = {
      line1: address.line1 ? String(address.line1).trim() : undefined,
      line2: address.line2 ? String(address.line2).trim() : undefined,
      city: address.city ? String(address.city).trim() : undefined,
      state: address.state ? String(address.state).trim() : undefined,
      postalCode: address.postalCode
        ? String(address.postalCode).trim()
        : undefined,
      country: address.country ? String(address.country).trim() : 'USA',
    };

    // Return undefined if no meaningful address data
    const hasData = Object.values(cleaned).some(
      (value) => value && value !== 'USA'
    );
    return hasData ? (cleaned as Record<string, string>) : undefined;
  }

  // ============================================================================
  // ADMIN QUERY METHODS
  // ============================================================================

  /**
   * Get all pending registrations
   */
  async getPendingRegistrations(): Promise<PendingRegistration[]> {
    return this.getWhere('approvalStatus', '==', 'pending');
  }

  /**
   * Get registrations by status
   */
  async getRegistrationsByStatus(
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<PendingRegistration[]> {
    return this.getWhere('approvalStatus', '==', status);
  }

  /**
   * Get registrations by token
   */
  async getRegistrationsByToken(
    tokenId: string
  ): Promise<PendingRegistration[]> {
    return this.getWhere('tokenId', '==', tokenId);
  }

  /**
   * Get registrations submitted in date range
   */
  async getRegistrationsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<PendingRegistration[]> {
    try {
      const registrations = await this.getAll({
        where: [
          { field: 'submittedAt', operator: '>=', value: new Date(startDate) },
          { field: 'submittedAt', operator: '<=', value: new Date(endDate) },
        ],
        orderBy: { field: 'submittedAt', direction: 'desc' },
      });

      return registrations;
    } catch (error) {
      console.error('Error getting registrations by date range:', error);
      throw error;
    }
  }

  /**
   * Update registration approval status
   */
  async updateApprovalStatus(
    registrationId: string,
    status: 'approved' | 'rejected',
    approvedBy: string,
    rejectionReason?: string,
    memberId?: string
  ): Promise<void> {
    try {
      const updateData: Partial<PendingRegistration> = {
        approvalStatus: status,
        approvedBy,
        approvedAt: new Date().toISOString(),
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      if (status === 'approved' && memberId) {
        updateData.memberId = memberId;
      }

      await this.update(registrationId, updateData);
      console.log(`Registration ${registrationId} ${status} by ${approvedBy}`);
    } catch (error) {
      console.error('Error updating approval status:', error);
      throw error;
    }
  }

  /**
   * Get registration statistics
   */
  async getRegistrationStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byMemberStatus: {
      member: number;
      visitor: number;
    };
  }> {
    try {
      const [pending, approved, rejected] = await Promise.all([
        this.getRegistrationsByStatus('pending'),
        this.getRegistrationsByStatus('approved'),
        this.getRegistrationsByStatus('rejected'),
      ]);

      const all = [...pending, ...approved, ...rejected];
      const memberCount = all.filter((r) => r.memberStatus === 'member').length;
      const visitorCount = all.filter(
        (r) => r.memberStatus === 'visitor'
      ).length;

      return {
        total: all.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        byMemberStatus: {
          member: memberCount,
          visitor: visitorCount,
        },
      };
    } catch (error) {
      console.error('Error getting registration statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const publicRegistrationService = new PublicRegistrationService();
