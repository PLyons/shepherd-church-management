// src/utils/__tests__/environment-security.test.ts
// Integration tests for environment security validation and PCI compliance patterns
// Tests real-world scenarios for production deployment security requirements
// RELEVANT FILES: src/utils/security.ts, .env.example, src/services/payment/stripe.service.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateStripeConfig,
  validateEnvironmentSecurity,
  isProduction,
  validateSSLRequired,
  createSecureLogEntry,
  sanitizeForLogging,
} from '../security';

describe('Environment Security Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to clean state
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.VITE_APP_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Production Environment Security', () => {
    it('should validate complete production environment setup', () => {
      // Set up production environment
      process.env.NODE_ENV = 'production';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY =
        'pk_live_FAKE_KEY_FOR_TESTING_ONLY_NOT_REAL';
      process.env.STRIPE_SECRET_KEY =
        'sk_live_FAKE_KEY_FOR_TESTING_ONLY_NOT_REAL';
      process.env.STRIPE_WEBHOOK_SECRET =
        'whsec_FAKE_WEBHOOK_SECRET_FOR_TESTING_ONLY';
      process.env.VITE_APP_URL = 'https://secure-church-app.com';

      const stripeValidation = validateStripeConfig();
      const envSecurity = validateEnvironmentSecurity();

      expect(stripeValidation.isValid).toBe(true);
      expect(stripeValidation.environment).toBe('production');
      expect(envSecurity.isSecure).toBe(true);
      expect(isProduction()).toBe(true);
      expect(validateSSLRequired()).toBe(true);
    });

    it('should reject insecure production configuration', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_test_test123';
      process.env.VITE_APP_URL = 'http://insecure-app.com';

      const stripeValidation = validateStripeConfig();
      const envSecurity = validateEnvironmentSecurity();

      expect(stripeValidation.isValid).toBe(false);
      expect(stripeValidation.errors).toContain(
        'Test keys cannot be used in production environment'
      );
      expect(envSecurity.isSecure).toBe(false);
      expect(envSecurity.warnings).toContain(
        'HTTPS required in production environment'
      );
    });
  });

  describe('Development Environment Security', () => {
    it('should validate development environment with test keys', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY =
        'pk_test_FAKE_KEY_FOR_TESTING_ONLY_NOT_REAL';
      process.env.STRIPE_SECRET_KEY =
        'sk_test_FAKE_KEY_FOR_TESTING_ONLY_NOT_REAL';
      process.env.STRIPE_WEBHOOK_SECRET =
        'whsec_FAKE_WEBHOOK_SECRET_FOR_TESTING_ONLY';
      process.env.VITE_APP_URL = 'http://localhost:3000';

      const stripeValidation = validateStripeConfig();
      const envSecurity = validateEnvironmentSecurity();

      expect(stripeValidation.isValid).toBe(true);
      expect(stripeValidation.environment).toBe('test');
      expect(envSecurity.isSecure).toBe(false); // HTTP is not secure, but acceptable in dev
      expect(envSecurity.warnings).toContain(
        'HTTP protocol detected in development'
      );
    });

    it('should warn against live keys in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_live_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test123';

      const stripeValidation = validateStripeConfig();

      expect(stripeValidation.isValid).toBe(false);
      expect(stripeValidation.errors).toContain(
        'Live keys should not be used in development environment'
      );
    });
  });

  describe('PCI Compliance Data Handling', () => {
    it('should demonstrate secure logging for payment processing', () => {
      const paymentData = {
        customerId: 'cus_1234567890',
        paymentIntentId: 'pi_1234567890',
        amount: 5000, // $50.00
        currency: 'usd',
        paymentMethod: {
          type: 'card',
          card: {
            number: '4242424242424242',
            cvc: '123',
            expiryMonth: 12,
            expiryYear: 2025,
            brand: 'visa',
            last4: '4242',
          },
        },
        billingDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
      };

      const secureLogEntry = createSecureLogEntry(
        'payment_processed',
        paymentData
      );

      // Verify sensitive data is sanitized
      expect(secureLogEntry.data.paymentMethod.card.number).toBe('[REDACTED]');
      expect(secureLogEntry.data.paymentMethod.card.cvc).toBe('[REDACTED]');

      // Verify safe data is preserved
      expect(secureLogEntry.data.amount).toBe(5000);
      expect(secureLogEntry.data.currency).toBe('usd');
      expect(secureLogEntry.data.paymentMethod.card.brand).toBe('visa');
      expect(secureLogEntry.data.paymentMethod.card.last4).toBe('4242');
      expect(secureLogEntry.data.billingDetails.name).toBe('John Doe');
      expect(secureLogEntry.data.billingDetails.email).toBe('john@example.com');

      // Verify log metadata
      expect(secureLogEntry.event).toBe('payment_processed');
      expect(secureLogEntry.sanitized).toBe(true);
      expect(secureLogEntry.correlationId).toBeDefined();
      expect(secureLogEntry.timestamp).toBeDefined();
    });

    it('should sanitize complex nested payment structures', () => {
      const complexPaymentData = {
        batch: {
          id: 'batch_123',
          payments: [
            {
              memberId: 'member_456',
              donation: {
                amount: 2500,
                paymentMethod: {
                  card: {
                    number: '4242424242424242',
                    cvv: '123',
                  },
                },
              },
            },
            {
              memberId: 'member_789',
              donation: {
                amount: 5000,
                bankAccount: {
                  accountNumber: '123456789',
                  routingNumber: '021000021',
                },
              },
            },
          ],
        },
        processing: {
          webhook: {
            signature: 'whsec_secret_signature',
            timestamp: Date.now(),
          },
        },
      };

      const sanitized = sanitizeForLogging(complexPaymentData);

      // Check card data sanitization
      expect(
        sanitized.batch.payments[0].donation.paymentMethod.card.number
      ).toBe('[REDACTED]');
      expect(sanitized.batch.payments[0].donation.paymentMethod.card.cvv).toBe(
        '[REDACTED]'
      );

      // Check bank account sanitization
      expect(
        sanitized.batch.payments[1].donation.bankAccount.accountNumber
      ).toBe('[REDACTED]');
      expect(
        sanitized.batch.payments[1].donation.bankAccount.routingNumber
      ).toBe('[REDACTED]');

      // Check preserved non-sensitive data
      expect(sanitized.batch.id).toBe('batch_123');
      expect(sanitized.batch.payments[0].memberId).toBe('member_456');
      expect(sanitized.batch.payments[0].donation.amount).toBe(2500);
      expect(sanitized.batch.payments[1].donation.amount).toBe(5000);
      expect(sanitized.processing.webhook.timestamp).toBeDefined();
    });
  });

  describe('Environment Configuration Validation Scenarios', () => {
    it('should handle missing critical environment variables', () => {
      process.env.NODE_ENV = 'production';
      // Missing all Stripe configuration

      const validation = validateStripeConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'VITE_STRIPE_PUBLISHABLE_KEY is required'
      );
      expect(validation.errors).toContain('STRIPE_SECRET_KEY is required');
      expect(validation.errors).toContain('STRIPE_WEBHOOK_SECRET is required');
      expect(validation.environment).toBe('unknown');
    });

    it('should validate webhook secret format requirements', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_live_test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test123';
      process.env.STRIPE_WEBHOOK_SECRET = 'invalid_webhook_secret_format';

      const validation = validateStripeConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid webhook secret format');
    });

    it('should detect key format mismatches', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'invalid_key_format';
      process.env.STRIPE_SECRET_KEY = 'also_invalid';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_valid_format';

      const validation = validateStripeConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid Stripe key format');
    });
  });

  describe('SSL and Security Requirements', () => {
    it('should enforce HTTPS in production environments', () => {
      process.env.NODE_ENV = 'production';

      // Test without URL
      expect(validateSSLRequired()).toBe(false);

      // Test with HTTP URL
      process.env.VITE_APP_URL = 'http://example.com';
      expect(validateSSLRequired()).toBe(false);

      // Test with HTTPS URL
      process.env.VITE_APP_URL = 'https://example.com';
      expect(validateSSLRequired()).toBe(true);
    });

    it('should not enforce HTTPS in development environments', () => {
      process.env.NODE_ENV = 'development';
      process.env.VITE_APP_URL = 'http://localhost:3000';

      expect(validateSSLRequired()).toBe(true); // Not required in development
    });
  });

  describe('Real-world Security Scenarios', () => {
    it('should validate staging environment configuration', () => {
      process.env.NODE_ENV = 'staging';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_staging123';
      process.env.STRIPE_SECRET_KEY = 'sk_test_staging123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_staging123';
      process.env.VITE_APP_URL = 'https://staging.church-app.com';

      const stripeValidation = validateStripeConfig();
      const envSecurity = validateEnvironmentSecurity();

      // Staging should use test keys but HTTPS
      expect(stripeValidation.isValid).toBe(true);
      expect(stripeValidation.environment).toBe('test');
      expect(envSecurity.isSecure).toBe(true);
    });

    it('should handle mixed environment configurations gracefully', () => {
      process.env.NODE_ENV = 'production';
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_mixed123'; // Wrong key type
      process.env.STRIPE_SECRET_KEY = 'sk_live_mixed123'; // Different key type
      process.env.VITE_APP_URL = 'https://secure-app.com';

      const validation = validateStripeConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
