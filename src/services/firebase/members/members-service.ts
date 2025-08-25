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
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { BaseFirestoreService } from '../base.service';
import { PaginationParams } from '../base/firestore-queries';
import {
  MemberDocument,
  COLLECTIONS,
  QueryOptions,
} from '../../../types/firestore';
import { Member } from '../../../types';
import {
  memberDocumentToMember,
  memberToMemberDocument,
} from '../../../utils/firestore-converters';
import {
  toFirestoreFieldsDeep,
  fromFirestoreFieldsDeep,
} from '../../../utils/firestore-field-mapper';

// Import composition modules
import { MemberSearch } from './member-search';
import { MemberBulkOperations, ImportResult } from './member-bulk-operations';
import { MemberStatisticsCalculator, MemberStatistics } from './member-statistics';
import { MemberSubscriptions } from './member-subscriptions';
import { MemberPagination, PaginatedResult } from './member-pagination';

export class MembersService extends BaseFirestoreService<
  MemberDocument,
  Member
> {
  // Composition modules
  private bulkOperations: MemberBulkOperations;
  private statistics: MemberStatisticsCalculator;
  private subscriptions: MemberSubscriptions;
  private pagination: MemberPagination;

  constructor() {
    super(
      db,
      COLLECTIONS.MEMBERS,
      (id: string, document: MemberDocument) => memberDocumentToMember(id, document),
      (client: Partial<Member>) => memberToMemberDocument(client)
    );

    // Initialize composition modules
    this.bulkOperations = new MemberBulkOperations(
      (data) => this.create(data),
      (email) => this.getByEmail(email)
    );

    this.statistics = new MemberStatisticsCalculator(
      (filter) => this.count({
        where: [{ field: filter.field, operator: filter.operator as any, value: filter.value }],
      }),
      () => this.count()
    );

    this.subscriptions = new MemberSubscriptions(
      (options, callback) => this.subscribeToCollection(options, callback)
    );

    this.pagination = new MemberPagination(
      (options) => this.getMemberDirectory(options),
      async (options) => {
        // Convert base service parameters to QueryConstraint format
        const constraints: QueryConstraint[] = [];
        const pagination: PaginationParams = {};

        // Add where conditions
        if (options.where) {
          options.where.forEach(({ field, operator, value }) => {
            constraints.push(where(field, operator as any, value));
          });
        }

        // Add ordering
        if (options.orderBy) {
          constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
        }

        // Add pagination
        if (options.limit) {
          pagination.limit = options.limit;
        }

        // Call base getPaginated method
        const queryResult = await this.getPaginated(constraints, pagination);
        
        // Convert QueryResult to PaginatedResult
        const page = options.page || 1;
        const limit = options.limit || 10;
        const totalCount = queryResult.total || queryResult.items.length;
        const totalPages = Math.ceil(totalCount / limit);
        
        return {
          data: queryResult.items,
          totalCount,
          currentPage: page,
          totalPages,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        };
      }
    );
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
   * Search members by name or email (delegated to MemberSearch)
   */
  async search(searchTerm: string, options?: QueryOptions): Promise<Member[]> {
    const allMembers = await this.getAll(options);
    return MemberSearch.searchMembers(allMembers, searchTerm);
  }

  // ============================================================================
  // DIRECTORY OPERATIONS (using composition modules)
  // ============================================================================

  /**
   * Get member directory with pagination and filtering
   */
  async getMemberDirectory(options?: {
    search?: string;
    status?: 'active' | 'inactive' | 'visitor';
    role?: 'admin' | 'pastor' | 'member';
    limit?: number;
    orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role';
    orderDirection?: 'asc' | 'desc';
  }): Promise<Member[]> {
    // Build query using MemberSearch utility
    const queryOptions = MemberSearch.buildDirectoryQuery(options);
    let results = await this.getAll(queryOptions);

    // Apply client-side search filter if provided
    if (options?.search) {
      results = MemberSearch.searchMembers(results, options.search);
    }

    // Apply client-side sorting for compound sorting
    return MemberSearch.sortMembers(
      results,
      options?.orderBy,
      options?.orderDirection
    );
  }

  /**
   * Get paginated member directory (delegated to MemberPagination)
   */
  async getMemberDirectoryPaginated(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'visitor';
    role?: 'admin' | 'pastor' | 'member';
    orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role';
    orderDirection?: 'asc' | 'desc';
  }): Promise<PaginatedResult<Member>> {
    return this.pagination.getMemberDirectoryPaginated(options);
  }

  // ============================================================================
  // BULK OPERATIONS (delegated to MemberBulkOperations)
  // ============================================================================

  /**
   * Import members from CSV or other sources
   */
  async importMembers(membersData: Partial<Member>[]): Promise<ImportResult> {
    return this.bulkOperations.importMembers(membersData);
  }

  /**
   * Import members in batches
   */
  async importMembersInBatches(
    membersData: Partial<Member>[],
    batchSize: number = 10
  ): Promise<ImportResult> {
    return this.bulkOperations.importMembersInBatches(membersData, batchSize);
  }

  /**
   * Export members to a format suitable for CSV
   */
  async exportMembers(options?: {
    status?: 'active' | 'inactive' | 'visitor';
    role?: 'admin' | 'pastor' | 'member';
    includeHouseholdInfo?: boolean;
  }): Promise<Partial<Member>[]> {
    const members = await this.getMemberDirectory(options);
    return MemberBulkOperations.exportMembers(members, options);
  }

  // ============================================================================
  // STATISTICS (delegated to MemberStatisticsCalculator)
  // ============================================================================

  /**
   * Get member statistics
   */
  async getStatistics(): Promise<MemberStatistics> {
    return this.statistics.getStatistics();
  }

  // ============================================================================
  // SUBSCRIPTIONS (delegated to MemberSubscriptions)
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
    return this.subscriptions.subscribeToMemberDirectory(options, callback);
  }

  /**
   * Subscribe to household members
   */
  subscribeToHouseholdMembers(
    householdId: string,
    callback: (members: Member[]) => void
  ): () => void {
    return this.subscriptions.subscribeToHouseholdMembers(householdId, callback);
  }

  /**
   * Subscribe to members by role
   */
  subscribeToMembersByRole(
    role: 'admin' | 'pastor' | 'member',
    callback: (members: Member[]) => void
  ): () => void {
    return this.subscriptions.subscribeToMembersByRole(role, callback);
  }

  /**
   * Subscribe to members by status
   */
  subscribeToMembersByStatus(
    status: 'active' | 'inactive' | 'visitor',
    callback: (members: Member[]) => void
  ): () => void {
    return this.subscriptions.subscribeToMembersByStatus(status, callback);
  }

  // ============================================================================
  // FIELD MAPPING CRUD METHODS (legacy support)
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
      throw new Error('Failed to create member: ' + (error as Error).message);
    }
  }

  async getById(id: string): Promise<Member | null> {
    try {
      const docSnap = await getDoc(doc(db, 'members', id));

      if (!docSnap.exists()) {
        return null;
      }

      // Use the proper converter to transform MemberDocument to Member
      return memberDocumentToMember(
        docSnap.id,
        docSnap.data() as MemberDocument
      );
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

      console.log(
        '🔧 Update data converted to Firestore format:',
        firestoreData
      );
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