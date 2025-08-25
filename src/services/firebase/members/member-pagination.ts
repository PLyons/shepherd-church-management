import { Timestamp, WhereFilterOp } from 'firebase/firestore';
import { Member } from '../../../types';
import { MemberSearch } from './member-search';

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class MemberPagination {
  constructor(
    private getMemberDirectory: (options?: {
      search?: string;
      status?: 'active' | 'inactive' | 'visitor';
      role?: 'admin' | 'pastor' | 'member';
      limit?: number;
      orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role';
      orderDirection?: 'asc' | 'desc';
    }) => Promise<Member[]>,
    private getPaginatedBase: (options: {
      page?: number;
      limit?: number;
      where?: {
        field: string;
        operator: WhereFilterOp;
        value: string | number | boolean | Timestamp | string[] | number[];
      }[];
      orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
      };
    }) => Promise<PaginatedResult<Member>>
  ) {}

  /**
   * Get paginated member directory with proper pagination support
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
    const page = options?.page || 1;
    const limit = options?.limit || 10;

    // For search queries, we handle pagination client-side since Firestore
    // doesn't support full-text search natively
    if (options?.search) {
      return this.handleSearchPagination(options, page, limit);
    }

    // Use server-side pagination for non-search queries
    return this.handleServerSidePagination(options, page, limit);
  }

  /**
   * Handle client-side pagination for search results
   */
  private async handleSearchPagination(
    options: {
      search: string;
      status?: 'active' | 'inactive' | 'visitor';
      role?: 'admin' | 'pastor' | 'member';
      orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role';
      orderDirection?: 'asc' | 'desc';
    },
    page: number,
    limit: number
  ): Promise<PaginatedResult<Member>> {
    // Get all matching records for search
    const searchResults = await this.getMemberDirectory({
      search: options.search,
      status: options.status,
      role: options.role,
      orderBy: options.orderBy,
      orderDirection: options.orderDirection,
      limit: 1000, // Reasonable upper limit for search
    });

    // Sort results using MemberSearch utility
    const sortedResults = MemberSearch.sortMembers(
      searchResults,
      options.orderBy,
      options.orderDirection
    );

    // Calculate pagination on client side for search results
    const totalCount = sortedResults.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = sortedResults.slice(startIndex, endIndex);

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

  /**
   * Handle server-side pagination for filtered queries
   */
  private async handleServerSidePagination(
    options?: {
      status?: 'active' | 'inactive' | 'visitor';
      role?: 'admin' | 'pastor' | 'member';
      orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role';
      orderDirection?: 'asc' | 'desc';
    },
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Member>> {
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

    // Build order by with support for lastName and firstName
    const orderByField = this.getOrderByField(options?.orderBy);
    const orderBy = {
      field: orderByField,
      direction: (options?.orderDirection || 'asc') as 'asc' | 'desc',
    };

    // Use base pagination method
    return this.getPaginatedBase({
      page,
      limit,
      where: whereConditions,
      orderBy,
    });
  }

  /**
   * Map frontend order by options to database field names
   */
  private getOrderByField(orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role'): string {
    switch (orderBy) {
      case 'name':
      case 'lastName':
        return 'lastName';
      case 'firstName':
        return 'firstName';
      case 'email':
        return 'email';
      case 'status':
        return 'memberStatus';
      case 'role':
        return 'role';
      default:
        return 'lastName'; // Default to lastName for alphabetical sorting
    }
  }

  /**
   * Get pagination metadata without data (useful for UI components)
   */
  static getPaginationMetadata(
    totalCount: number,
    currentPage: number,
    pageSize: number
  ): {
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startIndex: number;
    endIndex: number;
  } {
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);

    return {
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex,
      endIndex,
    };
  }
}