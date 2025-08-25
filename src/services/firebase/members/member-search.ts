import { Member } from '../../../types';
import { QueryOptions } from '../../../types/firestore';

export class MemberSearch {
  /**
   * Search members by name or email (client-side filtering)
   */
  static searchMembers(
    members: Member[],
    searchTerm: string
  ): Member[] {
    const searchLower = searchTerm.toLowerCase();
    return members.filter(
      (member) =>
        member.firstName.toLowerCase().includes(searchLower) ||
        member.lastName.toLowerCase().includes(searchLower) ||
        (member.fullName || '').toLowerCase().includes(searchLower) ||
        (member.email || '').toLowerCase().includes(searchLower) ||
        (member.phone && member.phone.includes(searchTerm)) ||
        // Search in enhanced email arrays
        (member.emails &&
          member.emails.some((email) =>
            email.address.toLowerCase().includes(searchLower)
          ))
    );
  }

  /**
   * Build query options for member directory
   */
  static buildDirectoryQuery(options?: {
    status?: 'active' | 'inactive' | 'visitor';
    role?: 'admin' | 'pastor' | 'member';
    limit?: number;
    orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role';
    orderDirection?: 'asc' | 'desc';
  }): QueryOptions {
    const queryOptions: QueryOptions = {
      where: [],
      limit: options?.limit || 50,
      orderBy: {
        field: 'lastName', // Default to lastName for better alphabetical sorting
        direction: options?.orderDirection || 'asc',
      },
    };

    // Build order by field with support for lastName and firstName
    switch (options?.orderBy) {
      case 'name':
      case 'lastName':
        queryOptions.orderBy!.field = 'lastName';
        break;
      case 'firstName':
        queryOptions.orderBy!.field = 'firstName';
        break;
      case 'email':
        queryOptions.orderBy!.field = 'email';
        break;
      case 'status':
        queryOptions.orderBy!.field = 'memberStatus';
        break;
      case 'role':
        queryOptions.orderBy!.field = 'role';
        break;
      default:
        queryOptions.orderBy!.field = 'lastName';
    }

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

    return queryOptions;
  }

  /**
   * Sort members with compound sorting logic
   */
  static sortMembers(
    members: Member[],
    orderBy?: 'name' | 'lastName' | 'firstName' | 'email' | 'status' | 'role',
    orderDirection: 'asc' | 'desc' = 'asc'
  ): Member[] {
    return members.sort((a, b) => {
      let aValue: string = '';
      let bValue: string = '';

      switch (orderBy) {
        case 'name':
        case 'lastName':
          aValue = (a.lastName || '').toLowerCase();
          bValue = (b.lastName || '').toLowerCase();
          
          // Secondary sort by firstName if lastName is the same
          if (aValue === bValue) {
            aValue = (a.firstName || '').toLowerCase();
            bValue = (b.firstName || '').toLowerCase();
          }
          break;
        case 'firstName':
          aValue = (a.firstName || '').toLowerCase();
          bValue = (b.firstName || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.memberStatus || 'active').toLowerCase();
          bValue = (b.memberStatus || 'active').toLowerCase();
          break;
        case 'role':
          aValue = (a.role || 'member').toLowerCase();
          bValue = (b.role || 'member').toLowerCase();
          break;
        default:
          // Default to lastName with firstName as secondary
          aValue = (a.lastName || '').toLowerCase();
          bValue = (b.lastName || '').toLowerCase();
          if (aValue === bValue) {
            aValue = (a.firstName || '').toLowerCase();
            bValue = (b.firstName || '').toLowerCase();
          }
      }

      const result = aValue.localeCompare(bValue);
      return orderDirection === 'desc' ? -result : result;
    });
  }
}