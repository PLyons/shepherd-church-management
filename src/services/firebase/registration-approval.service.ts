import { publicRegistrationService } from './public-registration.service';
import { membersService } from './members.service';
// import { householdsService } from './households.service'; // REMOVED - household functionality disabled
import { followUpService } from './follow-up.service';
import { PendingRegistration } from '../../types/registration';
import { Member } from '../../types';
import { generateFullName } from '../../utils/firestore-converters';

interface HouseholdSuggestion {
  id: string;
  familyName: string;
  memberCount: number;
  primaryContactName?: string;
  matchReason: 'lastName' | 'address' | 'both';
}

class RegistrationApprovalService {
  // ============================================================================
  // APPROVAL WORKFLOW METHODS
  // ============================================================================

  /**
   * Approve a pending registration and create member record
   */
  async approveRegistration(
    registrationId: string,
    approvedBy: string,
    options?: {
      createNewHousehold?: boolean;
      assignToHouseholdId?: string;
      customRole?: 'admin' | 'pastor' | 'member';
    }
  ): Promise<{
    success: boolean;
    memberId?: string;
    householdId?: string;
    error?: string;
  }> {
    try {
      // Get the pending registration
      const registration =
        await publicRegistrationService.getById(registrationId);
      if (!registration) {
        return { success: false, error: 'Registration not found' };
      }

      if (registration.approvalStatus !== 'pending') {
        return {
          success: false,
          error: 'Registration is not pending approval',
        };
      }

      // Create or assign to household
      // Household functionality disabled during cleanup
      // let householdId = options?.assignToHouseholdId;

      // Create the member record
      const memberData: Partial<Member> = {
        firstName: registration.firstName,
        lastName: registration.lastName,
        email: registration.email,
        phone: registration.phone,
        birthdate: registration.birthdate,
        gender: registration.gender || undefined,
        role: options?.customRole || 'member',
        memberStatus:
          registration.memberStatus === 'member' ? 'active' : 'inactive',
        // householdId: householdId, // DISABLED
        // isPrimaryContact: true, // DISABLED
        joinedAt: new Date().toISOString(),
      };

      // Generate a member ID (in a real implementation, this would be the Firebase Auth UID)
      // For now, we'll let Firebase auto-generate the ID
      const member = await membersService.create(
        memberData as Omit<Member, 'id'>
      );

      // Household functionality disabled during cleanup
      // Update the household with the new member - DISABLED

      // Update the registration status
      await publicRegistrationService.updateApprovalStatus(
        registrationId,
        'approved',
        approvedBy,
        undefined,
        // @ts-expect-error - member type issue
        member.id || 'unknown'
      );

      // Process follow-up actions
      try {
        // @ts-expect-error - member type issue
        await followUpService.processApprovedRegistration(registration, member);
        // @ts-expect-error - member type issue
        console.log(`Follow-up actions scheduled for member ${member.id}`);
      } catch (followUpError) {
        console.error('Error scheduling follow-up actions:', followUpError);
        // Don't fail the approval if follow-up scheduling fails
      }

      console.log(
        // @ts-expect-error - member type issue
        `Registration ${registrationId} approved, member ${member.id} created`
      );

      return {
        success: true,
        memberId: member.id,
        householdId: householdId,
      };
    } catch (error) {
      console.error('Error approving registration:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to approve registration',
      };
    }
  }

