import { Member } from '../../../types';

export interface MemberStatistics {
  total: number;
  active: number;
  inactive: number;
  visitors: number;
  admins: number;
  pastors: number;
  members: number;
}

export class MemberStatisticsCalculator {
  constructor(
    private countWithFilter: (filter: {
      field: string;
      operator: string;
      value: string;
    }) => Promise<number>,
    private countAll: () => Promise<number>
  ) {}

  /**
   * Get member statistics from database queries
   */
  async getStatistics(): Promise<MemberStatistics> {
    const [total, active, inactive, visitors, admins, pastors, members] =
      await Promise.all([
        this.countAll(),
        this.countWithFilter({
          field: 'memberStatus',
          operator: '==',
          value: 'active',
        }),
        this.countWithFilter({
          field: 'memberStatus',
          operator: '==',
          value: 'inactive',
        }),
        this.countWithFilter({
          field: 'memberStatus',
          operator: '==',
          value: 'visitor',
        }),
        this.countWithFilter({ field: 'role', operator: '==', value: 'admin' }),
        this.countWithFilter({
          field: 'role',
          operator: '==',
          value: 'pastor',
        }),
        this.countWithFilter({
          field: 'role',
          operator: '==',
          value: 'member',
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

  /**
   * Calculate statistics from an array of members (for client-side calculation)
   */
  static calculateFromMembers(members: Member[]): MemberStatistics {
    const stats: MemberStatistics = {
      total: members.length,
      active: 0,
      inactive: 0,
      visitors: 0,
      admins: 0,
      pastors: 0,
      members: 0,
    };

    members.forEach((member) => {
      // Count by status
      switch (member.memberStatus) {
        case 'active':
          stats.active++;
          break;
        case 'inactive':
          stats.inactive++;
          break;
        case 'visitor':
          stats.visitors++;
          break;
      }

      // Count by role
      switch (member.role) {
        case 'admin':
          stats.admins++;
          break;
        case 'pastor':
          stats.pastors++;
          break;
        case 'member':
        default:
          stats.members++;
          break;
      }
    });

    return stats;
  }

  /**
   * Generate a summary report of member statistics
   */
  static generateSummaryReport(stats: MemberStatistics): string {
    const activePercentage =
      stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0';
    const visitorPercentage =
      stats.total > 0 ? ((stats.visitors / stats.total) * 100).toFixed(1) : '0';

    return `
Member Statistics Summary:
- Total Members: ${stats.total}
- Active: ${stats.active} (${activePercentage}%)
- Inactive: ${stats.inactive}
- Visitors: ${stats.visitors} (${visitorPercentage}%)

Role Distribution:
- Admins: ${stats.admins}
- Pastors: ${stats.pastors}
- Members: ${stats.members}
    `.trim();
  }

  /**
   * Get statistics for a specific time period (requires date fields in the data)
   */
  static getStatisticsForPeriod(
    members: Member[],
    startDate: Date,
    endDate: Date,
    dateField: 'createdAt' | 'joinedAt' = 'createdAt'
  ): MemberStatistics {
    const periodMembers = members.filter((member) => {
      const memberDate = member[dateField] ? new Date(member[dateField]) : null;
      return memberDate && memberDate >= startDate && memberDate <= endDate;
    });

    return this.calculateFromMembers(periodMembers);
  }
}
