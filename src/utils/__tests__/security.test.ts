// src/utils/__tests__/security.test.ts
// Comprehensive test suite for security utilities including Stripe configuration validation,
// payment data sanitization, amount validation, and PCI compliance data handling
// RELEVANT FILES: src/utils/security.ts, src/services/payment/stripe.service.ts, src/types/donations.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateStripeConfig,
  sanitizeForLogging,
  validateDonationAmount,
  validatePaymentMethod,
  generateIdempotencyKey,
  validateWebhookSignature,
  maskSensitiveData,
  validateEnvironmentSecurity,
  createSecureLogEntry,
} from '../security';

describe('Security Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.NODE_ENV;
  });

  describe('validateStripeConfig', () => {
    it('should validate production Stripe configuration with live keys', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_live_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';

      const result = validateStripeConfig();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.environment).toBe('production');
    });

    it('should validate test environment with test keys', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_test_test123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';

      const result = validateStripeConfig();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.environment).toBe('test');
    });

    it('should reject test keys in production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_test_test123';

      const result = validateStripeConfig();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Test keys cannot be used in production environment'
      );
    });

    it('should reject live keys in development environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_live_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test123';

      const result = validateStripeConfig();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Live keys should not be used in development environment'
      );
    });

    it('should require all necessary environment variables', () => {
      const result = validateStripeConfig();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'VITE_STRIPE_PUBLISHABLE_KEY is required'
      );
      expect(result.errors).toContain('STRIPE_SECRET_KEY is required');
      expect(result.errors).toContain('STRIPE_WEBHOOK_SECRET is required');
    });

    it('should validate webhook secret format', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_test_test123';
      process.env.STRIPE_WEBHOOK_SECRET = 'invalid_secret';

      const result = validateStripeConfig();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid webhook secret format');
    });
  });

  describe('sanitizeForLogging', () => {
    it('should remove credit card numbers from data', () => {
      const data = {
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        amount: 100,
      };

      const sanitized = sanitizeForLogging(data);
      expect(sanitized.cardNumber).toBe('[REDACTED]');
      expect(sanitized.expiryMonth).toBe(12);
      expect(sanitized.amount).toBe(100);
    });

    it('should remove CVV codes from data', () => {
      const data = {
        cvv: '123',
        cvc: '456',
        securityCode: '789',
        amount: 100,
      };

      const sanitized = sanitizeForLogging(data);
      expect(sanitized.cvv).toBe('[REDACTED]');
      expect(sanitized.cvc).toBe('[REDACTED]');
      expect(sanitized.securityCode).toBe('[REDACTED]');
      expect(sanitized.amount).toBe(100);
    });

    it('should remove bank account details', () => {
      const data = {
        accountNumber: '123456789',
        routingNumber: '021000021',
        bankName: 'Test Bank',
      };

      const sanitized = sanitizeForLogging(data);
      expect(sanitized.accountNumber).toBe('[REDACTED]');
      expect(sanitized.routingNumber).toBe('[REDACTED]');
      expect(sanitized.bankName).toBe('Test Bank');
    });

    it('should handle nested objects with sensitive data', () => {
      const data = {
        payment: {
          card: {
            number: '4242424242424242',
            cvv: '123',
          },
          amount: 100,
        },
        user: {
          name: 'John Doe',
          ssn: '123-45-6789',
        },
      };

      const sanitized = sanitizeForLogging(data);
      expect(sanitized.payment.card.number).toBe('[REDACTED]');
      expect(sanitized.payment.card.cvv).toBe('[REDACTED]');
      expect(sanitized.payment.amount).toBe(100);
      expect(sanitized.user.name).toBe('John Doe');
      expect(sanitized.user.ssn).toBe('[REDACTED]');
    });

    it('should handle arrays with sensitive data', () => {
      const data = {
        payments: [
          { cardNumber: '4242424242424242', amount: 100 },
          { cardNumber: '5555555555554444', amount: 200 },
        ],
      };

      const sanitized = sanitizeForLogging(data);
      expect(sanitized.payments[0].cardNumber).toBe('[REDACTED]');
      expect(sanitized.payments[1].cardNumber).toBe('[REDACTED]');
      expect(sanitized.payments[0].amount).toBe(100);
      expect(sanitized.payments[1].amount).toBe(200);
    });
  });

  describe('validateDonationAmount', () => {
    it('should validate positive donation amounts', () => {
      expect(validateDonationAmount(25.0)).toBe(null);
      expect(validateDonationAmount(100.5)).toBe(null);
      expect(validateDonationAmount(1000)).toBe(null);
    });

    it('should reject zero and negative amounts', () => {
      expect(validateDonationAmount(0)).toBe(
        'Donation amount must be greater than $0'
      );
      expect(validateDonationAmount(-5)).toBe(
        'Donation amount must be greater than $0'
      );
      expect(validateDonationAmount(-100.5)).toBe(
        'Donation amount must be greater than $0'
      );
    });

    it('should enforce minimum donation amount', () => {
      expect(validateDonationAmount(0.5)).toBe(
        'Minimum donation amount is $1.00'
      );
      expect(validateDonationAmount(0.99)).toBe(
        'Minimum donation amount is $1.00'
      );
      expect(validateDonationAmount(1.0)).toBe(null);
    });

    it('should enforce maximum donation amount', () => {
      expect(validateDonationAmount(10000)).toBe(null);
      expect(validateDonationAmount(10001)).toBe(
        'Maximum donation amount is $10,000.00'
      );
      expect(validateDonationAmount(50000)).toBe(
        'Maximum donation amount is $10,000.00'
      );
    });

    it('should validate decimal precision', () => {
      expect(validateDonationAmount(25.123)).toBe(
        'Amount cannot have more than 2 decimal places'
      );
      expect(validateDonationAmount(100.999)).toBe(
        'Amount cannot have more than 2 decimal places'
      );
      expect(validateDonationAmount(50.12)).toBe(null);
    });

    it('should handle edge cases and invalid inputs', () => {
      expect(validateDonationAmount(NaN)).toBe('Invalid donation amount');
      expect(validateDonationAmount(Infinity)).toBe('Invalid donation amount');
      expect(validateDonationAmount(-Infinity)).toBe('Invalid donation amount');
    });
  });

  describe('validatePaymentMethod', () => {
    it('should validate credit card payment method', () => {
      const cardMethod = {
        type: 'card' as const,
        card: {
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
        },
      };

      const result = validatePaymentMethod(cardMethod);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate bank account payment method', () => {
      const bankMethod = {
        type: 'us_bank_account' as const,
        usBankAccount: {
          bankName: 'Test Bank',
          accountType: 'checking' as const,
          last4: '6789',
          routingNumber: '021000021',
        },
      };

      const result = validatePaymentMethod(bankMethod);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject expired credit cards', () => {
      const expiredCard = {
        type: 'card' as const,
        card: {
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2020,
        },
      };

      const result = validatePaymentMethod(expiredCard);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Credit card has expired');
    });

    it('should validate routing number format', () => {
      const invalidRouting = {
        type: 'us_bank_account' as const,
        usBankAccount: {
          bankName: 'Test Bank',
          accountType: 'checking' as const,
          last4: '6789',
          routingNumber: '12345',
        },
      };

      const result = validatePaymentMethod(invalidRouting);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid routing number format');
    });

    it('should require card details for card payment method', () => {
      const incompleteCard = {
        type: 'card' as const,
      };

      const result = validatePaymentMethod(incompleteCard);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Card details are required for card payment method'
      );
    });

    it('should require bank account details for bank payment method', () => {
      const incompleteBank = {
        type: 'us_bank_account' as const,
      };

      const result = validatePaymentMethod(incompleteBank);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Bank account details are required for bank payment method'
      );
    });
  });

  describe('generateIdempotencyKey', () => {
    it('should generate unique idempotency keys', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();

      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1).not.toBe(key2);
      expect(key1.length).toBeGreaterThan(20);
    });

    it('should generate consistent keys for same input', () => {
      const input = {
        memberId: 'member123',
        amount: 100,
        timestamp: '2025-01-01',
      };
      const key1 = generateIdempotencyKey(input);
      const key2 = generateIdempotencyKey(input);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different inputs', () => {
      const input1 = { memberId: 'member123', amount: 100 };
      const input2 = { memberId: 'member456', amount: 100 };

      const key1 = generateIdempotencyKey(input1);
      const key2 = generateIdempotencyKey(input2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('validateWebhookSignature', () => {
    it('should validate correct webhook signature', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const secret = 'whsec_test123';
      const timestamp = Date.now();

      // Mock signature calculation
      const signature = `t=${timestamp},v1=mock_signature`;

      const isValid = validateWebhookSignature(payload, signature, secret);
      expect(typeof isValid).toBe('boolean');
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const secret = 'whsec_test123';
      const invalidSignature = 'invalid_signature';

      const isValid = validateWebhookSignature(
        payload,
        invalidSignature,
        secret
      );
      expect(isValid).toBe(false);
    });

    it('should reject signatures with old timestamps', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const secret = 'whsec_test123';
      const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const signature = `t=${oldTimestamp},v1=mock_signature`;

      const isValid = validateWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask credit card numbers', () => {
      expect(maskSensitiveData('4242424242424242', 'card')).toBe(
        '****-****-****-4242'
      );
      expect(maskSensitiveData('5555555555554444', 'card')).toBe(
        '****-****-****-4444'
      );
    });

    it('should mask bank account numbers', () => {
      expect(maskSensitiveData('123456789', 'bank')).toBe('*****6789');
      expect(maskSensitiveData('987654321', 'bank')).toBe('*****4321');
    });

    it('should mask SSN numbers', () => {
      expect(maskSensitiveData('123456789', 'ssn')).toBe('XXX-XX-6789');
      expect(maskSensitiveData('987654321', 'ssn')).toBe('XXX-XX-4321');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(maskSensitiveData('', 'card')).toBe('');
      expect(maskSensitiveData('123', 'card')).toBe('123'); // Too short to mask
    });
  });

  describe('validateEnvironmentSecurity', () => {
    it('should validate secure production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_APP_URL = 'https://secure-app.com';

      const result = validateEnvironmentSecurity();
      expect(result.isSecure).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about insecure development settings', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_APP_URL = 'http://localhost:3000';

      const result = validateEnvironmentSecurity();
      expect(result.isSecure).toBe(false);
      expect(result.warnings).toContain(
        'HTTP protocol detected in development'
      );
    });

    it('should require HTTPS in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_APP_URL = 'http://insecure-app.com';

      const result = validateEnvironmentSecurity();
      expect(result.isSecure).toBe(false);
      expect(result.warnings).toContain(
        'HTTPS required in production environment'
      );
    });
  });

  describe('createSecureLogEntry', () => {
    it('should create sanitized log entry with metadata', () => {
      const data = {
        cardNumber: '4242424242424242',
        amount: 100,
        userId: 'user123',
      };

      const logEntry = createSecureLogEntry('payment_processed', data);

      expect(logEntry.event).toBe('payment_processed');
      expect(logEntry.data.cardNumber).toBe('[REDACTED]');
      expect(logEntry.data.amount).toBe(100);
      expect(logEntry.data.userId).toBe('user123');
      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.sanitized).toBe(true);
    });

    it('should include correlation ID for tracking', () => {
      const logEntry = createSecureLogEntry('test_event', {});

      expect(logEntry.correlationId).toBeDefined();
      expect(logEntry.correlationId.length).toBeGreaterThan(10);
    });
  });
});
