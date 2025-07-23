import {
  collection,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import {
  Member,
  MemberDocument,
  COLLECTIONS,
  QueryOptions,
} from '../../types/firestore';
import {
  memberDocumentToMember,
  memberToMemberDocument,
} from '../../utils/firestore-converters';
import { HouseholdsService } from './households.service';

// ============================================================================
// MEMBERS SERVICE
// ============================================================================
// Handles all CRUD operations for member documents

export class MembersService extends BaseFirestoreService<
  MemberDocument,
  Member
> {
  private householdsService: HouseholdsService;

  constructor() {
    super(COLLECTIONS.MEMBERS);
    this.householdsService = new HouseholdsService();
  }

  // ============================================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  protected documentToClient(id: string, document: MemberDocument): Member {
    return memberDocumentToMember(id, document);
  }

  protected clientToDocument(client: Partial<Member>): Partial<MemberDocument> {
    return memberToMemberDocument(client);
  }

  // ============================================================================
  // SPECIALIZED MEMBER OPERATIONS
  // ============================================================================

  /**
   * Create a member with Firebase Auth UID
   */
  async createWithAuthUID(
    authUID: string,
    memberData: Partial<Member>
  ): Promise<Member> {
    return this.create(memberData, authUID);
  }

  /**
   * Get member by email address
   */
  async getByEmail(email: string): Promise<Member | null> {
    const results = await this.getWhere('email', '==', email);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get members by household ID
   */
  async getByHouseholdId(householdId: string): Promise<Member[]> {
    return this.getWhere('householdId', '==', householdId);
  }

  /**
   * Get members by role
   */
  async getByRole(role: 'admin' | 'pastor' | 'member'): Promise<Member[]> {
    return this.getWhere('role', '==', role);
  }

  /**
   * Get members by status
   */
  async getByStatus(
    status: 'active' | 'inactive' | 'visitor'
  ): Promise<Member[]> {
    return this.getWhere('memberStatus', '==', status);
  }

  /**
   * Search members by name or email
   */
  async search(searchTerm: string, options?: QueryOptions): Promise<Member[]> {
    // Get all members first (Firestore doesn't support full-text search natively)
    const allMembers = await this.getAll(options);

    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    return allMembers.filter(
      (member) =>
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        member.fullName.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        (member.phone && member.phone.includes(searchTerm))
    );
  }

  /**
   * Get member directory with pagination and filtering
   */
  async getMemberDirectory(options?: {
    search?: string;
    status?: 'active' | 'inactive' | 'visitor';
    role?: 'admin' | 'pastor' | 'member';
    householdId?: string;
    limit?: number;
    orderBy?: 'name' | 'email' | 'status' | 'role';
    orderDirection?: 'asc' | 'desc';
  }): Promise<Member[]> {
    const queryOptions: QueryOptions = {
      where: [],
      limit: options?.limit || 50,
      orderBy: {
        field:
          options?.orderBy === 'name'
            ? 'fullName'
            : options?.orderBy || 'fullName',
        direction: options?.orderDirection || 'asc',
      },
    };

    // Add filters
    if (options?.status) {
      queryOptions.where!.push({
        field: 'memberStatus',
        operator: '==',
        value: options.status,
      });
    }

    if (options?.role) {
      queryOptions.where!.push({
        field: 'role',
        operator: '==',
        value: options.role,
      });
    }

    if (options?.householdId) {
      queryOptions.where!.push({
        field: 'householdId',
        operator: '==',
        value: options.householdId,
      });
    }

    let results = await this.getAll(queryOptions);

    // Apply search filter if provided
    if (options?.search) {
      results = results.filter(
        (member) =>
          member.firstName
            .toLowerCase()
            .includes(options.search!.toLowerCase()) ||
          member.lastName
            .toLowerCase()
            .includes(options.search!.toLowerCase()) ||
          member.email.toLowerCase().includes(options.search!.toLowerCase())
      );
    }

    // Populate household names
    const householdIds = [
      ...new Set(results.map((m) => m.householdId).filter(Boolean)),
    ];
    const householdMap = new Map<string, string>();

    if (householdIds.length > 0) {
      try {
        const households = await Promise.all(
          householdIds.map((id) => this.householdsService.getById(id))
        );

        households.forEach((household, index) => {
          if (household) {
            householdMap.set(householdIds[index], household.familyName);
          }
        });
      } catch (error) {
        console.error('Error fetching household names:', error);
      }
    }

    // Enrich members with household names
    return results.map((member) => ({
      ...member,
      householdName: householdMap.get(member.householdId) || undefined,
    }));
  }

  // ============================================================================
  // HOUSEHOLD RELATIONSHIP MANAGEMENT
  // ============================================================================

  /**
   * Update member and maintain household relationships
   */
  async updateWithHouseholdSync(
    id: string,
    data: Partial<Member>
  ): Promise<Member> {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    // Get current member data
    const currentMember = await this.getById(id);
    if (!currentMember) {
      throw new Error('Member not found');
    }

    // Update member document
    const memberRef = this.getDocRef(id);
    const memberDocumentData = this.clientToDocument(data);
    batch.update(memberRef, {
      ...memberDocumentData,
      updatedAt: now,
    } as any);

    // Handle household changes
    if (data.householdId && data.householdId !== currentMember.householdId) {
      // Remove from old household
      if (currentMember.householdId) {
        await this.householdsService.removeMemberFromHousehold(
          currentMember.householdId,
          id
        );
      }

      // Add to new household
      await this.householdsService.addMemberToHousehold(data.householdId, id);
    }

    // Handle primary contact changes
    if (data.isPrimaryContact !== undefined && data.householdId) {
      const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, data.householdId);
      if (data.isPrimaryContact) {
        // Set as primary contact
        batch.update(householdRef, {
          primaryContactId: id,
          primaryContactName: `${data.firstName || currentMember.firstName} ${data.lastName || currentMember.lastName}`,
          updatedAt: now,
        });
      } else if (currentMember.isPrimaryContact) {
        // Remove primary contact if this member was primary
        batch.update(householdRef, {
          primaryContactId: null,
          primaryContactName: null,
          updatedAt: now,
        });
      }
    }

    // Commit batch
    await batch.commit();

    // Return updated member
    return this.getById(id) as Promise<Member>;
  }

  /**
   * Delete member and cleanup household relationships
   */
  async deleteWithHouseholdCleanup(id: string): Promise<void> {
    const member = await this.getById(id);
    if (!member) {
      throw new Error('Member not found');
    }

    const batch = writeBatch(db);

    // Remove member document
    const memberRef = this.getDocRef(id);
    batch.delete(memberRef);

    // Remove from household
    if (member.householdId) {
      await this.householdsService.removeMemberFromHousehold(
        member.householdId,
        id
      );
    }

    await batch.commit();
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Import members from CSV or other sources
   */
  async importMembers(membersData: Partial<Member>[]): Promise<{
    success: Member[];
    errors: { data: Partial<Member>; error: string }[];
  }> {
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
        const newMember = await this.create(memberData);
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
  async exportMembers(options?: {
    status?: 'active' | 'inactive' | 'visitor';
    role?: 'admin' | 'pastor' | 'member';
    householdId?: string;
    includeHouseholdInfo?: boolean;
  }): Promise<any[]> {
    const members = await this.getMemberDirectory(options);

    return members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      birthdate: member.birthdate || '',
      gender: member.gender || '',
      role: member.role,
      memberStatus: member.memberStatus,
      joinedAt: member.joinedAt || '',
      householdName: member.householdName || '',
      isPrimaryContact: member.isPrimaryContact ? 'Yes' : 'No',
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }));
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS
  // ============================================================================

  /**
   * Get member statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    visitors: number;
    admins: number;
    pastors: number;
    members: number;
    householdsCount: number;
  }> {
    const [total, active, inactive, visitors, admins, pastors, members] =
      await Promise.all([
        this.count(),
        this.count({
          where: [{ field: 'memberStatus', operator: '==', value: 'active' }],
        }),
        this.count({
          where: [{ field: 'memberStatus', operator: '==', value: 'inactive' }],
        }),
        this.count({
          where: [{ field: 'memberStatus', operator: '==', value: 'visitor' }],
        }),
        this.count({
          where: [{ field: 'role', operator: '==', value: 'admin' }],
        }),
        this.count({
          where: [{ field: 'role', operator: '==', value: 'pastor' }],
        }),
        this.count({
          where: [{ field: 'role', operator: '==', value: 'member' }],
        }),
      ]);

    const householdsCount = await this.householdsService.count();

    return {
      total,
      active,
      inactive,
      visitors,
      admins,
      pastors,
      members,
      householdsCount,
    };
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to member directory changes
   */
  subscribeToMemberDirectory(
    options?: {
      status?: 'active' | 'inactive' | 'visitor';
      role?: 'admin' | 'pastor' | 'member';
      limit?: number;
    },
    callback?: (members: Member[]) => void
  ): () => void {
    const queryOptions: QueryOptions = {
      orderBy: { field: 'fullName', direction: 'asc' },
      limit: options?.limit || 100,
      where: [],
    };

    if (options?.status) {
      queryOptions.where!.push({
        field: 'memberStatus',
        operator: '==',
        value: options.status,
      });
    }

    if (options?.role) {
      queryOptions.where!.push({
        field: 'role',
        operator: '==',
        value: options.role,
      });
    }

    return this.subscribeToCollection(queryOptions, callback);
  }

  /**
   * Subscribe to household members
   */
  subscribeToHouseholdMembers(
    householdId: string,
    callback: (members: Member[]) => void
  ): () => void {
    return this.subscribeToCollection(
      {
        where: [{ field: 'householdId', operator: '==', value: householdId }],
        orderBy: { field: 'fullName', direction: 'asc' },
      },
      callback
    );
  }
}

// Create and export singleton instance
export const membersService = new MembersService();
