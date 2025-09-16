import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { FinancialReports } from '../FinancialReports';
import { donationsService } from '../../../services/firebase/donations.service';
import { donationCategoriesService } from '../../../services/firebase/donation-categories.service';
import { Donation, DonationCategory } from '../../../types/donations';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase services
vi.mock('../../../services/firebase/donations.service');
vi.mock('../../../services/firebase/donation-categories.service');

const mockDonationsService = vi.mocked(donationsService);
const mockDonationCategoriesService = vi.mocked(donationCategoriesService);

// Mock real-time subscription
const mockUnsubscribe = vi.fn();

// Mock data for analytics testing
const mockTrendData: Donation[] = [
  {
    id: 'donation1',
    memberId: 'member1',
    amount: 500,
    method: 'check',
    categoryId: 'tithe',
    date: Timestamp.fromDate(new Date('2024-01-15')),
    isAnonymous: false,
    isTaxDeductible: true,
    notes: '',
    receipt: { requested: true, email: 'test@example.com', mailed: false },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'donation2',
    memberId: 'member2',
    amount: 1000,
    method: 'cash',
    categoryId: 'offering',
    date: Timestamp.fromDate(new Date('2024-01-22')),
    isAnonymous: false,
    isTaxDeductible: true,
    notes: '',
    receipt: { requested: false },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'donation3',
    memberId: 'member1',
    amount: 750,
    method: 'online',
    categoryId: 'tithe',
    date: Timestamp.fromDate(new Date('2024-02-10')),
    isAnonymous: false,
    isTaxDeductible: true,
    notes: '',
    receipt: { requested: true, email: 'test@example.com', mailed: false },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'donation4',
    memberId: 'member3',
    amount: 300,
    method: 'check',
    categoryId: 'missions',
    date: Timestamp.fromDate(new Date('2024-02-20')),
    isAnonymous: true,
    isTaxDeductible: true,
    notes: '',
    receipt: { requested: false },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'donation5',
    memberId: 'member2',
    amount: 1200,
    method: 'online',
    categoryId: 'tithe',
    date: Timestamp.fromDate(new Date('2024-03-05')),
    isAnonymous: false,
    isTaxDeductible: true,
    notes: '',
    receipt: { requested: true, email: 'donor2@example.com', mailed: false },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'donation6',
    memberId: 'member4',
    amount: 2000,
    method: 'check',
    categoryId: 'building',
    date: Timestamp.fromDate(new Date('2024-03-15')),
    isAnonymous: false,
    isTaxDeductible: true,
    notes: 'Capital campaign',
    receipt: { requested: true, email: 'donor4@example.com', mailed: true },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

const mockCategories: DonationCategory[] = [
  {
    id: 'tithe',
    name: 'Tithe',
    description: 'Regular tithe',
    isActive: true,
    isTaxDeductible: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'offering',
    name: 'Offering',
    description: 'Special offerings',
    isActive: true,
    isTaxDeductible: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'missions',
    name: 'Missions',
    description: 'Missions support',
    isActive: true,
    isTaxDeductible: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'building',
    name: 'Building Fund',
    description: 'Building fund',
    isActive: true,
    isTaxDeductible: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

// Previous year data for YoY comparisons
const mockPreviousYearData: Donation[] = [
  {
    id: 'prev1',
    memberId: 'member1',
    amount: 400,
    method: 'check',
    categoryId: 'tithe',
    date: Timestamp.fromDate(new Date('2023-01-15')),
    isAnonymous: false,
    isTaxDeductible: true,
    notes: '',
    receipt: { requested: true, email: 'test@example.com', mailed: false },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: 'prev2',
    memberId: 'member2',
    amount: 800,
    method: 'cash',
    categoryId: 'offering',
    date: Timestamp.fromDate(new Date('2023-02-10')),
    isAnonymous: false,
    isTaxDeductible: true,
    notes: '',
    receipt: { requested: false },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

describe('FinancialReports - Advanced Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDonationCategoriesService.getAll.mockResolvedValue(mockCategories);
    mockDonationsService.getAll.mockResolvedValue(mockTrendData);
    mockDonationsService.subscribeToChanges.mockReturnValue(mockUnsubscribe);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Donation Trends Calculations', () => {
    it('should calculate monthly donation trends accurately', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('monthly-trends-chart')).toBeInTheDocument();
      });

      // Verify January trend: $1,500 total, 2 donations, $750 average
      expect(screen.getByText('Jan 2024')).toBeInTheDocument();
      expect(screen.getByText('$1,500')).toBeInTheDocument();

      // Verify February trend: $1,050 total, 2 donations, $525 average
      expect(screen.getByText('Feb 2024')).toBeInTheDocument();
      expect(screen.getByText('$1,050')).toBeInTheDocument();

      // Verify March trend: $3,200 total, 2 donations, $1,600 average
      expect(screen.getByText('Mar 2024')).toBeInTheDocument();
      expect(screen.getByText('$3,200')).toBeInTheDocument();
    });

    it('should identify seasonal giving patterns', async () => {
      const seasonalData = [
        ...mockTrendData,
        // Add more December data for seasonal testing
        {
          id: 'seasonal1',
          memberId: 'member1',
          amount: 5000,
          method: 'online',
          categoryId: 'tithe',
          date: Timestamp.fromDate(new Date('2023-12-25')),
          isAnonymous: false,
          isTaxDeductible: true,
          notes: 'Year-end giving',
          receipt: {
            requested: true,
            email: 'test@example.com',
            mailed: false,
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      mockDonationsService.getAll.mockResolvedValue(seasonalData);
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('seasonal-patterns')).toBeInTheDocument();
      });

      // Should identify December as peak season
      expect(screen.getByText('Peak Season: December')).toBeInTheDocument();
      expect(
        screen.getByText('Year-end giving surge detected')
      ).toBeInTheDocument();
    });

    it('should compute growth rate percentages correctly', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('growth-metrics')).toBeInTheDocument();
      });

      // Feb to March growth: (3200 - 1050) / 1050 = 204.76%
      expect(screen.getByText('204.8%')).toBeInTheDocument();
      expect(screen.getByText('month-over-month growth')).toBeInTheDocument();
    });

    it('should analyze donor retention metrics', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('retention-metrics')).toBeInTheDocument();
      });

      // member1 gave in Jan and Feb (retained)
      // member2 gave in Jan and Mar (retained)
      // Retention rate should be calculated correctly
      expect(screen.getByText('Donor Retention: 66.7%')).toBeInTheDocument();
      expect(
        screen.getByText('2 of 3 donors gave multiple times')
      ).toBeInTheDocument();
    });

    it('should track category performance over time', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('category-performance')).toBeInTheDocument();
      });

      // Tithe: $2,450 total across 3 donations
      expect(screen.getByText('Tithe: $2,450')).toBeInTheDocument();

      // Building Fund: $2,000 from 1 large donation
      expect(screen.getByText('Building Fund: $2,000')).toBeInTheDocument();

      // Should show tithe as most consistent category
      expect(screen.getByText('Most Consistent: Tithe')).toBeInTheDocument();
    });

    it('should generate basic predictive forecasts', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('forecast-chart')).toBeInTheDocument();
      });

      // Based on trend from $1,500 → $1,050 → $3,200
      // Should predict next month with growth trend
      expect(screen.getByText('April Forecast')).toBeInTheDocument();
      expect(screen.getByTestId('forecast-confidence')).toBeInTheDocument();
    });

    it('should calculate donor engagement scores', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('engagement-scores')).toBeInTheDocument();
      });

      // member1: 2 donations, $1,250 total = high engagement
      // member2: 2 donations, $2,200 total = highest engagement
      // member3: 1 donation, $300 total = low engagement
      expect(screen.getByText('High Engagement: 2 donors')).toBeInTheDocument();
      expect(
        screen.getByText('Average Engagement Score: 7.3')
      ).toBeInTheDocument();
    });

    it('should identify top giving periods', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('top-periods')).toBeInTheDocument();
      });

      // March should be identified as top period ($3,200)
      expect(screen.getByText('Top Period: March 2024')).toBeInTheDocument();
      expect(screen.getByText('$3,200 in donations')).toBeInTheDocument();
    });

    it('should analyze donation frequency patterns', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('frequency-analysis')).toBeInTheDocument();
      });

      // Should show weekly/monthly patterns
      expect(
        screen.getByText('Average Frequency: 1.5 donations/month')
      ).toBeInTheDocument();
      expect(screen.getByText('Most Active Day: Sunday')).toBeInTheDocument();
    });

    it('should compute average gift progression', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('gift-progression')).toBeInTheDocument();
      });

      // member1: $500 → $750 (50% increase)
      // member2: $1000 → $1200 (20% increase)
      expect(screen.getByText('Average Gift Growth: 35%')).toBeInTheDocument();
      expect(
        screen.getByText('Donors showing positive progression')
      ).toBeInTheDocument();
    });

    it('should detect giving anomalies', async () => {
      const anomalyData = [
        ...mockTrendData,
        {
          id: 'anomaly1',
          memberId: 'member1',
          amount: 50000, // Unusually large gift
          method: 'check',
          categoryId: 'building',
          date: Timestamp.fromDate(new Date('2024-03-20')),
          isAnonymous: false,
          isTaxDeductible: true,
          notes: 'Major gift',
          receipt: { requested: true, email: 'test@example.com', mailed: true },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      mockDonationsService.getAll.mockResolvedValue(anomalyData);
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('anomaly-detection')).toBeInTheDocument();
      });

      expect(screen.getByText('Anomaly Detected')).toBeInTheDocument();
      expect(
        screen.getByText('Unusually large gift: $50,000')
      ).toBeInTheDocument();
    });

    it('should calculate donor lifecycle metrics', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-metrics')).toBeInTheDocument();
      });

      // Should track new vs returning donors
      expect(screen.getByText('New Donors: 4')).toBeInTheDocument();
      expect(screen.getByText('Returning Donors: 2')).toBeInTheDocument();
      expect(
        screen.getByText('Average Donor Lifespan: 2.3 months')
      ).toBeInTheDocument();
    });
  });

  describe('Comparative Reporting', () => {
    beforeEach(() => {
      // Mock date range queries for comparisons
      mockDonationsService.getByDateRange.mockImplementation(
        (startDate, endDate) => {
          const start = startDate.toDate();
          const end = endDate.toDate();

          if (start.getFullYear() === 2023) {
            return Promise.resolve(mockPreviousYearData);
          }
          return Promise.resolve(
            mockTrendData.filter((d) => {
              const donationDate = d.date.toDate();
              return donationDate >= start && donationDate <= end;
            })
          );
        }
      );
    });

    it('should perform year-over-year comparisons', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('yoy-comparison')).toBeInTheDocument();
      });

      // 2024: $5,750 vs 2023: $1,200 = 379% increase
      expect(screen.getByText('YoY Growth: +379%')).toBeInTheDocument();
      expect(
        screen.getByText('$4,550 increase from last year')
      ).toBeInTheDocument();
    });

    it('should calculate month-over-month changes', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('mom-comparison')).toBeInTheDocument();
      });

      // March vs February: $3,200 vs $1,050
      expect(screen.getByText('MoM Change: +204.8%')).toBeInTheDocument();
      expect(
        screen.getByText('Significant growth this month')
      ).toBeInTheDocument();
    });

    it('should benchmark category performance', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('category-benchmarks')).toBeInTheDocument();
      });

      // Should compare categories against targets/averages
      expect(screen.getByText('Tithe: Above Average')).toBeInTheDocument();
      expect(
        screen.getByText('Building Fund: Exceptional')
      ).toBeInTheDocument();
      expect(screen.getByText('Missions: Below Target')).toBeInTheDocument();
    });

    it('should track goal vs actual progress', async () => {
      // Mock goals service
      const mockGoals = {
        annual: 100000,
        monthly: 8333,
        categories: {
          tithe: 60000,
          building: 30000,
        },
      };

      render(<FinancialReports goals={mockGoals} />);

      await waitFor(() => {
        expect(screen.getByTestId('goal-progress')).toBeInTheDocument();
      });

      // YTD actual: $5,750 vs annual goal: $100,000 = 5.75%
      expect(screen.getByText('Annual Progress: 5.8%')).toBeInTheDocument();
      expect(screen.getByText('$94,250 remaining')).toBeInTheDocument();
    });

    it('should analyze historical trends', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('historical-trends')).toBeInTheDocument();
      });

      // Should show 3-month rolling average
      expect(screen.getByText('3-Month Average: $1,917')).toBeInTheDocument();
      expect(screen.getByText('Trend: Upward')).toBeInTheDocument();
    });

    it('should compare donor segments', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('donor-segments')).toBeInTheDocument();
      });

      // Major donors (>$1000): member2, member4
      // Regular donors ($100-$1000): member1, member3
      expect(screen.getByText('Major Donors: 2 (50%)')).toBeInTheDocument();
      expect(screen.getByText('Regular Donors: 2 (50%)')).toBeInTheDocument();
    });

    it('should evaluate campaign effectiveness', async () => {
      const campaignData = mockTrendData.map((d) => ({
        ...d,
        campaign:
          d.categoryId === 'building' ? 'Building Campaign 2024' : undefined,
      }));

      mockDonationsService.getAll.mockResolvedValue(campaignData);
      render(<FinancialReports />);

      await waitFor(() => {
        expect(
          screen.getByTestId('campaign-effectiveness')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('Building Campaign 2024: $2,000')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Campaign Success Rate: 100%')
      ).toBeInTheDocument();
    });

    it('should measure seasonal variations', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByTestId('seasonal-variations')).toBeInTheDocument();
      });

      // Should show Q1 performance vs historical Q1
      expect(
        screen.getByText('Q1 Performance: Above Average')
      ).toBeInTheDocument();
      expect(screen.getByText('Seasonal Index: 1.2')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    let mockCallback: (donations: Donation[]) => void;

    beforeEach(() => {
      mockDonationsService.subscribeToChanges.mockImplementation((callback) => {
        mockCallback = callback;
        return mockUnsubscribe;
      });
    });

    it('should subscribe to donation updates on mount', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.subscribeToChanges).toHaveBeenCalledTimes(
          1
        );
        expect(
          typeof mockDonationsService.subscribeToChanges.mock.calls[0][0]
        ).toBe('function');
      });
    });

    it('should update KPIs when new donations arrive', async () => {
      render(<FinancialReports />);

      await waitFor(() => {
        expect(screen.getByText('Total: $5,750')).toBeInTheDocument();
      });

      // Simulate new donation arriving
      const newDonation: Donation = {
        id: 'realtime1',
        memberId: 'member5',
        amount: 1000,
        method: 'online',
        categoryId: 'tithe',
        date: Timestamp.now(),
        isAnonymous: false,
        isTaxDeductible: true,
        notes: '',
        receipt: { requested: true, email: 'new@example.com', mailed: false },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      act(() => {
        mockCallback([...mockTrendData, newDonation]);
      });

      await waitFor(() => {
        expect(screen.getByText('Total: $6,750')).toBeInTheDocument();
      });
    });

    it('should refresh charts with live data', async () => {
      render(<FinancialReports />);

      const chartElement = await screen.findByTestId('monthly-trends-chart');
      expect(chartElement).toBeInTheDocument();

      // Simulate data update
      act(() => {
        mockCallback([
          ...mockTrendData,
          {
            id: 'chart-update',
            memberId: 'member1',
            amount: 500,
            method: 'online',
            categoryId: 'tithe',
            date: Timestamp.fromDate(new Date('2024-04-01')),
            isAnonymous: false,
            isTaxDeductible: true,
            notes: '',
            receipt: {
              requested: true,
              email: 'test@example.com',
              mailed: false,
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        ]);
      });

      await waitFor(() => {
        expect(screen.getByText('Apr 2024')).toBeInTheDocument();
      });
    });

    it('should handle real-time data errors gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockDonationsService.subscribeToChanges.mockImplementation((callback) => {
        // Simulate error in callback
        setTimeout(() => callback(null as any), 100);
        return mockUnsubscribe;
      });

      render(<FinancialReports />);

      await waitFor(() => {
        expect(
          screen.getByText('Error loading financial data')
        ).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('should unsubscribe on component unmount', async () => {
      const { unmount } = render(<FinancialReports />);

      await waitFor(() => {
        expect(mockDonationsService.subscribeToChanges).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should throttle frequent updates', async () => {
      vi.useFakeTimers();

      render(<FinancialReports />);

      // Simulate rapid updates
      act(() => {
        mockCallback([...mockTrendData, { id: 'update1' } as Donation]);
        mockCallback([...mockTrendData, { id: 'update2' } as Donation]);
        mockCallback([...mockTrendData, { id: 'update3' } as Donation]);
      });

      // Should only process updates after throttle delay
      expect(screen.queryByText('Processing updates...')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(500); // Throttle delay
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Processing updates...')
        ).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('should maintain data consistency during updates', async () => {
      render(<FinancialReports />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByText('6 donations')).toBeInTheDocument();
        expect(screen.getByText('Total: $5,750')).toBeInTheDocument();
      });

      // Update with consistent data
      const updatedData = [...mockTrendData];
      updatedData[0] = { ...updatedData[0], amount: 600 }; // Update first donation

      act(() => {
        mockCallback(updatedData);
      });

      await waitFor(() => {
        expect(screen.getByText('Total: $5,850')).toBeInTheDocument(); // +$100
        expect(screen.getByText('6 donations')).toBeInTheDocument(); // Same count
      });
    });

    it('should update goal progress in real-time', async () => {
      const goals = { annual: 10000, monthly: 833 };
      render(<FinancialReports goals={goals} />);

      await waitFor(() => {
        expect(screen.getByText('57.5%')).toBeInTheDocument(); // $5750/$10000
      });

      // Add new donation
      act(() => {
        mockCallback([
          ...mockTrendData,
          {
            id: 'goal-update',
            memberId: 'member1',
            amount: 1250,
            method: 'online',
            categoryId: 'tithe',
            date: Timestamp.now(),
            isAnonymous: false,
            isTaxDeductible: true,
            notes: '',
            receipt: {
              requested: true,
              email: 'test@example.com',
              mailed: false,
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        ]);
      });

      await waitFor(() => {
        expect(screen.getByText('70.0%')).toBeInTheDocument(); // $7000/$10000
      });
    });

    it('should show live donation notifications', async () => {
      render(<FinancialReports />);

      const newDonation: Donation = {
        id: 'notification-test',
        memberId: 'member1',
        amount: 500,
        method: 'online',
        categoryId: 'tithe',
        date: Timestamp.now(),
        isAnonymous: false,
        isTaxDeductible: true,
        notes: '',
        receipt: { requested: true, email: 'test@example.com', mailed: false },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      act(() => {
        mockCallback([...mockTrendData, newDonation]);
      });

      await waitFor(() => {
        expect(
          screen.getByText('New donation received: $500')
        ).toBeInTheDocument();
      });

      // Notification should auto-dismiss
      await waitFor(
        () => {
          expect(
            screen.queryByText('New donation received: $500')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('should handle network connectivity issues', async () => {
      // Mock network error
      mockDonationsService.subscribeToChanges.mockImplementation((callback) => {
        setTimeout(() => {
          throw new Error('Network error');
        }, 100);
        return mockUnsubscribe;
      });

      render(<FinancialReports />);

      await waitFor(() => {
        expect(
          screen.getByText('Connection lost - attempting to reconnect...')
        ).toBeInTheDocument();
      });

      // Should show retry mechanism
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });
  });
});
