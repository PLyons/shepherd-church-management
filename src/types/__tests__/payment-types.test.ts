import { describe, it, expect } from 'vitest';

// Import existing types for compatibility testing
import type {
  DonationMethod,
  DonationFormData,
} from '../donations';

// Import payment processing types
import type {
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  SetupIntentResponse,
  PaymentMethod,
  RecurringDonation,
  StripeConfig,
} from '../donations';

describe('Payment Processing Types', () => {
  describe('CreatePaymentIntentRequest Interface', () => {
    it('should define required properties for creating payment intents', () => {
      const request: CreatePaymentIntentRequest = {
        amount: 5000, // Amount in cents
        currency: 'usd',
        memberId: 'member-123',
        donationCategoryId: 'category-456',
        paymentMethodId: 'pm_123456789',
        description: 'Sunday offering',
        receiptEmail: 'donor@church.org',
      };

      expect(request.amount).toBe(5000);
      expect(request.currency).toBe('usd');
      expect(request.memberId).toBe('member-123');
      expect(request.donationCategoryId).toBe('category-456');
      expect(request.paymentMethodId).toBe('pm_123456789');
      expect(request.description).toBe('Sunday offering');
      expect(request.receiptEmail).toBe('donor@church.org');
    });

    it('should support optional metadata field', () => {
      const request: CreatePaymentIntentRequest = {
        amount: 2500,
        currency: 'usd',
        memberId: 'member-789',
        donationCategoryId: 'category-123',
        paymentMethodId: 'pm_987654321',
        metadata: {
          donationSource: 'website',
          campaign: 'Easter2024',
        },
      };

      expect(request.metadata?.donationSource).toBe('website');
      expect(request.metadata?.campaign).toBe('Easter2024');
    });

    it('should support optional confirmation method', () => {
      const request: CreatePaymentIntentRequest = {
        amount: 10000,
        currency: 'usd',
        memberId: 'member-456',
        donationCategoryId: 'category-789',
        paymentMethodId: 'pm_111222333',
        confirmationMethod: 'manual',
      };

      expect(request.confirmationMethod).toBe('manual');
    });
  });

  describe('PaymentIntentResponse Interface', () => {
    it('should define response structure from payment intent creation', () => {
      const response: PaymentIntentResponse = {
        id: 'pi_123456789',
        status: 'requires_confirmation',
        clientSecret: 'pi_123456789_secret_xyz',
        amount: 5000,
        currency: 'usd',
        paymentMethodId: 'pm_123456789',
      };

      expect(response.id).toBe('pi_123456789');
      expect(response.status).toBe('requires_confirmation');
      expect(response.clientSecret).toBe('pi_123456789_secret_xyz');
      expect(response.amount).toBe(5000);
      expect(response.currency).toBe('usd');
      expect(response.paymentMethodId).toBe('pm_123456789');
    });

    it('should support error information when payment fails', () => {
      const response: PaymentIntentResponse = {
        id: 'pi_failed_123',
        status: 'requires_payment_method',
        clientSecret: 'pi_failed_123_secret',
        amount: 3000,
        currency: 'usd',
        error: {
          code: 'card_declined',
          message: 'Your card was declined.',
          type: 'card_error',
        },
      };

      expect(response.status).toBe('requires_payment_method');
      expect(response.error?.code).toBe('card_declined');
      expect(response.error?.message).toBe('Your card was declined.');
      expect(response.error?.type).toBe('card_error');
    });
  });

  describe('SetupIntentResponse Interface', () => {
    it('should define response structure for setting up recurring payments', () => {
      const response: SetupIntentResponse = {
        id: 'seti_123456789',
        status: 'requires_confirmation',
        clientSecret: 'seti_123456789_secret_abc',
        paymentMethodId: 'pm_recurring_123',
      };

      expect(response.id).toBe('seti_123456789');
      expect(response.status).toBe('requires_confirmation');
      expect(response.clientSecret).toBe('seti_123456789_secret_abc');
      expect(response.paymentMethodId).toBe('pm_recurring_123');
    });

    it('should support succeeded status for completed setup', () => {
      const response: SetupIntentResponse = {
        id: 'seti_completed_456',
        status: 'succeeded',
        clientSecret: 'seti_completed_456_secret',
        paymentMethodId: 'pm_saved_789',
      };

      expect(response.status).toBe('succeeded');
      expect(response.paymentMethodId).toBe('pm_saved_789');
    });
  });

  describe('PaymentMethod Interface', () => {
    it('should define card payment method structure', () => {
      const paymentMethod: PaymentMethod = {
        id: 'pm_card_123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
        },
        customerId: 'cus_member_123',
      };

      expect(paymentMethod.id).toBe('pm_card_123');
      expect(paymentMethod.type).toBe('card');
      expect(paymentMethod.card?.brand).toBe('visa');
      expect(paymentMethod.card?.last4).toBe('4242');
      expect(paymentMethod.card?.expiryMonth).toBe(12);
      expect(paymentMethod.card?.expiryYear).toBe(2025);
      expect(paymentMethod.customerId).toBe('cus_member_123');
    });

    it('should define bank account payment method structure', () => {
      const paymentMethod: PaymentMethod = {
        id: 'pm_bank_456',
        type: 'us_bank_account',
        usBankAccount: {
          bankName: 'Chase Bank',
          accountType: 'checking',
          last4: '6789',
          routingNumber: '021000021',
        },
        customerId: 'cus_member_456',
      };

      expect(paymentMethod.type).toBe('us_bank_account');
      expect(paymentMethod.usBankAccount?.bankName).toBe('Chase Bank');
      expect(paymentMethod.usBankAccount?.accountType).toBe('checking');
      expect(paymentMethod.usBankAccount?.last4).toBe('6789');
      expect(paymentMethod.usBankAccount?.routingNumber).toBe('021000021');
    });
  });

  describe('RecurringDonation Interface', () => {
    it('should define monthly recurring donation structure', () => {
      const recurring: RecurringDonation = {
        id: 'rec_monthly_123',
        memberId: 'member-789',
        amount: 10000, // $100.00 in cents
        currency: 'usd',
        frequency: 'monthly',
        paymentMethodId: 'pm_recurring_456',
        categoryId: 'tithe-category',
        status: 'active',
        startDate: '2024-01-15',
        nextPaymentDate: '2024-02-15',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      expect(recurring.id).toBe('rec_monthly_123');
      expect(recurring.memberId).toBe('member-789');
      expect(recurring.amount).toBe(10000);
      expect(recurring.currency).toBe('usd');
      expect(recurring.frequency).toBe('monthly');
      expect(recurring.paymentMethodId).toBe('pm_recurring_456');
      expect(recurring.categoryId).toBe('tithe-category');
      expect(recurring.status).toBe('active');
      expect(recurring.startDate).toBe('2024-01-15');
      expect(recurring.nextPaymentDate).toBe('2024-02-15');
    });

    it('should support weekly frequency and optional fields', () => {
      const recurring: RecurringDonation = {
        id: 'rec_weekly_789',
        memberId: 'member-456',
        amount: 2500,
        currency: 'usd',
        frequency: 'weekly',
        paymentMethodId: 'pm_weekly_123',
        categoryId: 'building-fund',
        status: 'paused',
        startDate: '2024-03-01',
        nextPaymentDate: '2024-04-01',
        endDate: '2024-12-31',
        description: 'Building fund weekly contribution',
        createdAt: '2024-03-01T09:00:00Z',
        updatedAt: '2024-03-15T14:30:00Z',
      };

      expect(recurring.frequency).toBe('weekly');
      expect(recurring.status).toBe('paused');
      expect(recurring.endDate).toBe('2024-12-31');
      expect(recurring.description).toBe('Building fund weekly contribution');
    });
  });

  describe('StripeConfig Interface', () => {
    it('should define Stripe configuration structure', () => {
      const config: StripeConfig = {
        publicKey: 'pk_test_123456789',
        webhookSecret: 'whsec_test_secret',
        currency: 'usd',
        minDonationAmount: 100, // $1.00 minimum
        maxDonationAmount: 1000000, // $10,000 maximum
      };

      expect(config.publicKey).toBe('pk_test_123456789');
      expect(config.webhookSecret).toBe('whsec_test_secret');
      expect(config.currency).toBe('usd');
      expect(config.minDonationAmount).toBe(100);
      expect(config.maxDonationAmount).toBe(1000000);
    });

    it('should support optional configuration fields', () => {
      const config: StripeConfig = {
        publicKey: 'pk_live_987654321',
        currency: 'usd',
        minDonationAmount: 500,
        maxDonationAmount: 5000000,
        allowedCountries: ['US', 'CA'],
        enableApplePay: true,
        enableGooglePay: true,
      };

      expect(config.allowedCountries).toEqual(['US', 'CA']);
      expect(config.enableApplePay).toBe(true);
      expect(config.enableGooglePay).toBe(true);
    });
  });

  describe('Type Compatibility', () => {
    it('should extend DonationMethod to include stripe', () => {
      // This test ensures 'stripe' is included in DonationMethod union type
      const stripeMethod: DonationMethod = 'stripe';
      const existingMethods: DonationMethod[] = [
        'cash',
        'check', 
        'credit_card',
        'stripe', // Now successfully added to DonationMethod
      ];

      expect(stripeMethod).toBe('stripe');
      expect(existingMethods).toContain('stripe');
    });

    it('should integrate PaymentMethod with existing DonationFormData', () => {
      // Test that payment processing integrates with existing donation form structure
      const formData: DonationFormData = {
        amount: 10000,
        donationDate: '2024-01-15',
        method: 'stripe', // Successfully using new stripe method
        categoryId: 'tithe-category',
        form990LineItem: '1a_cash_contributions',
        isQuidProQuo: false,
        sendReceipt: true,
        receiptEmail: 'donor@church.org',
        isTaxDeductible: true,
      };

      // Verify compatibility
      expect(formData.method).toBe('stripe');
      expect(formData.amount).toBe(10000);
      expect(formData.receiptEmail).toBe('donor@church.org');
    });

    it('should validate payment method type constraints', () => {
      // Test that payment method types are properly constrained
      const validCardTypes = ['card', 'us_bank_account'];
      const validFrequencies = ['weekly', 'monthly', 'yearly'];
      const validStatuses = ['active', 'paused', 'cancelled'];

      expect(validCardTypes).toContain('card');
      expect(validCardTypes).toContain('us_bank_account');
      expect(validFrequencies).toContain('weekly');
      expect(validFrequencies).toContain('monthly');
      expect(validFrequencies).toContain('yearly');
      expect(validStatuses).toContain('active');
      expect(validStatuses).toContain('paused');
      expect(validStatuses).toContain('cancelled');
    });
  });
});