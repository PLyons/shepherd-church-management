import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Stripe from 'stripe';
import type {
  CreatePaymentIntentRequest,
  StripeConfig,
} from '../../../types/donations';

// Mock Stripe SDK
const mockStripe = {
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn(),
  },
  setupIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  paymentMethods: {
    list: vi.fn(),
    detach: vi.fn(),
  },
  subscriptions: {
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    retrieve: vi.fn(),
  },
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
};

vi.mock('../../../lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-123',
      getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
    },
  },
}));

import { StripeService } from '../stripe.service';

describe('StripeService', () => {
  let stripeService: StripeService;
  const mockConfig: StripeConfig = {
    publicKey: 'pk_test_mock',
    webhookSecret: 'whsec_test_mock',
    currency: 'usd',
    minDonationAmount: 100, // $1.00
    maxDonationAmount: 1000000, // $10,000.00
    allowedCountries: ['US'],
    enableApplePay: true,
    enableGooglePay: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    stripeService = new StripeService(mockConfig, mockStripe as Stripe);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const request: CreatePaymentIntentRequest = {
        amount: 5000, // $50.00
        currency: 'usd',
        memberId: 'member-123',
        donationCategoryId: 'category-456',
        paymentMethodId: 'pm_test_123',
        description: 'Test donation',
        receiptEmail: 'test@example.com',
      };

      const mockResponse = {
        id: 'pi_test_123',
        status: 'requires_confirmation',
        client_secret: 'pi_test_123_secret_abc',
        amount: 5000,
        currency: 'usd',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockResponse);

      const result = await stripeService.createPaymentIntent(request);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        payment_method: 'pm_test_123',
        confirmation_method: 'automatic',
        description: 'Test donation',
        receipt_email: 'test@example.com',
        metadata: {
          memberId: 'member-123',
          donationCategoryId: 'category-456',
          source: 'shepherd-cms',
        },
      });

      expect(result).toEqual({
        id: 'pi_test_123',
        status: 'requires_confirmation',
        clientSecret: 'pi_test_123_secret_abc',
        amount: 5000,
        currency: 'usd',
        paymentMethodId: 'pm_test_123',
      });
    });

    it('should handle payment intent creation errors', async () => {
      const request: CreatePaymentIntentRequest = {
        amount: 5000,
        currency: 'usd',
        memberId: 'member-123',
        donationCategoryId: 'category-456',
        paymentMethodId: 'pm_invalid',
      };

      const mockError = {
        type: 'card_error',
        code: 'card_declined',
        message: 'Your card was declined.',
      };

      mockStripe.paymentIntents.create.mockRejectedValue(mockError);

      const result = await stripeService.createPaymentIntent(request);

      expect(result.error).toEqual({
        code: 'card_declined',
        message: 'Your card was declined.',
        type: 'card_error',
      });
    });
  });

  describe('createSetupIntent', () => {
    it('should create a setup intent for saving payment methods', async () => {
      const mockResponse = {
        id: 'seti_test_123',
        status: 'requires_payment_method',
        client_secret: 'seti_test_123_secret_abc',
      };

      mockStripe.setupIntents.create.mockResolvedValue(mockResponse);

      const result = await stripeService.createSetupIntent('member-123');

      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        usage: 'off_session',
        metadata: {
          memberId: 'member-123',
          source: 'shepherd-cms',
        },
      });

      expect(result).toEqual({
        id: 'seti_test_123',
        status: 'requires_payment_method',
        clientSecret: 'seti_test_123_secret_abc',
      });
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const mockConfirmResponse = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockConfirmResponse);

      const result = await stripeService.processPayment('pi_test_123');

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_test_123'
      );
      expect(result.status).toBe('succeeded');
    });

    it('should handle payment processing failures', async () => {
      const mockError = {
        type: 'card_error',
        code: 'insufficient_funds',
        message: 'Your card has insufficient funds.',
      };

      mockStripe.paymentIntents.confirm.mockRejectedValue(mockError);

      const result = await stripeService.processPayment('pi_test_123');

      expect(result.error).toEqual({
        code: 'insufficient_funds',
        message: 'Your card has insufficient funds.',
        type: 'card_error',
      });
    });
  });

  describe('setupRecurringDonation', () => {
    it('should create a recurring donation subscription', async () => {
      const recurringData = {
        memberId: 'member-123',
        amount: 10000, // $100.00
        frequency: 'monthly' as const,
        paymentMethodId: 'pm_test_123',
        categoryId: 'category-456',
        description: 'Monthly tithe',
      };

      const mockSubscription = {
        id: 'sub_test_123',
        status: 'active',
        items: {
          data: [
            {
              price: {
                unit_amount: 10000,
                currency: 'usd',
                recurring: { interval: 'month' },
              },
            },
          ],
        },
        current_period_start: 1640995200, // 2022-01-01
        current_period_end: 1643673600, // 2022-02-01
      };

      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription);

      const result = await stripeService.setupRecurringDonation(recurringData);

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: expect.any(String),
        items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: 10000,
              recurring: { interval: 'month' },
              product_data: {
                name: 'Monthly tithe',
                metadata: {
                  categoryId: 'category-456',
                  source: 'shepherd-cms',
                },
              },
            },
          },
        ],
        default_payment_method: 'pm_test_123',
        metadata: {
          memberId: 'member-123',
          categoryId: 'category-456',
          source: 'shepherd-cms',
        },
      });

      expect(result.id).toBe('sub_test_123');
      expect(result.status).toBe('active');
    });
  });

  describe('getPaymentMethods', () => {
    it('should retrieve saved payment methods for a member', async () => {
      const mockPaymentMethods = {
        data: [
          {
            id: 'pm_test_123',
            type: 'card',
            customer: 'cus_test_123',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025,
            },
          },
        ],
      };

      mockStripe.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

      const result = await stripeService.getPaymentMethods('member-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'pm_test_123',
        type: 'card',
        customerId: 'cus_member-123',
        card: {
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
        },
      });
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete a payment method successfully', async () => {
      mockStripe.paymentMethods.detach.mockResolvedValue({ id: 'pm_test_123' });

      const result = await stripeService.deletePaymentMethod('pm_test_123');

      expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith(
        'pm_test_123'
      );
      expect(result).toBe(true);
    });

    it('should handle deletion errors gracefully', async () => {
      mockStripe.paymentMethods.detach.mockRejectedValue(
        new Error('Payment method not found')
      );

      const result = await stripeService.deletePaymentMethod('pm_invalid');

      expect(result).toBe(false);
    });
  });

  describe('cancelRecurringDonation', () => {
    it('should cancel a subscription successfully', async () => {
      mockStripe.subscriptions.cancel.mockResolvedValue({
        id: 'sub_test_123',
        status: 'canceled',
      });

      const result =
        await stripeService.cancelRecurringDonation('sub_test_123');

      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith(
        'sub_test_123'
      );
      expect(result).toBe(true);
    });
  });

  describe('updateRecurringDonation', () => {
    it('should update a subscription amount', async () => {
      const mockUpdatedSubscription = {
        id: 'sub_test_123',
        status: 'active',
        metadata: {
          memberId: 'member-123',
          categoryId: 'category-456',
        },
        current_period_start: 1640995200,
        current_period_end: 1643673600,
        default_payment_method: 'pm_test_123',
        items: {
          data: [
            {
              id: 'si_test_123',
              price: {
                unit_amount: 15000,
                currency: 'usd',
              },
            },
          ],
        },
      };

      // Mock retrieve for getting current subscription
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_test_123',
        items: {
          data: [
            {
              id: 'si_test_123',
            },
          ],
        },
      });

      mockStripe.subscriptions.update.mockResolvedValue(
        mockUpdatedSubscription
      );

      const result = await stripeService.updateRecurringDonation(
        'sub_test_123',
        {
          amount: 15000, // $150.00
        }
      );

      expect(result.id).toBe('sub_test_123');
      expect(result.status).toBe('active');
    });
  });

  describe('retryPayment', () => {
    it('should retry a failed payment successfully', async () => {
      const mockRetryResponse = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
      };

      mockStripe.paymentIntents.confirm.mockResolvedValue(mockRetryResponse);

      const result = await stripeService.retryPayment('pi_test_123');

      expect(mockStripe.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_test_123'
      );
      expect(result.status).toBe('succeeded');
    });
  });

  describe('validateConfig', () => {
    it('should validate Stripe configuration successfully', () => {
      expect(() => stripeService.validateConfig()).not.toThrow();
    });

    it('should throw error for invalid configuration', () => {
      const invalidConfig = { ...mockConfig, publicKey: '' };
      const invalidService = new StripeService(
        invalidConfig,
        mockStripe as Stripe
      );

      expect(() => invalidService.validateConfig()).toThrow(
        'Invalid Stripe configuration'
      );
    });
  });
});
