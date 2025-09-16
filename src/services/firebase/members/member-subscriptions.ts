import { Member } from '../../../types';
import { QueryOptions } from '../../../types/firestore';

export class MemberSubscriptions {
  constructor(
    private subscribeToCollection: (
      options?: QueryOptions,
      callback?: (data: Member[]) => void
    ) => () => void
  ) {}

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
      orderBy: { field: 'lastName', direction: 'asc' }, // Changed from 'fullName' to 'lastName'
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
        orderBy: { field: 'lastName', direction: 'asc' }, // Changed from 'fullName' to 'lastName'
      },
      callback
    );
  }

  /**
   * Subscribe to members by role
   */
  subscribeToMembersByRole(
    role: 'admin' | 'pastor' | 'member',
    callback: (members: Member[]) => void
  ): () => void {
    return this.subscribeToCollection(
      {
        where: [{ field: 'role', operator: '==', value: role }],
        orderBy: { field: 'lastName', direction: 'asc' },
      },
      callback
    );
  }

  /**
   * Subscribe to members by status
   */
  subscribeToMembersByStatus(
    status: 'active' | 'inactive' | 'visitor',
    callback: (members: Member[]) => void
  ): () => void {
    return this.subscribeToCollection(
      {
        where: [{ field: 'memberStatus', operator: '==', value: status }],
        orderBy: { field: 'lastName', direction: 'asc' },
      },
      callback
    );
  }

  /**
   * Subscribe to recent members (joined in the last 30 days)
   */
  subscribeToRecentMembers(
    callback: (members: Member[]) => void,
    daysBack: number = 30
  ): () => void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return this.subscribeToCollection(
      {
        where: [
          {
            field: 'joinedAt',
            operator: '>=',
            value: cutoffDate.toISOString(),
          },
        ],
        orderBy: { field: 'joinedAt', direction: 'desc' },
        limit: 50,
      },
      callback
    );
  }

  /**
   * Subscribe to members with birthdays in current month
   */
  subscribeToMembersWithBirthdaysThisMonth(
    callback: (members: Member[]) => void
  ): () => void {
    // Note: This is a simple implementation. For production, you might want to use
    // a more sophisticated approach with Firestore compound queries
    return this.subscribeToCollection(
      {
        orderBy: { field: 'birthdate', direction: 'asc' },
      },
      (members) => {
        const currentMonth = new Date().getMonth();
        const filteredMembers = members.filter((member) => {
          if (!member.birthdate) return false;
          const birthMonth = new Date(member.birthdate).getMonth();
          return birthMonth === currentMonth;
        });
        callback(filteredMembers);
      }
    );
  }
}
