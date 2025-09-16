// src/components/donations/PaymentErrorHandler.tsx
// User-friendly error handling component for payment processing failures
// Provides error message translation, retry logic, and progressive enhancement

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { stripeService } from '../../services/payment/stripe-client.service';

interface PaymentErrorHandlerProps {
  error: string;
  paymentIntentId?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const PaymentErrorHandler: React.FC<PaymentErrorHandlerProps> = ({
  error,
  paymentIntentId,
  onRetry,
  onCancel,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (paymentIntentId) {
      setIsRetrying(true);
      try {
        const result = await stripeService.retryPayment(paymentIntentId);
        if (result.success) {
          onRetry?.();
        }
      } catch (error) {
        console.error('Retry failed:', error);
      } finally {
        setIsRetrying(false);
      }
    } else {
      onRetry?.();
    }
  };

  const getErrorMessage = (error: string): string => {
    if (error.includes('card_declined')) {
      return 'Your card was declined. Please try a different payment method.';
    }
    if (error.includes('insufficient_funds')) {
      return 'Insufficient funds. Please try a different payment method.';
    }
    if (error.includes('expired_card')) {
      return 'Your card has expired. Please use a different payment method.';
    }
    if (error.includes('incorrect_cvc')) {
      return 'Your card security code is incorrect. Please check and try again.';
    }
    return error || 'An unexpected error occurred. Please try again.';
  };

  return (
    <div
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <AlertTriangle
          className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1"
          role="img"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Payment Error
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">
            {getErrorMessage(error)}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Try Again
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 text-sm bg-transparent text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
