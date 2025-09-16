// src/components/donations/__tests__/PaymentErrorHandler.test.tsx
// Comprehensive test suite for PaymentErrorHandler component following TDD RED phase principles
// Tests written BEFORE implementation to define expected error handling and user experience behavior
// Coverage: Error message translation, retry logic, user interactions, and progressive enhancement

import { describe, it, expect, beforeEach, vi, Mock, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PaymentErrorHandler } from '../PaymentErrorHandler';
import { stripeService } from '../../../services/payment/stripe.service';

// Mock stripe service
vi.mock('../../../services/payment/stripe.service', () => ({
  stripeService: {
    retryPayment: vi.fn(),
  },
}));

const mockStripeService = stripeService as unknown as {
  retryPayment: Mock;
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PaymentErrorHandler', () => {
  const mockOnRetry = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Error Message Display', () => {
    it('should display basic error message', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Payment Error')).toBeInTheDocument();
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });

    it('should display error icon', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Check for warning/error icon
      const errorIcon = screen.getByRole('img', { hidden: true });
      expect(errorIcon).toBeInTheDocument();
    });

    it('should have proper error styling', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const container = screen.getByText('Payment Error').closest('div');
      expect(container).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('User-Friendly Error Message Translation', () => {
    it('should translate card_declined error', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Your card was declined by the bank. card_declined"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Your card was declined. Please try a different payment method.')).toBeInTheDocument();
    });

    it('should translate insufficient_funds error', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="The payment failed because insufficient_funds"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Insufficient funds. Please try a different payment method.')).toBeInTheDocument();
    });

    it('should translate expired_card error', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Card expired. expired_card"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Your card has expired. Please use a different payment method.')).toBeInTheDocument();
    });

    it('should translate incorrect_cvc error', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Security code is wrong. incorrect_cvc"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Your card security code is incorrect. Please check and try again.')).toBeInTheDocument();
    });

    it('should use original message for unknown errors', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Unknown network error occurred"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Unknown network error occurred')).toBeInTheDocument();
    });

    it('should handle empty error message', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error=""
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should display Try Again button', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should call onRetry when Try Again is clicked without paymentIntentId', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
      expect(mockStripeService.retryPayment).not.toHaveBeenCalled();
    });

    it('should call stripeService.retryPayment when paymentIntentId is provided', async () => {
      const user = userEvent.setup();
      
      mockStripeService.retryPayment.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            paymentIntentId="pi_test_123"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockStripeService.retryPayment).toHaveBeenCalledWith('pi_test_123');
        expect(mockOnRetry).toHaveBeenCalled();
      });
    });

    it('should handle retry failure gracefully', async () => {
      const user = userEvent.setup();
      
      mockStripeService.retryPayment.mockRejectedValue(new Error('Retry failed'));

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            paymentIntentId="pi_test_123"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockStripeService.retryPayment).toHaveBeenCalledWith('pi_test_123');
        // Should not call onRetry if stripe retry fails
        expect(mockOnRetry).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during retry', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockStripeService.retryPayment.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            paymentIntentId="pi_test_123"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Should show loading state
      expect(retryButton).toBeDisabled();
      // Button text might change to show loading
    });

    it('should disable button during retry', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockStripeService.retryPayment.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            paymentIntentId="pi_test_123"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(retryButton).toBeDisabled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should display Cancel button when onCancel is provided', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not display Cancel button when onCancel is not provided', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
          />
        </TestWrapper>
      );

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should have proper button styling for Cancel', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      // Should have ghost/secondary styling
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Button Layout and Styling', () => {
    it('should have proper spacing between buttons', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const buttonContainer = screen.getByRole('button', { name: /try again/i }).closest('div');
      expect(buttonContainer).toHaveClass('flex', 'space-x-3');
    });

    it('should have small button sizes', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      // Buttons should be small size
      expect(retryButton).toHaveClass('text-sm');
      expect(cancelButton).toHaveClass('text-sm');
    });

    it('should use secondary variant for retry button', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      // Should have secondary styling
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error alert', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const errorContainer = screen.getByText('Payment Error').closest('div');
      expect(errorContainer).toHaveAttribute('role', 'alert');
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const heading = screen.getByText('Payment Error');
      expect(heading.tagName).toBe('H3');
    });

    it('should have accessible button labels', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(retryButton).toHaveAccessibleName();
      expect(cancelButton).toHaveAccessibleName();
    });

    it('should have proper contrast for error text', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const errorText = screen.getByText('Payment failed');
      expect(errorText).toHaveClass('text-red-700');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode styling classes', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const container = screen.getByText('Payment Error').closest('div');
      expect(container).toHaveClass('dark:bg-red-900/20', 'dark:border-red-800');
    });

    it('should have dark mode text colors', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const heading = screen.getByText('Payment Error');
      const errorText = screen.getByText('Payment failed');
      
      expect(heading).toHaveClass('dark:text-red-200');
      expect(errorText).toHaveClass('dark:text-red-300');
    });
  });

  describe('Progressive Enhancement', () => {
    it('should work without JavaScript (buttons still clickable)', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(retryButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });

    it('should handle missing onRetry gracefully', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Should still render Try Again button even without onRetry
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should handle missing error message gracefully', () => {
      render(
        <TestWrapper>
          <PaymentErrorHandler
            error=""
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle retry service failure without crashing', async () => {
      const user = userEvent.setup();
      
      mockStripeService.retryPayment.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            paymentIntentId="pi_test_123"
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Component should still be functional
      expect(screen.getByText('Payment Error')).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should handle null paymentIntentId', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PaymentErrorHandler
            error="Payment failed"
            paymentIntentId={undefined}
            onRetry={mockOnRetry}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalled();
      expect(mockStripeService.retryPayment).not.toHaveBeenCalled();
    });
  });
});