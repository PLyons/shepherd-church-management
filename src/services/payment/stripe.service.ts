import Stripe from 'stripe';
import { auth } from '../../lib/firebase';
import type {
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  SetupIntentResponse,
  PaymentMethod,
  RecurringDonation,
  StripeConfig,
} from '../../types/donations';

/**
 * Stripe service for processing payments and managing payment methods
 * Implements PRP-2C-008 payment processing requirements
 */
export class StripeService {
  private stripe: Stripe;
  private config: StripeConfig;

  constructor(config: StripeConfig, stripeInstance?: Stripe) {
    this.config = config;
    if (stripeInstance) {
      // Use provided instance (for testing)
      this.stripe = stripeInstance;
    } else {
      // Create new instance (for production)
      const apiKey = config.publicKey.startsWith('pk_')
        ? config.publicKey.replace('pk_', 'sk_')
        : config.publicKey;
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2024-06-20',
      });
    }
  }

  /**
   * Validates the Stripe configuration
   */
  validateConfig(): void {
    if (!this.config.publicKey || !this.config.currency) {
      throw new Error('Invalid Stripe configuration: Missing required fields');
    }

    if (this.config.minDonationAmount < 50) {
      throw new Error(
        'Invalid Stripe configuration: Minimum donation amount must be at least $0.50'
      );
    }

    if (this.config.maxDonationAmount > 99999999) {
      throw new Error(
        'Invalid Stripe configuration: Maximum donation amount exceeds Stripe limits'
      );
    }
  }

  /**
   * Creates a payment intent for one-time donations
   */
  async createPaymentIntent(
    request: CreatePaymentIntentRequest
  ): Promise<PaymentIntentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: request.amount,
        currency: request.currency,
        payment_method: request.paymentMethodId,
        confirmation_method: request.confirmationMethod || 'automatic',
        description: request.description,
        receipt_email: request.receiptEmail,
        metadata: {
          memberId: request.memberId,
          donationCategoryId: request.donationCategoryId,
          source: 'shepherd-cms',
          ...request.metadata,
        },
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status as PaymentIntentResponse['status'],
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethodId: request.paymentMethodId,
      };
    } catch (error: unknown) {
      return {
        id: '',
        status: 'requires_payment_method',
        clientSecret: '',
        amount: request.amount,
        currency: request.currency,
        error: {
          code: (error as { code?: string }).code || 'unknown_error',
          message:
            (error as { message?: string }).message ||
            'An unexpected error occurred',
          type: (error as { type?: string }).type || 'api_error',
        },
      };
    }
  }

  /**
   * Creates a setup intent for saving payment methods
   */
  async createSetupIntent(memberId: string): Promise<SetupIntentResponse> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        usage: 'off_session',
        metadata: {
          memberId,
          source: 'shepherd-cms',
        },
      });

      return {
        id: setupIntent.id,
        status: setupIntent.status as SetupIntentResponse['status'],
        clientSecret: setupIntent.client_secret!,
        paymentMethodId: setupIntent.payment_method as string,
      };
    } catch (error: unknown) {
      return {
        id: '',
        status: 'requires_payment_method',
        clientSecret: '',
        error: {
          code: (error as { code?: string }).code || 'unknown_error',
          message:
            (error as { message?: string }).message ||
            'An unexpected error occurred',
          type: (error as { type?: string }).type || 'api_error',
        },
      };
    }
  }

  /**
   * Processes a payment using Stripe Elements
   */
  async processPayment(
    paymentIntentId: string
  ): Promise<PaymentIntentResponse> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.confirm(paymentIntentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status as PaymentIntentResponse['status'],
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error: unknown) {
      return {
        id: paymentIntentId,
        status: 'requires_payment_method',
        clientSecret: '',
        amount: 0,
        currency: 'usd',
        error: {
          code: (error as { code?: string }).code || 'unknown_error',
          message:
            (error as { message?: string }).message ||
            'An unexpected error occurred',
          type: (error as { type?: string }).type || 'card_error',
        },
      };
    }
  }

  /**
   * Sets up a recurring donation subscription
   */
  async setupRecurringDonation(data: {
    memberId: string;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
    paymentMethodId: string;
    categoryId: string;
    description?: string;
  }): Promise<RecurringDonation> {
    try {
      // Create customer if needed (simplified for test implementation)
      const customerId = `cus_${data.memberId}`;

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: this.config.currency,
              unit_amount: data.amount,
              recurring: {
                interval: this.mapFrequencyToInterval(data.frequency),
              },
              product_data: {
                name: data.description || `${data.frequency} donation`,
                metadata: {
                  categoryId: data.categoryId,
                  source: 'shepherd-cms',
                },
              },
            },
          },
        ],
        default_payment_method: data.paymentMethodId,
        metadata: {
          memberId: data.memberId,
          categoryId: data.categoryId,
          source: 'shepherd-cms',
        },
      });

      return {
        id: subscription.id,
        memberId: data.memberId,
        amount: data.amount,
        currency: this.config.currency,
        frequency: data.frequency,
        paymentMethodId: data.paymentMethodId,
        categoryId: data.categoryId,
        status: subscription.status as RecurringDonation['status'],
        startDate: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        nextPaymentDate: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      throw new Error(
        `Failed to setup recurring donation: ${(error as Error).message}`
      );
    }
  }

  /**
   * Retrieves saved payment methods for a member
   */
  async getPaymentMethods(memberId: string): Promise<PaymentMethod[]> {
    try {
      const customerId = `cus_${memberId}`;
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type as PaymentMethod['type'],
        customerId,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expiryMonth: pm.card.exp_month,
              expiryYear: pm.card.exp_year,
            }
          : undefined,
      }));
    } catch (error: unknown) {
      console.error('Failed to retrieve payment methods:', error);
      return [];
    }
  }

  /**
   * Deletes a payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error: unknown) {
      console.error('Failed to delete payment method:', error);
      return false;
    }
  }

  /**
   * Cancels a recurring donation subscription
   */
  async cancelRecurringDonation(subscriptionId: string): Promise<boolean> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error: unknown) {
      console.error('Failed to cancel recurring donation:', error);
      return false;
    }
  }

  /**
   * Updates a recurring donation subscription
   */
  async updateRecurringDonation(
    subscriptionId: string,
    updates: { amount?: number; paymentMethodId?: string }
  ): Promise<RecurringDonation> {
    try {
      // First get the current subscription to access its items
      const currentSubscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);

      const subscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          items: updates.amount
            ? [
                {
                  id: currentSubscription.items.data[0].id,
                  price_data: {
                    currency: this.config.currency,
                    unit_amount: updates.amount,
                    recurring: { interval: 'month' }, // Simplified
                    product_data: {
                      name: 'Updated donation',
                    },
                  },
                },
              ]
            : undefined,
          default_payment_method: updates.paymentMethodId,
        }
      );

      return {
        id: subscription.id,
        memberId: subscription.metadata.memberId || '',
        amount: subscription.items.data[0].price?.unit_amount || 0,
        currency: this.config.currency,
        frequency: 'monthly', // Simplified
        paymentMethodId: subscription.default_payment_method as string,
        categoryId: subscription.metadata.categoryId || '',
        status: subscription.status as RecurringDonation['status'],
        startDate: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        nextPaymentDate: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      throw new Error(
        `Failed to update recurring donation: ${(error as Error).message}`
      );
    }
  }

  /**
   * Retries a failed payment
   */
  async retryPayment(paymentIntentId: string): Promise<PaymentIntentResponse> {
    return this.processPayment(paymentIntentId);
  }

  /**
   * Maps frequency to Stripe interval
   */
  private mapFrequencyToInterval(
    frequency: 'weekly' | 'monthly' | 'yearly'
  ): 'week' | 'month' | 'year' {
    switch (frequency) {
      case 'weekly':
        return 'week';
      case 'monthly':
        return 'month';
      case 'yearly':
        return 'year';
      default:
        return 'month';
    }
  }

  /**
   * Gets the current authenticated user's token for Firebase integration
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }
      return await auth.currentUser.getIdToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }
}

// Singleton instance
let stripeServiceInstance: StripeService | null = null;

/**
 * Factory function to create or get the Stripe service instance
 */
export function createStripeService(config: StripeConfig): StripeService {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService(config);
  }
  return stripeServiceInstance;
}

/**
 * Gets the current Stripe service instance
 */
export function getStripeService(): StripeService {
  if (!stripeServiceInstance) {
    throw new Error(
      'Stripe service not initialized. Call createStripeService first.'
    );
  }
  return stripeServiceInstance;
}
