import {
  Timestamp,
  WhereFilterOp,
  doc,
  addDoc,
  collection,
  getDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BaseFirestoreService } from './base.service';
import {
  MemberDocument,
  COLLECTIONS,
  QueryOptions,
} from '../../types/firestore';
import { Member } from '../../types';
import {
  memberDocumentToMember,
  memberToMemberDocument,
} from '../../utils/firestore-converters';
import { 
  toFirestoreFieldsDeep, 
  fromFirestoreFieldsDeep 
} from '../../utils/firestore-field-mapper';

// ============================================================================
// MEMBERS SERVICE
// ============================================================================
// Handles all CRUD operations for member documents

export class MembersService extends BaseFirestoreService<
  MemberDocument,
  Member
> {

  constructor() {
    super(COLLECTIONS.MEMBERS);
  }


  // ============================================================================
  // ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  protected documentToClient(id: string, document: MemberDocument): Member {
    // @ts-ignore - Type mismatch between firestore and client Member interfaces
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
    // @ts-ignore - create method signature mismatch
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
    // @ts-ignore - getAll method parameter issue
    const allMembers = await this.getAll(options);

    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    return allMembers.filter(
      (member) =>
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        (member.fullName || '').toLowerCase().includes(searchLower) ||
        (member.email || '').toLowerCase().includes(searchLower) ||
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
          (member.email || '').toLowerCase().includes(options.search!.toLowerCase())
      );
    }

    return results;
  }

  /**
   * Get paginated member directory with proper pagination support
   */
  async getMemberDirectoryPaginated(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'visitor';
    role?: 'admin' | 'pastor' | 'member';
    orderBy?: 'name' | 'email' | 'status' | 'role';
    orderDirection?: 'asc' | 'desc';
  }): Promise<{
    data: Member[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;

    // Build where conditions
    const whereConditions: {
      field: string;
      operator: WhereFilterOp;
      value: string | number | boolean | Timestamp | string[] | number[];
    }[] = [];

    // Add filters
    if (options?.status) {
      whereConditions.push({
        field: 'memberStatus',
        operator: '==',
        value: options.status,
      });
    }

    if (options?.role) {
      whereConditions.push({
        field: 'role',
        operator: '==',
        value: options.role,
      });
    }


    // Build order by
    const orderBy = {
      field:
        options?.orderBy === 'name'
          ? 'fullName'
          : options?.orderBy || 'fullName',
      direction: (options?.orderDirection || 'asc') as 'asc' | 'desc',
    };

    // For search, we need to handle it differently since Firestore doesn't support
    // text search natively. We'll get all matching records and filter client-side
    // then paginate the results
    if (options?.search) {
      // Get all matching records for search
      const searchResults = await this.getMemberDirectory({
        search: options.search,
        status: options?.status,
        role: options?.role,
        orderBy: options?.orderBy,
        orderDirection: options?.orderDirection,
        limit: 1000, // Reasonable upper limit for search
      });

      // Calculate pagination on client side for search results
      const totalCount = searchResults.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const data = searchResults.slice(startIndex, endIndex);

      return {
        data,
        totalCount,
        currentPage: page,
        totalPages,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }

    // Use server-side pagination for non-search queries
    const result = await this.getPaginated({
      page,
      limit,
      where: whereConditions,
      orderBy,
    });

    return result;
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
    includeHouseholdInfo?: boolean;
  }): Promise<Member[]> {
    const members = await this.getMemberDirectory(options);

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

    return {
      total,
      active,
      inactive,
      visitors,
      admins,
      pastors,
      members,
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

  // ============================================================================
  // FIELD MAPPING CRUD METHODS
  // ============================================================================

  async create(memberData: Omit<Member, 'id'>): Promise<Member> {
    try {
      console.log('🔧 MembersService.create called with:', memberData);
      
      // Use deep field mapper for nested objects (emails, phones, addresses)
      const firestoreData = toFirestoreFieldsDeep({
        ...memberData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('🔧 Converted to Firestore format:', firestoreData);

      const docRef = await addDoc(collection(db, 'members'), firestoreData);
      console.log('🔧 Member created with ID:', docRef.id);
      
      // Fetch and return the created member using proper converter
      const createdMember = await this.getById(docRef.id);
      if (!createdMember) {
        throw new Error('Failed to fetch created member');
      }
      
      console.log('🔧 Returning created member:', createdMember);
      return createdMember;
    } catch (error) {
      console.error('💥 Error in MembersService.create:', error);
      throw new Error(`Failed to create member: ${(error as Error).message}`);
    }
  }

  async getById(id: string): Promise<Member | null> {
    try {
      const docSnap = await getDoc(doc(db, 'members', id));

      if (!docSnap.exists()) {
        return null;
      }

      // Use the proper converter to transform MemberDocument to Member
      return memberDocumentToMember(docSnap.id, docSnap.data() as MemberDocument);
    } catch (error) {
      console.error('Error fetching member:', error);
      throw new Error(`Failed to fetch member: ${(error as Error).message}`);
    }
  }

  async update(id: string, updates: Partial<Member>): Promise<void> {
    try {
      // Remove computed fields and id
      const { fullName, id: _, ...updateData } = updates;

      // Use deep field mapper for nested objects (emails, phones, addresses)
      const firestoreData = toFirestoreFieldsDeep({
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      console.log('🔧 Update data converted to Firestore format:', firestoreData);
      await updateDoc(doc(db, 'members', id), firestoreData);
      console.log('Member updated:', id);
    } catch (error) {
      console.error('Error updating member:', error);
      throw new Error(`Failed to update member: ${(error as Error).message}`);
    }
  }

  async getAll(): Promise<Member[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'members'));

      return querySnapshot.docs.map((doc) => {
        const data = fromFirestoreFieldsDeep<Member>(doc.data());
        return {
          ...data,
          id: doc.id,
          fullName: `${data.firstName} ${data.lastName}`.trim(),
        };
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      throw new Error(`Failed to fetch members: ${(error as Error).message}`);
    }
  }
}

// Create and export singleton instance
export const membersService = new MembersService();
