// src/services/payment/stripe-client.service.ts
// Client-side Stripe service for payment processing
// Handles payment intents, setup intents, and payment method management for PRP-2C-008

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { 
  CreatePaymentIntentRequest, 
  PaymentMethod, 
  RecurringDonation,
  DonationFormData,
  PaymentIntentResponse,
  SetupIntentResponse 
} from '../../types/donations';
import { auth } from '../../lib/firebase';

export interface StripeConfig {
  publishableKey: string;
  webhookSecret?: string;
  apiVersion: string;
}

class StripeClientService {
  private stripe: Promise<Stripe | null>;
  private config: StripeConfig;

  constructor() {
    this.config = {
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET,
      apiVersion: '2023-10-16'
    };
    
    this.stripe = loadStripe(this.config.publishableKey);
  }

  /**
   * Create payment intent for one-time donation
   */
  async createPaymentIntent(data: CreatePaymentIntentRequest & { donorId: string }): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          amount: data.amount * 100, // Convert to cents
          currency: data.currency || 'usd',
          donorId: data.donorId,
          metadata: data.metadata || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment intent: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to initialize payment. Please try again.');
    }
  }

  /**
   * Create setup intent for saving payment method
   */
  async createSetupIntent(donorId: string): Promise<SetupIntentResponse> {
    try {
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({ donorId })
      });

      if (!response.ok) {
        throw new Error(`Failed to create setup intent: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw new Error('Failed to setup payment method. Please try again.');
    }
  }

  /**
   * Process one-time donation payment
   */
  async processPayment(
    elements: StripeElements, 
    clientSecret: string, 
    donationData: DonationFormData
  ): Promise<{ success: boolean; error?: string; donationId?: string }> {
    try {
      const stripe = await this.stripe;
      if (!stripe) throw new Error('Stripe not initialized');

      const { error: submitError } = await elements.submit();
      if (submitError) {
        return { success: false, error: submitError.message };
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (paymentIntent?.status === 'succeeded') {
        // Payment successful - webhook will handle donation recording
        return { 
          success: true, 
          donationId: paymentIntent.metadata.donationId 
        };
      }

      return { success: false, error: 'Payment was not completed successfully' };
    } catch (error) {
      console.error('Payment processing error:', error);
      return { 
        success: false, 
        error: 'Payment processing failed. Please try again.' 
      };
    }
  }

  /**
   * Setup recurring donation
   */
  async setupRecurringDonation(
    elements: StripeElements,
    clientSecret: string,
    recurringData: Omit<RecurringDonation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string; subscriptionId?: string }> {
    try {
      const stripe = await this.stripe;
      if (!stripe) throw new Error('Stripe not initialized');

      const { error: submitError } = await elements.submit();
      if (submitError) {
        return { success: false, error: submitError.message };
      }

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        redirect: 'if_required',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (setupIntent?.status === 'succeeded') {
        // Create subscription with saved payment method
        const subscription = await this.createSubscription(
          setupIntent.payment_method as string,
          recurringData
        );
        return { 
          success: true, 
          subscriptionId: subscription.subscriptionId 
        };
      }

      return { success: false, error: 'Payment method setup was not completed' };
    } catch (error) {
      console.error('Recurring donation setup error:', error);
      return { 
        success: false, 
        error: 'Failed to setup recurring donation. Please try again.' 
      };
    }
  }

  /**
   * Create Stripe subscription
   */
  private async createSubscription(
    paymentMethodId: string,
    recurringData: Omit<RecurringDonation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ subscriptionId: string }> {
    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          paymentMethodId,
          ...recurringData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create subscription: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create recurring donation. Please try again.');
    }
  }

  /**
   * Get saved payment methods for donor
   */
  async getPaymentMethods(donorId: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`/api/stripe/payment-methods/${donorId}`, {
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Delete saved payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/stripe/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }

  /**
   * Cancel recurring donation
   */
  async cancelRecurringDonation(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(paymentIntentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/stripe/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({ paymentIntentId })
      });

      if (!response.ok) {
        throw new Error(`Failed to retry payment: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('Error retrying payment:', error);
      return { 
        success: false, 
        error: 'Failed to retry payment. Please try again.' 
      };
    }
  }
}

export const stripeService = new StripeClientService();