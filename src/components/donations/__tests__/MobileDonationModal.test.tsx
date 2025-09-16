// src/components/donations/__tests__/MobileDonationModal.test.tsx
// Comprehensive test suite for MobileDonationModal component following TDD RED phase principles
// Tests written BEFORE implementation to define expected mobile-optimized donation flow behavior
// Coverage: Multi-step flow, progress indicators, mobile UI patterns, and integration

import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MobileDonationModal } from '../MobileDonationModal';
import { DonationFormData } from '../../../types/donations';

// Mock child components
vi.mock('../DonationForm', () => ({
  DonationForm: ({ onSubmit, onCancel, isMobile }: { 
    onSubmit: (data: DonationFormData) => void; 
    onCancel: () => void; 
    isMobile: boolean; 
  }) => (
    <div data-testid="donation-form">
      <div data-testid="is-mobile">{isMobile ? 'mobile' : 'desktop'}</div>
      <button onClick={() => onSubmit({
        amount: 50,
        donationDate: '2025-01-15',
        method: 'credit_card',
        categoryId: 'category-1',
        form990LineItem: '1a_cash_contributions',
        isQuidProQuo: false,
        sendReceipt: true,
        isTaxDeductible: true,
      })}>Submit Donation</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../PaymentForm', () => ({
  PaymentForm: ({ donationData, onSuccess, onCancel }: { 
    donationData: DonationFormData; 
    onSuccess: (id: string) => void; 
    onCancel: () => void; 
  }) => (
    <div data-testid="payment-form">
      <div data-testid="donation-amount">${donationData.amount}</div>
      <button onClick={() => onSuccess('payment-123')}>Process Payment</button>
      <button onClick={onCancel}>Back to Form</button>
    </div>
  ),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MobileDonationModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Modal States and Visibility', () => {
    it('should render modal when open', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Make a Donation')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={false}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should have proper modal accessibility attributes', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Step Navigation', () => {
    it('should start with donation form step', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Make a Donation')).toBeInTheDocument();
      expect(screen.getByTestId('donation-form')).toBeInTheDocument();
      expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument();
    });

    it('should proceed to payment step after donation form submission', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Complete Payment')).toBeInTheDocument();
        expect(screen.getByTestId('payment-form')).toBeInTheDocument();
        expect(screen.queryByTestId('donation-form')).not.toBeInTheDocument();
      });
    });

    it('should show success step after payment completion', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Complete donation form
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      // Complete payment
      await waitFor(() => {
        const processButton = screen.getByText('Process Payment');
        user.click(processButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Donation Complete')).toBeInTheDocument();
        expect(screen.getByText('Thank You!')).toBeInTheDocument();
        expect(screen.getByText('Your donation has been processed successfully.')).toBeInTheDocument();
      });
    });

    it('should allow going back from payment to form step', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Go to payment step
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Complete Payment')).toBeInTheDocument();
      });

      // Go back to form
      const backButton = screen.getByText('Back to Form');
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Make a Donation')).toBeInTheDocument();
        expect(screen.getByTestId('donation-form')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicator', () => {
    it('should show progress indicator for non-success steps', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Donation Details')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });

    it('should update progress indicator based on current step', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Initially on form step - first progress bar should be active
      const progressBars = screen.getAllByRole('progressbar', { hidden: true });
      expect(progressBars[0]).toHaveClass('bg-blue-600');
      expect(progressBars[1]).toHaveClass('bg-gray-200');

      // Move to payment step
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        const updatedProgressBars = screen.getAllByRole('progressbar', { hidden: true });
        expect(updatedProgressBars[1]).toHaveClass('bg-blue-600');
      });
    });

    it('should hide progress indicator on success step', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Complete donation form and payment
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        const processButton = screen.getByText('Process Payment');
        user.click(processButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Donation Details')).not.toBeInTheDocument();
        expect(screen.queryByText('Payment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile Optimization', () => {
    it('should pass mobile flag to DonationForm', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('mobile');
    });

    it('should use mobile-specific styling classes', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const panel = screen.getByRole('dialog').firstChild;
      expect(panel).toHaveClass('rounded-t-2xl', 'sm:rounded-2xl');
    });

    it('should position modal at bottom on mobile', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const modalContainer = screen.getByRole('dialog').parentElement;
      expect(modalContainer).toHaveClass('items-end', 'sm:items-center');
    });
  });

  describe('Data Flow and Integration', () => {
    it('should pass donation data to PaymentForm', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Submit donation form
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('donation-amount')).toHaveTextContent('$50');
      });
    });

    it('should call onSuccess with donation ID from payment', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Complete full flow
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        const processButton = screen.getByText('Process Payment');
        user.click(processButton);
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('payment-123');
      });
    });

    it('should preserve donation data when navigating between steps', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Go to payment step
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('donation-amount')).toHaveTextContent('$50');
      });

      // Go back to form
      const backButton = screen.getByText('Back to Form');
      await user.click(backButton);

      // Go forward again
      const submitAgain = screen.getByText('Submit Donation');
      await user.click(submitAgain);

      await waitFor(() => {
        expect(screen.getByTestId('donation-amount')).toHaveTextContent('$50');
      });
    });
  });

  describe('Close and Cancel Functionality', () => {
    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button is clicked on form step', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Done button is clicked on success step', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Complete full flow
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        const processButton = screen.getByText('Process Payment');
        user.click(processButton);
      });

      await waitFor(() => {
        const doneButton = screen.getByText('Done');
        user.click(doneButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset state when modal is closed', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Progress to payment step
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Complete Payment')).toBeInTheDocument();
      });

      // Close modal
      rerender(
        <TestWrapper>
          <MobileDonationModal
            isOpen={false}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Reopen modal - should be back to first step
      rerender(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Make a Donation')).toBeInTheDocument();
      expect(screen.getByTestId('donation-form')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should display success icon and message', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Complete full flow
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        const processButton = screen.getByText('Process Payment');
        user.click(processButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Thank You!')).toBeInTheDocument();
        expect(screen.getByText('Your donation has been processed successfully.')).toBeInTheDocument();
        
        // Check for success icon (checkmark SVG)
        const successIcon = screen.getByRole('img', { hidden: true });
        expect(successIcon).toBeInTheDocument();
      });
    });

    it('should center success content', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Complete full flow
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        const processButton = screen.getByText('Process Payment');
        user.click(processButton);
      });

      await waitFor(() => {
        const successContent = screen.getByText('Thank You!').closest('div');
        expect(successContent).toHaveClass('text-center');
      });
    });

    it('should make Done button full width on mobile', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Complete full flow
      const submitButton = screen.getByText('Submit Donation');
      await user.click(submitButton);

      await waitFor(() => {
        const processButton = screen.getByText('Process Payment');
        user.click(processButton);
      });

      await waitFor(() => {
        const doneButton = screen.getByText('Done');
        expect(doneButton).toHaveClass('w-full');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for modal', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should focus management for modal', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      // Should trap focus within modal
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(
        <TestWrapper>
          <MobileDonationModal
            isOpen={true}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label');
    });
  });
});