  /**
   * Reject a pending registration
   */
  async rejectRegistration(
    registrationId: string,
    rejectedBy: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const registration =
        await publicRegistrationService.getById(registrationId);
      if (!registration) {
        return { success: false, error: 'Registration not found' };
      }

      if (registration.approvalStatus !== 'pending') {
        return {
          success: false,
          error: 'Registration is not pending approval',
        };
      }

      await publicRegistrationService.updateApprovalStatus(
        registrationId,
        'rejected',
        rejectedBy,
        reason
      );

      console.log(
        `Registration ${registrationId} rejected by ${rejectedBy}: ${reason}`
      );

      return { success: true };
    } catch (error) {
      console.error('Error rejecting registration:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reject registration',
      };
    }
  }

  /**
   * Bulk approve multiple registrations
   */
  async bulkApprove(
    registrationIds: string[],
    approvedBy: string,
    options?: {
      defaultRole?: 'admin' | 'pastor' | 'member';
    }
  ): Promise<{
    success: boolean;
    approved: string[];
    failed: { id: string; error: string }[];
  }> {
    const approved: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const registrationId of registrationIds) {
      try {
        const result = await this.approveRegistration(
          registrationId,
          approvedBy,
          {
            customRole: options?.defaultRole,
          }
        );

        if (result.success) {
          approved.push(registrationId);
        } else {
          failed.push({
            id: registrationId,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        failed.push({
          id: registrationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: failed.length === 0,
      approved,
      failed,
    };
  }

  // ============================================================================
  // DUPLICATE DETECTION METHODS
  // ============================================================================

  /**
   * Detect potential duplicate members for a registration
   */
  async detectDuplicateMembers(
    registration: PendingRegistration
  ): Promise<Member[]> {
    try {
      const potentialDuplicates: Member[] = [];

      // Check by email if provided
      if (registration.email) {
        const emailMatches = await membersService.getWhere(
          'email',
          '==',
          registration.email.toLowerCase()
        );
        potentialDuplicates.push(...emailMatches);
      }

      // Check by phone if provided
      if (registration.phone) {
        const phoneMatches = await membersService.getWhere(
          'phone',
          '==',
          registration.phone
        );
        potentialDuplicates.push(...phoneMatches);
      }

      // Check by full name (approximate matching)
      const fullName = generateFullName(
        registration.firstName,
        registration.lastName
      );
      const nameMatches = await membersService.getWhere(
        'fullName',
        '==',
        fullName
      );
      potentialDuplicates.push(...nameMatches);

      // Remove actual duplicates from array
      const uniqueDuplicates = potentialDuplicates.filter(
        (item, index, arr) =>
          arr.findIndex((dup) => dup.id === item.id) === index
      );

      return uniqueDuplicates;
    } catch (error) {
      console.error('Error detecting duplicate members:', error);
      return [];
    }
  }

  /**
   * Get registrations that may be duplicates
   */
  async getRegistrationsWithPotentialDuplicates(): Promise<
    {
      registration: PendingRegistration;
      potentialDuplicates: Member[];
    }[]
  > {
    try {
      const pendingRegistrations =
        await publicRegistrationService.getPendingRegistrations();
      const registrationsWithDuplicates = [];

      for (const registration of pendingRegistrations) {
        const duplicates = await this.detectDuplicateMembers(registration);
        if (duplicates.length > 0) {
          registrationsWithDuplicates.push({
            registration,
            potentialDuplicates: duplicates,
          });
        }
      }

      return registrationsWithDuplicates;
    } catch (error) {
      console.error(
        'Error getting registrations with potential duplicates:',
        error
      );
      return [];
    }
  }

  // ============================================================================
  // HOUSEHOLD ASSIGNMENT METHODS
  // ============================================================================

  /**
   * Suggest households for a registration based on last name and address
   */
  async suggestHouseholds(registration: PendingRegistration): Promise<
    {
      id: string;
      familyName: string;
      memberCount: number;
      primaryContactName?: string;
      matchReason: 'lastName' | 'address' | 'both';
    }[]
  > {
    try {
      const suggestions: HouseholdSuggestion[] = [];
      const allHouseholds = await householdsService.getAll();

      for (const household of allHouseholds) {
        let matchReason: 'lastName' | 'address' | 'both' | null = null;

        // Check for last name match
        const lastNameMatch = household.familyName
          .toLowerCase()
          .includes(registration.lastName.toLowerCase());

        // Check for address match (basic comparison)
        let addressMatch = false;
        if (registration.address && household.address) {
          const regCity = registration.address.city?.toLowerCase();
          const regState = registration.address.state?.toLowerCase();
          const houseCity = household.address.city?.toLowerCase();
          const houseState = household.address.state?.toLowerCase();

          addressMatch = regCity === houseCity && regState === houseState;
        }

        if (lastNameMatch && addressMatch) {
          matchReason = 'both';
        } else if (lastNameMatch) {
          matchReason = 'lastName';
        } else if (addressMatch) {
          matchReason = 'address';
        }

        if (matchReason) {
          suggestions.push({
            id: household.id,
            familyName: household.familyName,
            memberCount: household.memberCount,
            primaryContactName: household.primaryContactName,
            matchReason,
          });
        }
      }

      // Sort by relevance (both > lastName > address)
      suggestions.sort((a, b) => {
        const order: Record<string, number> = {
          both: 3,
          lastName: 2,
          address: 1,
        };
        return order[b.matchReason] - order[a.matchReason];
      });

      return suggestions.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('Error suggesting households:', error);
      return [];
    }
  }

  // ============================================================================
  // REPORTING METHODS
  // ============================================================================

  /**
   * Get approval workflow statistics
   */
  async getApprovalStatistics(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    pendingWithDuplicates: number;
    recentApprovals: number; // last 7 days
    recentRejections: number; // last 7 days
  }> {
    try {
      const stats = await publicRegistrationService.getRegistrationStatistics();
      const duplicatesData =
        await this.getRegistrationsWithPotentialDuplicates();

      // Calculate recent approvals/rejections (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentRegistrations =
        await publicRegistrationService.getRegistrationsByDateRange(
          sevenDaysAgo.toISOString(),
          new Date().toISOString()
        );

      const recentApprovals = recentRegistrations.filter(
        (r) => r.approvalStatus === 'approved'
      ).length;
      const recentRejections = recentRegistrations.filter(
        (r) => r.approvalStatus === 'rejected'
      ).length;

      return {
        totalPending: stats.pending,
        totalApproved: stats.approved,
        totalRejected: stats.rejected,
        pendingWithDuplicates: duplicatesData.length,
        recentApprovals,
        recentRejections,
      };
    } catch (error) {
      console.error('Error getting approval statistics:', error);
      return {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        pendingWithDuplicates: 0,
        recentApprovals: 0,
        recentRejections: 0,
      };
    }
  }
}

// Export singleton instance
export const registrationApprovalService = new RegistrationApprovalService();
