// src/utils/security.ts
// Security utilities for payment processing, environment validation, and PCI compliance
// Provides Stripe configuration validation, data sanitization, and secure logging functions
// RELEVANT FILES: src/services/payment/stripe.service.ts, src/api/stripe/webhook.ts, src/types/donations.ts

import crypto from 'crypto';

// Environment and configuration validation
export interface StripeConfigValidation {
  isValid: boolean;
  errors: string[];
  environment: 'production' | 'test' | 'unknown';
  warnings?: string[];
}

export function validateStripeConfig(): StripeConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeEnv = process.env.NODE_ENV;
  
  const publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Check required environment variables
  if (!publishableKey) {
    errors.push('VITE_STRIPE_PUBLISHABLE_KEY is required');
  }
  if (!secretKey) {
    errors.push('STRIPE_SECRET_KEY is required');
  }
  if (!webhookSecret) {
    errors.push('STRIPE_WEBHOOK_SECRET is required');
  }

  let environment: 'production' | 'test' | 'unknown' = 'unknown';

  // Validate key types match environment
  if (publishableKey && secretKey) {
    const isLiveKey = publishableKey.startsWith('pk_live_') && secretKey.startsWith('sk_live_');
    const isTestKey = publishableKey.startsWith('pk_test_') && secretKey.startsWith('sk_test_');

    if (isLiveKey) {
      environment = 'production';
      if (nodeEnv === 'development') {
        errors.push('Live keys should not be used in development environment');
      }
    } else if (isTestKey) {
      environment = 'test';
      if (nodeEnv === 'production') {
        errors.push('Test keys cannot be used in production environment');
      }
    } else {
      errors.push('Invalid Stripe key format');
    }
  }

  // Validate webhook secret format
  if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
    errors.push('Invalid webhook secret format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    environment,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// Data sanitization for logging and security
const SENSITIVE_FIELDS = [
  'cardNumber', 'card_number', 'number',
  'cvv', 'cvc', 'securityCode', 'security_code',
  'accountNumber', 'account_number',
  'routingNumber', 'routing_number',
  'ssn', 'social_security_number',
  'password', 'token', 'secret'
];

export function sanitizeForLogging(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return data;
}

// Donation amount validation with payment-specific constraints
export function validateDonationAmount(amount: number, paymentType?: 'card' | 'ach'): string | null {
  if (isNaN(amount) || !isFinite(amount)) {
    return 'Invalid donation amount';
  }

  if (amount <= 0) {
    return 'Donation amount must be greater than $0';
  }

  // Check decimal precision
  const decimals = (amount.toString().split('.')[1] || '').length;
  if (decimals > 2) {
    return 'Amount cannot have more than 2 decimal places';
  }

  // Minimum amounts by payment type
  if (paymentType === 'card' && amount < 0.50) {
    return 'Minimum card payment amount is $0.50';
  }
  if (paymentType === 'ach' && amount < 1.00) {
    return 'Minimum ACH payment amount is $1.00';
  }
  if (!paymentType && amount < 1.00) {
    return 'Minimum donation amount is $1.00';
  }

  // Maximum amount
  if (amount > 10000) {
    return 'Maximum donation amount is $10,000.00';
  }

  return null;
}

// Payment method validation
export interface PaymentMethodValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePaymentMethod(paymentMethod: Record<string, unknown>): PaymentMethodValidation {
  const errors: string[] = [];

  if (!paymentMethod.type) {
    errors.push('Payment method type is required');
    return { isValid: false, errors };
  }

  if (paymentMethod.type === 'card') {
    if (!paymentMethod.card) {
      errors.push('Card details are required for card payment method');
    } else {
      const card = paymentMethod.card;
      
      // Validate expiry date
      if (card.expiryMonth && card.expiryYear) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        if (card.expiryYear < currentYear || 
            (card.expiryYear === currentYear && card.expiryMonth < currentMonth)) {
          errors.push('Credit card has expired');
        }
      }
    }
  } else if (paymentMethod.type === 'us_bank_account') {
    if (!paymentMethod.usBankAccount) {
      errors.push('Bank account details are required for bank payment method');
    } else {
      const bankAccount = paymentMethod.usBankAccount;
      
      // Validate routing number format
      if (bankAccount.routingNumber && !/^\d{9}$/.test(bankAccount.routingNumber)) {
        errors.push('Invalid routing number format');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Idempotency key generation for duplicate prevention
export function generateIdempotencyKey(input?: Record<string, unknown>): string {
  if (input) {
    // Generate deterministic key for same input
    const inputString = JSON.stringify(input, Object.keys(input).sort());
    return crypto.createHash('sha256').update(inputString).digest('hex').substring(0, 32);
  }
  
  // Generate random key
  return crypto.randomBytes(16).toString('hex') + '_' + Date.now();
}

// Webhook signature validation
export function validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const elements = signature.split(',');
    const signatureHash = elements.find(element => element.startsWith('v1='));
    const timestamp = elements.find(element => element.startsWith('t='));
    
    if (!signatureHash || !timestamp) {
      return false;
    }

    const timestampValue = parseInt(timestamp.split('=')[1]);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Reject signatures older than 5 minutes
    if (currentTime - timestampValue > 300) {
      return false;
    }

    // In a real implementation, this would use HMAC-SHA256 to verify the signature
    // For testing purposes, we'll do a basic validation
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp.split('=')[1] + '.' + payload)
      .digest('hex');
    
    return signatureHash.split('=')[1] === expectedSignature;
  } catch (error) {
    return false;
  }
}

// Data masking utilities
export function maskSensitiveData(data: string, type: 'card' | 'bank' | 'ssn'): string {
  if (!data || data.length < 4) {
    return data;
  }

  switch (type) {
    case 'card':
      if (data.length >= 16) {
        const last4 = data.slice(-4);
        return `****-****-****-${last4}`;
      }
      return data;
    
    case 'bank':
      if (data.length >= 8) {
        const last4 = data.slice(-4);
        return `*****${last4}`;
      }
      return data;
    
    case 'ssn':
      if (data.length >= 9) {
        const last4 = data.slice(-4);
        return `XXX-XX-${last4}`;
      }
      return data;
    
    default:
      return data;
  }
}

// Environment security validation
export interface EnvironmentSecurity {
  isSecure: boolean;
  warnings: string[];
}

export function validateEnvironmentSecurity(): EnvironmentSecurity {
  const warnings: string[] = [];
  const nodeEnv = process.env.NODE_ENV;
  const appUrl = process.env.VITE_APP_URL;

  if (nodeEnv === 'production') {
    if (appUrl && !appUrl.startsWith('https://')) {
      warnings.push('HTTPS required in production environment');
    }
  } else if (nodeEnv === 'development') {
    if (appUrl && appUrl.startsWith('http://')) {
      warnings.push('HTTP protocol detected in development');
    }
  }

  return {
    isSecure: warnings.length === 0,
    warnings
  };
}

// Secure logging entry creation
export interface SecureLogEntry {
  event: string;
  data: unknown;
  timestamp: string;
  correlationId: string;
  sanitized: boolean;
}

export function createSecureLogEntry(event: string, data: unknown): SecureLogEntry {
  return {
    event,
    data: sanitizeForLogging(data),
    timestamp: new Date().toISOString(),
    correlationId: generateIdempotencyKey(),
    sanitized: true
  };
}

// Additional utility functions for PCI compliance
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function validateSSLRequired(): boolean {
  if (isProduction()) {
    const appUrl = process.env.VITE_APP_URL;
    return appUrl ? appUrl.startsWith('https://') : false;
  }
  return true; // Not required in non-production
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}