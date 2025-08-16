import { registrationTokensService } from './registration-tokens.service';
import { publicRegistrationService } from './public-registration.service';
import { PendingRegistration, RegistrationToken } from '../../types/firestore';
import { startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

export interface RegistrationAnalytics {
  overview: {
    totalTokens: number;
    activeTokens: number;
    totalRegistrations: number;
    pendingApprovals: number;
    approvedRegistrations: number;
    rejectedRegistrations: number;
    conversionRate: number; // approved / total submitted
  };
  registrationsByDate: Array<{
    date: string;
    registrations: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  registrationsByTime: Array<{
    hour: number;
    registrations: number;
  }>;
  visitorVsMember: {
    visitors: number;
    members: number;
  };
  tokenUsageStats: Array<{
    tokenId: string;
    purpose: string;
    totalRegistrations: number;
    pendingApprovals: number;
    approvedRegistrations: number;
    conversionRate: number;
    createdAt: string;
    isActive: boolean;
  }>;
  geographicDistribution: Array<{
    state: string;
    city: string;
    count: number;
  }>;
  peakRegistrationTimes: Array<{
    dayOfWeek: string;
    hour: number;
    count: number;
  }>;
}

class AnalyticsService {
  /**
   * Get comprehensive registration analytics
   */
  async getRegistrationAnalytics(dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<RegistrationAnalytics> {
    try {
      // Set default date range (last 30 days)
      const defaultEndDate = new Date();
      const defaultStartDate = subDays(defaultEndDate, 30);

      const startDate = dateRange?.startDate
        ? parseISO(dateRange.startDate)
        : defaultStartDate;
      const endDate = dateRange?.endDate
        ? parseISO(dateRange.endDate)
        : defaultEndDate;

      // Fetch all data in parallel
      const [tokens, allRegistrations] = await Promise.all([
        registrationTokensService.getAll(),
        publicRegistrationService.getAll(),
      ]);

      // Filter registrations by date range
      const registrations = allRegistrations.filter((reg) => {
        const submittedDate = parseISO(reg.submittedAt);
        return (
          submittedDate >= startOfDay(startDate) &&
          submittedDate <= endOfDay(endDate)
        );
      });

      // Calculate overview metrics
      const overview = this.calculateOverview(tokens, registrations);

      // Calculate various analytics
      const registrationsByDate = this.calculateRegistrationsByDate(
        registrations,
        startDate,
        endDate
      );
      const registrationsByTime =
        this.calculateRegistrationsByTime(registrations);
      const visitorVsMember = this.calculateVisitorVsMember(registrations);
      const tokenUsageStats = this.calculateTokenUsageStats(
        tokens,
        allRegistrations
      );
      const geographicDistribution =
        this.calculateGeographicDistribution(registrations);
      const peakRegistrationTimes =
        this.calculatePeakRegistrationTimes(allRegistrations);

      return {
        overview,
        registrationsByDate,
        registrationsByTime,
        visitorVsMember,
        tokenUsageStats,
        geographicDistribution,
        peakRegistrationTimes,
      };
    } catch (error) {
      console.error('Error getting registration analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate overview statistics
   */
  private calculateOverview(
    tokens: RegistrationToken[],
    registrations: PendingRegistration[]
  ) {
    const activeTokens = tokens.filter((token) => token.isActive).length;
    const pendingApprovals = registrations.filter(
      (reg) => reg.approvalStatus === 'pending'
    ).length;
    const approvedRegistrations = registrations.filter(
      (reg) => reg.approvalStatus === 'approved'
    ).length;
    const rejectedRegistrations = registrations.filter(
      (reg) => reg.approvalStatus === 'rejected'
    ).length;
    const totalSubmitted = registrations.length;
    const conversionRate =
      totalSubmitted > 0 ? (approvedRegistrations / totalSubmitted) * 100 : 0;

    return {
      totalTokens: tokens.length,
      activeTokens,
      totalRegistrations: totalSubmitted,
      pendingApprovals,
      approvedRegistrations,
      rejectedRegistrations,
      conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Calculate registrations by date
   */
  private calculateRegistrationsByDate(
    registrations: PendingRegistration[],
    startDate: Date,
    endDate: Date
  ) {
    const dateMap = new Map<
      string,
      {
        registrations: number;
        approved: number;
        rejected: number;
        pending: number;
      }
    >();

    // Initialize all dates in range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      dateMap.set(dateKey, {
        registrations: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      });
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Populate with actual data
    registrations.forEach((reg) => {
      const dateKey = format(parseISO(reg.submittedAt), 'yyyy-MM-dd');
      const dayData = dateMap.get(dateKey);
      if (dayData) {
        dayData.registrations++;
        if (reg.approvalStatus === 'approved') dayData.approved++;
        else if (reg.approvalStatus === 'rejected') dayData.rejected++;
        else dayData.pending++;
      }
    });

    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  /**
   * Calculate registrations by hour of day
   */
  private calculateRegistrationsByTime(registrations: PendingRegistration[]) {
    const hourMap = new Map<number, number>();

    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourMap.set(hour, 0);
    }

    // Count registrations by hour
    registrations.forEach((reg) => {
      const hour = parseISO(reg.submittedAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    return Array.from(hourMap.entries()).map(([hour, registrations]) => ({
      hour,
      registrations,
    }));
  }

  /**
   * Calculate visitor vs member distribution
   */
  private calculateVisitorVsMember(registrations: PendingRegistration[]) {
    const visitors = registrations.filter(
      (reg) => reg.memberStatus === 'visitor'
    ).length;
    const members = registrations.filter(
      (reg) => reg.memberStatus === 'member'
    ).length;

    return { visitors, members };
  }

  /**
   * Calculate token usage statistics
   */
  private calculateTokenUsageStats(
    tokens: RegistrationToken[],
    allRegistrations: PendingRegistration[]
  ) {
    return tokens
      .map((token) => {
        const tokenRegistrations = allRegistrations.filter(
          (reg) => reg.tokenId === token.id
        );
        const pendingApprovals = tokenRegistrations.filter(
          (reg) => reg.approvalStatus === 'pending'
        ).length;
        const approvedRegistrations = tokenRegistrations.filter(
          (reg) => reg.approvalStatus === 'approved'
        ).length;
        const totalRegistrations = tokenRegistrations.length;
        const conversionRate =
          totalRegistrations > 0
            ? (approvedRegistrations / totalRegistrations) * 100
            : 0;

        return {
          tokenId: token.id,
          purpose: token.metadata.purpose,
          totalRegistrations,
          pendingApprovals,
          approvedRegistrations,
          conversionRate: Math.round(conversionRate * 100) / 100,
          createdAt: token.createdAt,
          isActive: token.isActive,
        };
      })
      .sort((a, b) => b.totalRegistrations - a.totalRegistrations); // Sort by most used
  }

  /**
   * Calculate geographic distribution
   */
  private calculateGeographicDistribution(
    registrations: PendingRegistration[]
  ) {
    const locationMap = new Map<string, number>();

    registrations.forEach((reg) => {
      if (reg.address?.state && reg.address?.city) {
        const key = `${reg.address.state}|${reg.address.city}`;
        locationMap.set(key, (locationMap.get(key) || 0) + 1);
      }
    });

    return Array.from(locationMap.entries())
      .map(([location, count]) => {
        const [state, city] = location.split('|');
        return { state, city, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 locations
  }

  /**
   * Calculate peak registration times
   */
  private calculatePeakRegistrationTimes(registrations: PendingRegistration[]) {
    const timeMap = new Map<string, number>();
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    registrations.forEach((reg) => {
      const date = parseISO(reg.submittedAt);
      const dayOfWeek = dayNames[date.getDay()];
      const hour = date.getHours();
      const key = `${dayOfWeek}|${hour}`;
      timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });

    return Array.from(timeMap.entries())
      .map(([timeKey, count]) => {
        const [dayOfWeek, hourStr] = timeKey.split('|');
        return { dayOfWeek, hour: parseInt(hourStr), count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 peak times
  }

  /**
   * Get registration trends over time
   */
  async getRegistrationTrends(days: number = 30): Promise<
    Array<{
      date: string;
      registrations: number;
      cumulativeRegistrations: number;
    }>
  > {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const registrations =
        await publicRegistrationService.getRegistrationsByDateRange(
          startDate.toISOString(),
          endDate.toISOString()
        );

      const dailyCounts = this.calculateRegistrationsByDate(
        registrations,
        startDate,
        endDate
      );
      let cumulative = 0;

      return dailyCounts.map((day) => {
        cumulative += day.registrations;
        return {
          date: day.date,
          registrations: day.registrations,
          cumulativeRegistrations: cumulative,
        };
      });
    } catch (error) {
      console.error('Error getting registration trends:', error);
      throw error;
    }
  }

  /**
   * Get top performing tokens
   */
  async getTopPerformingTokens(limit: number = 10): Promise<
    Array<{
      tokenId: string;
      purpose: string;
      registrations: number;
      conversionRate: number;
      createdAt: string;
    }>
  > {
    try {
      const [tokens, registrations] = await Promise.all([
        registrationTokensService.getAll(),
        publicRegistrationService.getAll(),
      ]);

      const tokenStats = this.calculateTokenUsageStats(tokens, registrations);

      return tokenStats.slice(0, limit).map((stat) => ({
        tokenId: stat.tokenId,
        purpose: stat.purpose,
        registrations: stat.totalRegistrations,
        conversionRate: stat.conversionRate,
        createdAt: stat.createdAt,
      }));
    } catch (error) {
      console.error('Error getting top performing tokens:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
