// src/components/donations/__tests__/PaymentForm.test.tsx
// Comprehensive test suite for PaymentForm component following TDD RED phase principles
// Tests written BEFORE implementation to define expected behavior for Stripe payment processing
// Coverage: User interactions, payment flows, error handling, and integration scenarios

import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PaymentForm } from '../PaymentForm';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { DonationFormData, PaymentMethod } from '../../../types/donations';
import { stripeService } from '../../../services/payment/stripe-client.service';

// Mock Stripe Elements and hooks
const mockUseStripe = vi.fn();
const mockUseElements = vi.fn();
const mockElements = {
  submit: vi.fn(),
  getElement: vi.fn(),
};
const mockStripe = {
  confirmPayment: vi.fn(),
  confirmSetup: vi.fn(),
};

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="card-element">Mock Card Element</div>,
  useElements: () => mockUseElements(),
  useStripe: () => mockUseStripe(),
}));

// Mock services and contexts
vi.mock('../../../services/payment/stripe-client.service', () => ({
  stripeService: {
    getPaymentMethods: vi.fn(),
    createPaymentIntent: vi.fn(),
    createSetupIntent: vi.fn(),
    processPayment: vi.fn(),
    setupRecurringDonation: vi.fn(),
    retryPayment: vi.fn(),
  },
}));

vi.mock('../../../contexts/FirebaseAuthContext');
vi.mock('../../../contexts/ToastContext');

const mockStripeService = stripeService as unknown as {
  getPaymentMethods: Mock;
  createPaymentIntent: Mock;
  createSetupIntent: Mock;
  processPayment: Mock;
  setupRecurringDonation: Mock;
  retryPayment: Mock;
};

