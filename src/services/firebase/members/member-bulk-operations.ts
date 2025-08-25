import { Member } from '../../../types';

export interface ImportResult {
  success: Member[];
  errors: { data: Partial<Member>; error: string }[];
}

export class MemberBulkOperations {
  constructor(
    private createMember: (data: Partial<Member>) => Promise<Member>,
    private getByEmail: (email: string) => Promise<Member | null>
  ) {}

  /**
   * Import members from CSV or other sources
   */
  async importMembers(membersData: Partial<Member>[]): Promise<ImportResult> {
    const success: Member[] = [];
    const errors: { data: Partial<Member>; error: string }[] = [];

    for (const memberData of membersData) {
      try {
        // Validate required fields
        if (
          !memberData.firstName ||
          !memberData.lastName ||
          !memberData.email
        ) {
          errors.push({
            data: memberData,
            error: 'Missing required fields: firstName, lastName, email',
          });
          continue;
        }

        // Check for duplicate email
        const existingMember = await this.getByEmail(memberData.email);
        if (existingMember) {
          errors.push({
            data: memberData,
            error: `Email ${memberData.email} already exists`,
          });
          continue;
        }

        // Create member
        const newMember = await this.createMember(memberData);
        success.push(newMember);
      } catch (error) {
        errors.push({
          data: memberData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { success, errors };
  }

  /**
   * Export members to a format suitable for CSV
   */
  static exportMembers(
    members: Member[],
    options?: {
      includeHouseholdInfo?: boolean;
    }
  ): Partial<Member>[] {
    return members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      birthdate: member.birthdate || '',
      gender: member.gender || undefined,
      role: member.role,
      memberStatus: member.memberStatus,
      joinedAt: member.joinedAt || '',
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }));
  }

  /**
   * Validate member data for import
   */
  static validateMemberData(memberData: Partial<Member>): string[] {
    const errors: string[] = [];

    if (!memberData.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!memberData.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!memberData.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(memberData.email)) {
      errors.push('Email format is invalid');
    }

    if (memberData.phone && !this.isValidPhone(memberData.phone)) {
      errors.push('Phone format is invalid');
    }

    if (memberData.role && !['admin', 'pastor', 'member'].includes(memberData.role)) {
      errors.push('Invalid role specified');
    }

    if (memberData.memberStatus && !['active', 'inactive', 'visitor'].includes(memberData.memberStatus)) {
      errors.push('Invalid member status specified');
    }

    return errors;
  }

  /**
   * Basic email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Basic phone validation
   */
  private static isValidPhone(phone: string): boolean {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Should be 10 digits (US format)
    return digits.length === 10;
  }

  /**
   * Process members in batches to avoid overwhelming the system
   */
  async importMembersInBatches(
    membersData: Partial<Member>[],
    batchSize: number = 10
  ): Promise<ImportResult> {
    const totalResult: ImportResult = {
      success: [],
      errors: [],
    };

    for (let i = 0; i < membersData.length; i += batchSize) {
      const batch = membersData.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(membersData.length / batchSize)}`);
      
      const batchResult = await this.importMembers(batch);
      
      totalResult.success.push(...batchResult.success);
      totalResult.errors.push(...batchResult.errors);

      // Small delay between batches to be kind to Firestore
      if (i + batchSize < membersData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return totalResult;
  }
}