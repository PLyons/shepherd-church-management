// src/components/donations/__tests__/DonationForm.test.tsx
// Comprehensive test suite for DonationForm component following TDD RED phase principles
// Tests written BEFORE implementation to define expected behavior and achieve 90% form validation coverage
// RELEVANT FILES: src/components/donations/DonationForm.tsx, src/services/firebase/donations.service.ts, src/services/firebase/donation-categories.service.ts, src/types/donations.ts

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { DonationForm } from '../DonationForm';
import { donationsService, donationCategoriesService, membersService } from '../../../services/firebase';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { DonationFormData, DonationCategory, DonationMethod, Form990LineItem } from '../../../types/donations';
import { Member } from '../../../types';

// Mock the services and contexts
vi.mock('../../../services/firebase', () => ({
  donationsService: {
    create: vi.fn(),
    update: vi.fn(),
    getById: vi.fn(),
    createMultipleDonations: vi.fn(),
  },
  donationCategoriesService: {
    getActiveCategories: vi.fn(),
  },
  membersService: {
    search: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
  };
});

const mockDonationsService = donationsService as unknown as {
  create: Mock;
  update: Mock;
  getById: Mock;
  createMultipleDonations: Mock;
};

const mockDonationCategoriesService = donationCategoriesService as unknown as {
  getActiveCategories: Mock;
};

const mockMembersService = membersService as unknown as {
  search: Mock;
  getAll: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('DonationForm', () => {
  const mockUser = {
    uid: 'admin-user-id',
    email: 'admin@test.com',
    displayName: 'Test Admin',
  };

  const mockShowToast = vi.fn();

  const mockCategories: DonationCategory[] = [
    {
      id: 'category-1',
      name: 'Tithe',
      description: 'Regular tithing',
      isActive: true,
      defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
      isTaxDeductible: true,
      currentYearTotal: 0,
      lastYearTotal: 0,
      totalAmount: 0,
      donationCount: 0,
      averageDonation: 0,
      includeInReports: true,
      displayOrder: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin-user',
    },
    {
      id: 'category-2',
      name: 'Offering',
      description: 'Sunday offering',
      isActive: true,
      defaultForm990LineItem: '1a_cash_contributions' as Form990LineItem,
      isTaxDeductible: true,
      currentYearTotal: 0,
      lastYearTotal: 0,
      totalAmount: 0,
      donationCount: 0,
      averageDonation: 0,
      includeInReports: true,
      displayOrder: 2,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin-user',
    },
  ];

  const mockMembers: Member[] = [
    {
      id: 'member-1',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john@test.com',
      phone: '555-1234',
      role: 'member',
      memberStatus: 'active',
    },
    {
      id: 'member-2',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      email: 'jane@test.com',
      phone: '555-5678',
      role: 'member',
      memberStatus: 'active',
    },
  ];

  const mockDonationData = {
    id: 'donation-1',
    memberId: 'member-1',
    memberName: 'John Doe',
    amount: 100.00,
    donationDate: '2025-01-15',
    method: 'cash' as DonationMethod,
    categoryId: 'category-1',
    categoryName: 'Tithe',
    form990Fields: {
      lineItem: '1a_cash_contributions' as Form990LineItem,
      isQuidProQuo: false,
      isAnonymous: false,
    },
    isReceiptSent: false,
    isTaxDeductible: true,
    taxYear: 2025,
    status: 'verified' as const,
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin-user-id',
    updatedAt: '2025-01-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });

    mockDonationCategoriesService.getActiveCategories.mockResolvedValue(mockCategories);
    mockMembersService.search.mockResolvedValue(mockMembers);
  });

  describe('Rendering', () => {
    it('should render donation form with basic sections', async () => {
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      expect(screen.getByText('Record Donation')).toBeInTheDocument();
      expect(screen.getByText('Donor Information')).toBeInTheDocument();
      expect(screen.getByText('Donation Details')).toBeInTheDocument();
      expect(screen.getByText('Tax & Receipt Information')).toBeInTheDocument();
    });

    it('should render edit form with donation ID', () => {
      render(
        <TestWrapper>
          <DonationForm donationId="donation-1" />
        </TestWrapper>
      );

      expect(screen.getByText('Edit Donation')).toBeInTheDocument();
    });

    it('should show loading spinner when loading donation data', () => {
      mockDonationsService.getById.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <DonationForm donationId="donation-1" />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner') || screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render batch mode toggle when enabled', () => {
      render(
        <TestWrapper>
          <DonationForm enableBatchMode={true} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/batch entry mode/i)).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all required form fields', async () => {
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      });

      // Donor Information fields
      expect(screen.getByLabelText(/anonymous donation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/member search/i)).toBeInTheDocument();

      // Donation Details fields
      expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/donation date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/donation category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();

      // Tax & Receipt fields
      expect(screen.getByLabelText(/tax deductible/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/send receipt/i)).toBeInTheDocument();
    });

    it('should populate payment method dropdown with all options', async () => {
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        const paymentMethodSelect = screen.getByLabelText(/payment method/i) as HTMLSelectElement;
        const options = Array.from(paymentMethodSelect.options).map(option => option.value);

        expect(options).toContain('cash');
        expect(options).toContain('check');
        expect(options).toContain('credit_card');
        expect(options).toContain('bank_transfer');
        expect(options).toContain('online');
      });
    });

    it('should populate category dropdown from service', async () => {
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Tithe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Offering')).toBeInTheDocument();
      });

      expect(mockDonationCategoriesService.getActiveCategories).toHaveBeenCalled();
    });

    it('should show check number field when payment method is check', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
      });

      const paymentMethodSelect = screen.getByLabelText(/payment method/i);
      await user.selectOptions(paymentMethodSelect, 'check');

      await waitFor(() => {
        expect(screen.getByLabelText(/check number/i)).toBeInTheDocument();
      });
    });

    it('should hide member search when anonymous donation is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/member search/i)).toBeInTheDocument();
      });

      const anonymousCheckbox = screen.getByLabelText(/anonymous donation/i);
      await user.click(anonymousCheckbox);

      await waitFor(() => {
        expect(screen.queryByLabelText(/member search/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Member Search Integration', () => {
    it('should search members when typing in member field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/member search/i)).toBeInTheDocument();
      });

      const memberInput = screen.getByLabelText(/member search/i);
      await user.type(memberInput, 'John');

      await waitFor(() => {
        expect(mockMembersService.search).toHaveBeenCalledWith('John', expect.any(Object));
      });
    });

    it('should display member search results', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/member search/i)).toBeInTheDocument();
      });

      const memberInput = screen.getByLabelText(/member search/i);
      await user.type(memberInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should select member from search results', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/member search/i)).toBeInTheDocument();
      });

      const memberInput = screen.getByLabelText(/member search/i);
      await user.type(memberInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await user.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(memberInput).toHaveValue('John Doe');
      });
    });
  });

  describe('Form Validation', () => {
    it('should show required field errors on empty submission', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Record Donation')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
        expect(screen.getByText(/donation date is required/i)).toBeInTheDocument();
        expect(screen.getByText(/category is required/i)).toBeInTheDocument();
        expect(screen.getByText(/member is required/i)).toBeInTheDocument();
      });
    });

    it('should validate amount is greater than zero', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, '0');
      
      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should validate amount does not exceed maximum', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, '1000001'); // Over $1,000,000 limit
      
      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount cannot exceed/i)).toBeInTheDocument();
      });
    });

    it('should validate date is not in future', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation date/i)).toBeInTheDocument();
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const dateInput = screen.getByLabelText(/donation date/i);
      await user.type(dateInput, futureDate);
      
      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/donation date cannot be in the future/i)).toBeInTheDocument();
      });
    });

    it('should validate check number when payment method is check', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument();
      });

      const paymentMethodSelect = screen.getByLabelText(/payment method/i);
      await user.selectOptions(paymentMethodSelect, 'check');

      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check number is required/i)).toBeInTheDocument();
      });
    });

    it('should allow submission without member when anonymous is selected', async () => {
      const user = userEvent.setup();
      mockDonationsService.create.mockResolvedValueOnce('donation-id');
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/anonymous donation/i)).toBeInTheDocument();
      });

      // Fill required fields
      const anonymousCheckbox = screen.getByLabelText(/anonymous donation/i);
      await user.click(anonymousCheckbox);

      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, '100');

      const dateInput = screen.getByLabelText(/donation date/i);
      await user.type(dateInput, '2025-01-15');

      const categorySelect = screen.getByLabelText(/donation category/i);
      await user.selectOptions(categorySelect, 'category-1');

      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDonationsService.create).toHaveBeenCalled();
      });
    });
  });

  describe('Batch Mode Functionality', () => {
    it('should show batch entry fields when batch mode is enabled', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DonationForm enableBatchMode={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/batch entry mode/i)).toBeInTheDocument();
      });

      const batchModeToggle = screen.getByLabelText(/batch entry mode/i);
      await user.click(batchModeToggle);

      await waitFor(() => {
        expect(screen.getByText(/add another donation/i)).toBeInTheDocument();
        expect(screen.getByText(/save all donations/i)).toBeInTheDocument();
      });
    });

    it('should call createMultipleDonations when submitting batch', async () => {
      const user = userEvent.setup();
      mockDonationsService.createMultipleDonations.mockResolvedValueOnce(['donation-1', 'donation-2']);
      
      render(
        <TestWrapper>
          <DonationForm enableBatchMode={true} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/batch entry mode/i)).toBeInTheDocument();
      });

      const batchModeToggle = screen.getByLabelText(/batch entry mode/i);
      await user.click(batchModeToggle);

      // Fill first donation
      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, '100');

      const dateInput = screen.getByLabelText(/donation date/i);
      await user.type(dateInput, '2025-01-15');

      const categorySelect = screen.getByLabelText(/donation category/i);
      await user.selectOptions(categorySelect, 'category-1');

      const anonymousCheckbox = screen.getByLabelText(/anonymous donation/i);
      await user.click(anonymousCheckbox);

      const addAnotherButton = screen.getByText(/add another donation/i);
      await user.click(addAnotherButton);

      const saveAllButton = screen.getByText(/save all donations/i);
      await user.click(saveAllButton);

      await waitFor(() => {
        expect(mockDonationsService.createMultipleDonations).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      amount: '100.00',
      donationDate: '2025-01-15',
      category: 'category-1',
      member: 'John Doe',
    };

    it('should call create service for new donations', async () => {
      const user = userEvent.setup();
      mockDonationsService.create.mockResolvedValueOnce('new-donation-id');
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      });

      // Fill out form
      const memberInput = screen.getByLabelText(/member search/i);
      await user.type(memberInput, validFormData.member);
      await user.click(screen.getByText('John Doe'));

      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, validFormData.amount);

      const dateInput = screen.getByLabelText(/donation date/i);
      await user.type(dateInput, validFormData.donationDate);

      const categorySelect = screen.getByLabelText(/donation category/i);
      await user.selectOptions(categorySelect, validFormData.category);
      
      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDonationsService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100.00,
            donationDate: validFormData.donationDate,
            categoryId: validFormData.category,
            memberId: 'member-1',
            createdBy: mockUser.uid,
          })
        );
        expect(mockShowToast).toHaveBeenCalledWith('Donation recorded successfully!', 'success');
      });
    });

    it('should call update service for existing donations', async () => {
      const user = userEvent.setup();
      mockDonationsService.getById.mockResolvedValueOnce(mockDonationData);
      mockDonationsService.update.mockResolvedValueOnce(undefined);
      
      render(
        <TestWrapper>
          <DonationForm donationId="donation-1" />
        </TestWrapper>
      );

      // Wait for donation to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Update Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDonationsService.update).toHaveBeenCalledWith(
          'donation-1',
          expect.objectContaining({
            amount: 100.00,
            donationDate: '2025-01-15',
            categoryId: 'category-1',
          })
        );
        expect(mockShowToast).toHaveBeenCalledWith('Donation updated successfully!', 'success');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockDonationsService.create.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      });

      // Fill required fields
      const anonymousCheckbox = screen.getByLabelText(/anonymous donation/i);
      await user.click(anonymousCheckbox);

      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, validFormData.amount);

      const dateInput = screen.getByLabelText(/donation date/i);
      await user.type(dateInput, validFormData.donationDate);

      const categorySelect = screen.getByLabelText(/donation category/i);
      await user.selectOptions(categorySelect, validFormData.category);
      
      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      mockDonationsService.create.mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      });

      // Fill required fields
      const anonymousCheckbox = screen.getByLabelText(/anonymous donation/i);
      await user.click(anonymousCheckbox);

      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, validFormData.amount);

      const dateInput = screen.getByLabelText(/donation date/i);
      await user.type(dateInput, validFormData.donationDate);

      const categorySelect = screen.getByLabelText(/donation category/i);
      await user.selectOptions(categorySelect, validFormData.category);
      
      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error recording donation. Please try again.',
          'error'
        );
      });
    });
  });

  describe('Edit Mode with Pre-populated Data', () => {
    it('should populate form with existing donation data', async () => {
      mockDonationsService.getById.mockResolvedValueOnce(mockDonationData);
      
      render(
        <TestWrapper>
          <DonationForm donationId="donation-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('100')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2025-01-15')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('cash')).toBeInTheDocument();
      });
    });

    it('should handle donation loading errors', async () => {
      mockDonationsService.getById.mockRejectedValueOnce(new Error('Donation not found'));
      
      render(
        <TestWrapper>
          <DonationForm donationId="donation-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Error loading donation details', 'error');
      });
    });
  });

  describe('Role-based Access Verification', () => {
    it('should show all features for admin users', async () => {
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tax deductible/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/send receipt/i)).toBeInTheDocument();
      });
    });

    it('should restrict features for member users', async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: 'member' },
        isLoading: false,
      });

      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        // Members should only be able to record their own donations
        expect(screen.getByText(/record your donation/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/member search/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should call onSubmit prop when provided', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      
      render(
        <TestWrapper>
          <DonationForm onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/donation amount/i)).toBeInTheDocument();
      });

      // Fill required fields
      const anonymousCheckbox = screen.getByLabelText(/anonymous donation/i);
      await user.click(anonymousCheckbox);

      const amountInput = screen.getByLabelText(/donation amount/i);
      await user.type(amountInput, '100');

      const dateInput = screen.getByLabelText(/donation date/i);
      await user.type(dateInput, '2025-01-15');

      const categorySelect = screen.getByLabelText(/donation category/i);
      await user.selectOptions(categorySelect, 'category-1');
      
      const submitButton = screen.getByText('Record Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100,
            donationDate: '2025-01-15',
            categoryId: 'category-1',
          })
        );
      });
    });

    it('should call onCancel prop when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      
      render(
        <TestWrapper>
          <DonationForm onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Wait for categories to load and form to render
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Loading States', () => {
    it('should handle category loading errors', async () => {
      mockDonationCategoriesService.getActiveCategories.mockRejectedValueOnce(new Error('Categories failed to load'));
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Error loading donation categories', 'error');
      });
    });

    it('should handle member search errors', async () => {
      const user = userEvent.setup();
      mockMembersService.search.mockRejectedValueOnce(new Error('Search failed'));
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/member search/i)).toBeInTheDocument();
      });

      const memberInput = screen.getByLabelText(/member search/i);
      await user.type(memberInput, 'John');

      await waitFor(() => {
        expect(screen.getByText(/error searching members/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while categories are loading', () => {
      mockDonationCategoriesService.getActiveCategories.mockImplementation(() => new Promise(() => {}));
      
      render(
        <TestWrapper>
          <DonationForm />
        </TestWrapper>
      );

      expect(screen.getByText(/loading categories/i)).toBeInTheDocument();
    });
  });
});