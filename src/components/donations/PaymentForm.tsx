// src/components/donations/PaymentForm.tsx
// Secure payment form component using Stripe Elements for donation processing
// Supports one-time and recurring donations with saved payment method management
// Mobile-responsive design following established component patterns

import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { DonationFormData, PaymentMethod } from '../../types/donations';
import { stripeService } from '../../services/payment/stripe-client.service';
// Using plain HTML buttons following existing component patterns
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useToast } from '../../contexts/ToastContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  donationData: DonationFormData;
  onSuccess: (donationId: string) => void;
  onCancel: () => void;
  isRecurring?: boolean;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  donationData,
  onSuccess,
  onCancel,
  isRecurring = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    PaymentMethod[]
  >([]);
  const [useNewCard, setUseNewCard] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializePayment = async () => {
      if (!user) return;

      try {
        // Load saved payment methods
        const paymentMethods = await stripeService.getPaymentMethods(user.uid);
        setSavedPaymentMethods(paymentMethods);

        // Create payment intent or setup intent
        if (isRecurring) {
          const { clientSecret } = await stripeService.createSetupIntent(
            user.uid
          );
          setClientSecret(clientSecret);
        } else {
          const { clientSecret } = await stripeService.createPaymentIntent({
            ...donationData,
            donorId: user.uid,
          } as any);
          setClientSecret(clientSecret);
        }
      } catch (error) {
        console.error('Payment initialization error:', error);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    initializePayment();
  }, [user, donationData, isRecurring]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    if (!useNewCard && !selectedPaymentMethod) {
      setError('Please select a payment method or use a new card.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      if (isRecurring) {
        // Handle recurring donation setup
        const result = await stripeService.setupRecurringDonation(
          elements,
          clientSecret,
          {
            ...donationData,
            donorId: user!.uid,
            startDate: new Date(),
            status: 'active',
            stripeSubscriptionId: '', // Will be set by service
          } as any
        );

        if (result.success && result.subscriptionId) {
          showToast('Recurring donation setup successfully!', 'success');
          onSuccess(result.subscriptionId);
        } else {
          setError(result.error || 'Failed to setup recurring donation');
        }
      } else {
        // Handle one-time payment
        const result = await stripeService.processPayment(
          elements,
          clientSecret,
          donationData
        );

        if (result.success && result.donationId) {
          showToast('Donation processed successfully!', 'success');
          onSuccess(result.donationId);
        } else {
          setError(result.error || 'Payment failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      {savedPaymentMethods.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Payment Method
          </h3>

          {/* Saved Payment Methods */}
          <div className="space-y-2">
            {savedPaymentMethods.map((method) => (
              <label key={method.id} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={!useNewCard && selectedPaymentMethod === method.id}
                  onChange={(e) => {
                    setUseNewCard(false);
                    setSelectedPaymentMethod(e.target.value);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  **** **** **** {method.card?.last4} (
                  {method.card?.brand.toUpperCase()})
                </span>
              </label>
            ))}
          </div>

          {/* New Card Option */}
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              name="paymentMethod"
              value="new"
              checked={useNewCard}
              onChange={() => {
                setUseNewCard(true);
                setSelectedPaymentMethod('');
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-900 dark:text-white">
              Use a new card
            </span>
          </label>
        </div>
      )}

      {/* Card Element */}
      {useNewCard && (
        <div className="space-y-4">
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
            <CardElement options={cardElementOptions} />
          </div>

          {/* Save Payment Method */}
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={savePaymentMethod}
              onChange={(e) => setSavePaymentMethod(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-900 dark:text-white">
              Save this payment method for future donations
            </span>
          </label>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing || !clientSecret}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? isRecurring
              ? 'Setting up...'
              : 'Processing...'
            : isRecurring
              ? 'Setup Recurring Gift'
              : `Donate $${donationData.amount}`}
        </button>
      </div>
    </form>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};