const mockUseAuth = useAuth as Mock;
const mockUseToast = useToast as Mock;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PaymentForm', () => {
  const mockUser = {
    uid: 'user-123',
    email: 'user@test.com',
    displayName: 'Test User',
  };

  const mockShowToast = vi.fn();

  const mockDonationData: DonationFormData = {
    amount: 100,
    donationDate: '2025-01-15',
    method: 'credit_card',
    categoryId: 'category-1',
    form990LineItem: '1a_cash_contributions',
    isQuidProQuo: false,
    sendReceipt: true,
    isTaxDeductible: true,
  };

  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_123',
      type: 'card',
      customerId: 'cus_123',
      card: {
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
      },
    },
    {
      id: 'pm_456',
      type: 'card',
      customerId: 'cus_123',
      card: {
        brand: 'mastercard',
        last4: '5555',
        expiryMonth: 6,
        expiryYear: 2026,
      },
    },
  ];

  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });

    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });

    mockUseStripe.mockReturnValue(mockStripe);
    mockUseElements.mockReturnValue(mockElements);

    // Default successful mocks
    mockStripeService.getPaymentMethods.mockResolvedValue(mockPaymentMethods);
    mockStripeService.createPaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_client_secret',
      paymentIntentId: 'pi_test_123',
      amount: 10000, // in cents
      currency: 'usd',
    });
    mockStripeService.processPayment.mockResolvedValue({
      success: true,
      donationId: 'donation-123',
    });
    mockStripeService.setupRecurringDonation.mockResolvedValue({
      success: true,
      subscriptionId: 'sub_123',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render payment form elements', async () => {
      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /donate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should display saved payment methods when available', async () => {
      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText(/\*\*\*\* \*\*\*\* \*\*\*\* 4242 \(VISA\)/)).toBeInTheDocument();
        expect(screen.getByText(/\*\*\*\* \*\*\*\* \*\*\*\* 5555 \(MASTERCARD\)/)).toBeInTheDocument();
        expect(screen.getByText('Use a new card')).toBeInTheDocument();
      });
    });

    it('should hide saved payment methods section when none available', async () => {
      mockStripeService.getPaymentMethods.mockResolvedValue([]);

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('Payment Method')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    it('should show save payment method checkbox for new cards', async () => {
      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Save this payment method for future donations')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Method Selection', () => {
    it('should allow selecting saved payment method', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('pm_123')).toBeInTheDocument();
      });

      const savedMethodRadio = screen.getByDisplayValue('pm_123');
      await user.click(savedMethodRadio);

      expect(savedMethodRadio).toBeChecked();
      expect(screen.getByDisplayValue('new')).not.toBeChecked();
    });

    it('should default to new card when "Use a new card" is selected', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const newCardRadio = screen.getByDisplayValue('new');
        expect(newCardRadio).toBeChecked();
      });
    });

    it('should show card element only when new card is selected', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Should show card element by default (new card selected)
      expect(screen.getByTestId('card-element')).toBeInTheDocument();

      // Select saved payment method
      await waitFor(() => {
        const savedMethodRadio = screen.getByDisplayValue('pm_123');
        user.click(savedMethodRadio);
      });

      // Card element should be hidden when saved method is selected
      // This will fail initially since component doesn't exist yet
    });
  });

  describe('One-time Payment Processing', () => {
    it('should process one-time payment successfully', async () => {
      const user = userEvent.setup();
      
      mockElements.submit.mockResolvedValue({ error: null });
      mockStripeService.processPayment.mockResolvedValue({
        success: true,
        donationId: 'donation-123',
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /donate \$100/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /donate \$100/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockStripeService.processPayment).toHaveBeenCalledWith(
          mockElements,
          'pi_test_client_secret',
          mockDonationData
        );
        expect(mockOnSuccess).toHaveBeenCalledWith('donation-123');
        expect(mockShowToast).toHaveBeenCalledWith('Donation processed successfully!', 'success');
      });
    });

    it('should handle payment processing errors', async () => {
      const user = userEvent.setup();
      
      mockElements.submit.mockResolvedValue({ error: null });
      mockStripeService.processPayment.mockResolvedValue({
        success: false,
        error: 'Your card was declined.',
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /donate \$100/i });
        user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });

    it('should require payment method selection for saved methods', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // First select a saved method
      await waitFor(() => {
        const savedMethodRadio = screen.getByDisplayValue('pm_123');
        user.click(savedMethodRadio);
      });

      // Clear the selection by unchecking (simulate no selection)
      await waitFor(() => {
        const savedMethodRadio = screen.getByDisplayValue('pm_123');
        // Simulate deselection by changing to no selection
        savedMethodRadio.checked = false;
      });

      // This should trigger validation error
      const submitButton = screen.getByRole('button', { name: /donate \$100/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a payment method or use a new card.')).toBeInTheDocument();
      });
    });
  });

  describe('Recurring Payment Setup', () => {
    it('should setup recurring donation successfully', async () => {
      const user = userEvent.setup();
      
      mockStripeService.createSetupIntent.mockResolvedValue({
        clientSecret: 'seti_test_client_secret',
        setupIntentId: 'seti_test_123',
      });

      mockElements.submit.mockResolvedValue({ error: null });
      mockStripeService.setupRecurringDonation.mockResolvedValue({
        success: true,
        subscriptionId: 'sub_123',
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
            isRecurring={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /setup recurring gift/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /setup recurring gift/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockStripeService.setupRecurringDonation).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith('sub_123');
        expect(mockShowToast).toHaveBeenCalledWith('Recurring donation setup successfully!', 'success');
      });
    });

    it('should handle recurring setup errors', async () => {
      const user = userEvent.setup();
      
      mockStripeService.createSetupIntent.mockResolvedValue({
        clientSecret: 'seti_test_client_secret',
        setupIntentId: 'seti_test_123',
      });

      mockElements.submit.mockResolvedValue({ error: null });
      mockStripeService.setupRecurringDonation.mockResolvedValue({
        success: false,
        error: 'Setup failed. Please try again.',
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
            isRecurring={true}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /setup recurring gift/i });
        user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Setup failed. Please try again.')).toBeInTheDocument();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show processing state during payment', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockElements.submit.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ error: null }), 100)
      ));

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /donate \$100/i });
      await user.click(submitButton);

      expect(screen.getByRole('button', { name: /processing.../i })).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should disable form during processing', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockElements.submit.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ error: null }), 100)
      ));

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /donate \$100/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe initialization errors', async () => {
      mockStripeService.createPaymentIntent.mockRejectedValue(
        new Error('Failed to initialize payment')
      );

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize payment. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockElements.submit.mockResolvedValue({ error: null });
      mockStripeService.processPayment.mockRejectedValue(
        new Error('Network error')
      );

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /donate \$100/i });
        user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Payment processing failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle Stripe elements submit errors', async () => {
      const user = userEvent.setup();
      
      mockElements.submit.mockResolvedValue({ 
        error: { message: 'Your card number is incomplete.' }
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /donate \$100/i });
        user.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Your card number is incomplete.')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should prevent submission without Stripe initialization', async () => {
      const user = userEvent.setup();
      
      mockUseStripe.mockReturnValue(null);

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /donate \$100/i });
      expect(submitButton).toBeDisabled();

      await user.click(submitButton);
      expect(mockStripeService.processPayment).not.toHaveBeenCalled();
    });

    it('should prevent submission without elements initialization', async () => {
      const user = userEvent.setup();
      
      mockUseElements.mockReturnValue(null);

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /donate \$100/i });
      expect(submitButton).toBeDisabled();
    });

    it('should prevent submission without client secret', async () => {
      const user = userEvent.setup();
      
      mockStripeService.createPaymentIntent.mockResolvedValue({
        clientSecret: '',
        paymentIntentId: 'pi_test_123',
        amount: 10000,
        currency: 'usd',
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /donate \$100/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('User Authentication', () => {
    it('should handle unauthenticated user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Should not initialize payment without user
      expect(mockStripeService.createPaymentIntent).not.toHaveBeenCalled();
      expect(mockStripeService.getPaymentMethods).not.toHaveBeenCalled();
    });

    it('should wait for authentication loading', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
      });

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Should not initialize payment while loading
      expect(mockStripeService.createPaymentIntent).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable cancel during processing', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockElements.submit.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ error: null }), 100)
      ));

      render(
        <TestWrapper>
          <PaymentForm
            donationData={mockDonationData}
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /donate \$100/i });
      await user.click(submitButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });
});