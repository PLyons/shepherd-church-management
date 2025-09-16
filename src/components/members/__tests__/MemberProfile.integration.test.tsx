// src/components/members/__tests__/MemberProfile.integration.test.tsx
// RED phase tests for PRP-2C-010 Member Profile Integration
// Tests member profile integration with donation system before implementation
// RELEVANT FILES: src/components/members/MemberProfile.tsx, src/components/donations/MemberDonationHistory.tsx

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import MemberProfile from '../../../pages/MemberProfile';
import { donationsService } from '../../../services/firebase';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Member } from '../../../types';
import { Donation } from '../../../types/donations';

// Mock services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    getDonationsByMember: vi.fn(),
    getMemberDonationSummary: vi.fn(),
    createDonation: vi.fn(),
  },
  membersService: {
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'member-1' }),
    useNavigate: () => vi.fn(),
    Outlet: () => null,
  };
});

const mockDonationsService = donationsService as unknown as {
  getDonationsByMember: Mock;
  getMemberDonationSummary: Mock;
  createDonation: Mock;
};

const mockMembersService = vi.mocked(await import('../../../services/firebase'))
  .membersService as unknown as {
  getById: Mock;
  update: Mock;
  delete: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

// Test data
const mockMember: Member = {
  id: 'member-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '(555) 123-4567',
  dateOfBirth: '1980-01-01',
  membershipType: 'active',
  role: 'member',
  addresses: [],
  householdId: 'household-1',
  isActive: true,
  joinDate: '2020-01-01',
  status: 'active',
  createdAt: new Date('2020-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockDonations: Donation[] = [
  {
    id: 'donation-1',
    memberId: 'member-1',
    amount: 100.0,
    method: 'check',
    status: 'completed',
    date: new Date('2024-01-15'),
    categoryId: 'tithe',
    notes: 'Regular tithe',
    isRecurring: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'donation-2',
    memberId: 'member-1',
    amount: 50.0,
    method: 'cash',
    status: 'completed',
    date: new Date('2024-02-01'),
    categoryId: 'offering',
    notes: 'Sunday offering',
    isRecurring: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MemberProfile Integration with Donations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { uid: 'admin-1', role: 'admin' },
      member: { id: 'admin-1', role: 'admin' },
      loading: false,
    });

    mockUseToast.mockReturnValue({
      addToast: vi.fn(),
    });

    // Mock member profile data
    mockMembersService.getById.mockResolvedValue(mockMember);

    mockDonationsService.getDonationsByMember.mockResolvedValue(mockDonations);
    mockDonationsService.getMemberDonationSummary.mockResolvedValue({
      totalAmount: 150.0,
      donationCount: 2,
      lastDonationDate: new Date('2024-02-01'),
    });
  });

  it('should display "Giving History" tab in member profile', async () => {
    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Should show Giving History tab
    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: /giving history/i })
      ).toBeInTheDocument();
    });
  });

  it('should display member donations when Giving History tab is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Click on Giving History tab
    const givingTab = await screen.findByRole('tab', {
      name: /giving history/i,
    });
    await user.click(givingTab);

    // Should display donation history
    await waitFor(() => {
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('Regular tithe')).toBeInTheDocument();
      expect(screen.getByText('Sunday offering')).toBeInTheDocument();
    });

    // Should call donations service
    expect(mockDonationsService.getDonationsByMember).toHaveBeenCalledWith(
      'member-1'
    );
  });

  it('should show giving summary in profile sidebar', async () => {
    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Should display giving summary in sidebar
    await waitFor(() => {
      expect(screen.getByText(/total giving/i)).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText(/2 donations/i)).toBeInTheDocument();
    });

    expect(mockDonationsService.getMemberDonationSummary).toHaveBeenCalledWith(
      'member-1'
    );
  });

  it('should include donation events in activity timeline', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Click on Activity tab
    const activityTab = await screen.findByRole('tab', { name: /activity/i });
    await user.click(activityTab);

    // Should show donation activities in timeline
    await waitFor(() => {
      expect(screen.getByText(/donated \$100\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/donated \$50\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/feb 1, 2024/i)).toBeInTheDocument();
    });
  });

  it('should show quick donation entry for admin/pastor users', async () => {
    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Should show "Record Donation" button for admin users
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /record donation/i })
      ).toBeInTheDocument();
    });
  });

  it('should restrict donation data access for member users', async () => {
    // Set up member user context
    mockUseAuth.mockReturnValue({
      user: { uid: 'member-1', role: 'member' },
      currentMember: { id: 'member-1', role: 'member' },
      loading: false,
    });

    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Member viewing their own profile should see giving history
    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: /giving history/i })
      ).toBeInTheDocument();
    });

    // But viewing another member's profile should NOT see giving data
    mockUseAuth.mockReturnValue({
      user: { uid: 'member-2', role: 'member' },
      currentMember: { id: 'member-2', role: 'member' },
      loading: false,
    });

    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Should NOT show giving history tab for other members
    expect(
      screen.queryByRole('tab', { name: /giving history/i })
    ).not.toBeInTheDocument();
  });

  it('should allow admin/pastor to record donations from member profile', async () => {
    const user = userEvent.setup();
    const mockCreateDonation =
      mockDonationsService.createDonation.mockResolvedValue({
        id: 'new-donation',
        success: true,
      });

    render(
      <TestWrapper>
        <MemberProfile />
      </TestWrapper>
    );

    // Click Record Donation button
    const recordButton = await screen.findByRole('button', {
      name: /record donation/i,
    });
    await user.click(recordButton);

    // Should open donation form modal
    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /record donation/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/donation method/i)).toBeInTheDocument();
    });

    // Fill out donation form
    await user.type(screen.getByLabelText(/amount/i), '75.00');
    await user.selectOptions(screen.getByLabelText(/donation method/i), 'cash');
    await user.type(screen.getByLabelText(/notes/i), 'Quick donation entry');

    // Submit donation
    await user.click(screen.getByRole('button', { name: /record donation/i }));

    // Should create donation for this member
    await waitFor(() => {
      expect(mockCreateDonation).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: 'member-1',
          amount: 75.0,
          method: 'cash',
          notes: 'Quick donation entry',
        })
      );
    });
  });
});
