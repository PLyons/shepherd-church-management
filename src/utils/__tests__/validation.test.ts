// src/utils/__tests__/validation.test.ts
// Comprehensive test suite for validation utilities including existing validation functions
// and new payment-specific validation functions for donations and financial data
// RELEVANT FILES: src/utils/validation.ts, src/components/donations/DonationForm.tsx, src/types/donations.ts

import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateEmail,
  validatePhone,
  validateName,
  // Payment validation functions
  validatePaymentAmount,
  validateCreditCardNumber,
  validateExpiryDate,
  validateCVV,
  validateRoutingNumber,
  validateAccountNumber,
  validateRecurringFrequency,
  validateCurrency,
  sanitizePaymentData,
  formatCurrencyForDisplay,
  parseCurrencyInput
} from '../validation';

describe('Validation Utilities', () => {
  describe('Existing validation functions', () => {
    describe('validateRequired', () => {
      it('should return null for non-empty strings', () => {
        expect(validateRequired('test')).toBe(null);
        expect(validateRequired('   test   ')).toBe(null);
      });

      it('should return error for empty strings', () => {
        expect(validateRequired('')).toBe('This field is required');
        expect(validateRequired('   ')).toBe('This field is required');
      });
    });

    describe('validateEmail', () => {
      it('should return null for valid emails', () => {
        expect(validateEmail('test@example.com')).toBe(null);
        expect(validateEmail('user.name+tag@domain.co.uk')).toBe(null);
      });

      it('should return null for empty emails (optional field)', () => {
        expect(validateEmail('')).toBe(null);
        expect(validateEmail('   ')).toBe(null);
      });

      it('should return error for invalid emails', () => {
        expect(validateEmail('invalid-email')).toBe('Please enter a valid email address');
        expect(validateEmail('@domain.com')).toBe('Please enter a valid email address');
        expect(validateEmail('user@')).toBe('Please enter a valid email address');
      });
    });

    describe('validatePhone', () => {
      it('should return null for valid phone numbers', () => {
        expect(validatePhone('1234567890')).toBe(null);
        expect(validatePhone('(123) 456-7890')).toBe(null);
        expect(validatePhone('123-456-7890')).toBe(null);
      });

      it('should return null for empty phone (optional field)', () => {
        expect(validatePhone('')).toBe(null);
        expect(validatePhone('   ')).toBe(null);
      });

      it('should return error for invalid phone numbers', () => {
        expect(validatePhone('123')).toBe('Please enter a valid phone number');
        expect(validatePhone('abc-def-ghij')).toBe('Please enter a valid phone number');
      });
    });

    describe('validateName', () => {
      it('should return null for valid names', () => {
        expect(validateName('John')).toBe(null);
        expect(validateName('Mary Jane')).toBe(null);
        expect(validateName('Jean-Pierre')).toBe(null);
      });

      it('should return error for empty names', () => {
        expect(validateName('')).toBe('Name is required');
        expect(validateName('   ')).toBe('Name is required');
      });

      it('should return error for names that are too short', () => {
        expect(validateName('A')).toBe('Name must be at least 2 characters');
      });

      it('should return error for names that are too long', () => {
        const longName = 'A'.repeat(51);
        expect(validateName(longName)).toBe('Name must be less than 50 characters');
      });
    });
  });

  describe('Payment validation functions', () => {
    describe('validatePaymentAmount', () => {
      it('should validate positive amounts with proper decimal precision', () => {
        expect(validatePaymentAmount(25.00)).toBe(null);
        expect(validatePaymentAmount(100.50)).toBe(null);
        expect(validatePaymentAmount(1000)).toBe(null);
        expect(validatePaymentAmount(9999.99)).toBe(null);
      });

      it('should reject zero and negative amounts', () => {
        expect(validatePaymentAmount(0)).toBe('Payment amount must be greater than $0');
        expect(validatePaymentAmount(-5)).toBe('Payment amount must be greater than $0');
        expect(validatePaymentAmount(-100.50)).toBe('Payment amount must be greater than $0');
      });

      it('should enforce minimum payment amount for card transactions', () => {
        expect(validatePaymentAmount(0.30, 'card')).toBe('Minimum card payment amount is $0.50');
        expect(validatePaymentAmount(0.49, 'card')).toBe('Minimum card payment amount is $0.50');
        expect(validatePaymentAmount(0.50, 'card')).toBe(null);
      });

      it('should enforce minimum payment amount for ACH transactions', () => {
        expect(validatePaymentAmount(0.50, 'ach')).toBe('Minimum ACH payment amount is $1.00');
        expect(validatePaymentAmount(0.99, 'ach')).toBe('Minimum ACH payment amount is $1.00');
        expect(validatePaymentAmount(1.00, 'ach')).toBe(null);
      });

      it('should enforce maximum payment limits', () => {
        expect(validatePaymentAmount(10000)).toBe(null);
        expect(validatePaymentAmount(10001)).toBe('Maximum payment amount is $10,000.00');
        expect(validatePaymentAmount(50000)).toBe('Maximum payment amount is $10,000.00');
      });

      it('should validate decimal precision', () => {
        expect(validatePaymentAmount(25.123)).toBe('Amount cannot have more than 2 decimal places');
        expect(validatePaymentAmount(100.999)).toBe('Amount cannot have more than 2 decimal places');
        expect(validatePaymentAmount(50.12)).toBe(null);
      });

      it('should handle invalid numeric inputs', () => {
        expect(validatePaymentAmount(NaN)).toBe('Invalid payment amount');
        expect(validatePaymentAmount(Infinity)).toBe('Invalid payment amount');
        expect(validatePaymentAmount(-Infinity)).toBe('Invalid payment amount');
      });
    });

    describe('validateCreditCardNumber', () => {
      it('should validate common credit card patterns', () => {
        // Visa
        expect(validateCreditCardNumber('4242424242424242')).toBe(null);
        expect(validateCreditCardNumber('4000056655665556')).toBe(null);
        
        // Mastercard
        expect(validateCreditCardNumber('5555555555554444')).toBe(null);
        expect(validateCreditCardNumber('5200828282828210')).toBe(null);
        
        // American Express
        expect(validateCreditCardNumber('378282246310005')).toBe(null);
        expect(validateCreditCardNumber('371449635398431')).toBe(null);
      });

      it('should accept card numbers with spaces and dashes', () => {
        expect(validateCreditCardNumber('4242 4242 4242 4242')).toBe(null);
        expect(validateCreditCardNumber('4242-4242-4242-4242')).toBe(null);
      });

      it('should reject invalid card number formats', () => {
        expect(validateCreditCardNumber('1234567890123456')).toBe('Invalid credit card number');
        expect(validateCreditCardNumber('4242424242424241')).toBe('Invalid credit card number');
        expect(validateCreditCardNumber('123')).toBe('Invalid credit card number');
      });

      it('should reject cards with invalid lengths', () => {
        expect(validateCreditCardNumber('42424242424242')).toBe('Invalid credit card number');
        expect(validateCreditCardNumber('424242424242424212345')).toBe('Invalid credit card number');
      });

      it('should handle empty input', () => {
        expect(validateCreditCardNumber('')).toBe('Credit card number is required');
        expect(validateCreditCardNumber('   ')).toBe('Credit card number is required');
      });
    });

    describe('validateExpiryDate', () => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      it('should validate future expiry dates', () => {
        expect(validateExpiryDate(12, currentYear + 1)).toBe(null);
        expect(validateExpiryDate(6, currentYear + 2)).toBe(null);
      });

      it('should validate current month in current year', () => {
        if (currentMonth <= 12) {
          expect(validateExpiryDate(currentMonth, currentYear)).toBe(null);
        }
      });

      it('should reject past expiry dates', () => {
        expect(validateExpiryDate(1, currentYear - 1)).toBe('Credit card has expired');
        expect(validateExpiryDate(12, 2020)).toBe('Credit card has expired');
      });

      it('should reject past months in current year', () => {
        if (currentMonth > 1) {
          expect(validateExpiryDate(currentMonth - 1, currentYear)).toBe('Credit card has expired');
        }
      });

      it('should reject invalid month values', () => {
        expect(validateExpiryDate(0, currentYear + 1)).toBe('Invalid expiry month');
        expect(validateExpiryDate(13, currentYear + 1)).toBe('Invalid expiry month');
        expect(validateExpiryDate(-1, currentYear + 1)).toBe('Invalid expiry month');
      });

      it('should reject invalid year values', () => {
        expect(validateExpiryDate(12, 99)).toBe('Invalid expiry year');
        expect(validateExpiryDate(12, currentYear + 21)).toBe('Expiry year too far in future');
      });
    });

    describe('validateCVV', () => {
      it('should validate 3-digit CVV for most cards', () => {
        expect(validateCVV('123', 'visa')).toBe(null);
        expect(validateCVV('456', 'mastercard')).toBe(null);
        expect(validateCVV('789', 'discover')).toBe(null);
      });

      it('should validate 4-digit CVV for American Express', () => {
        expect(validateCVV('1234', 'amex')).toBe(null);
        expect(validateCVV('5678', 'american_express')).toBe(null);
      });

      it('should reject wrong length CVV for card type', () => {
        expect(validateCVV('12', 'visa')).toBe('CVV must be 3 digits for this card type');
        expect(validateCVV('1234', 'visa')).toBe('CVV must be 3 digits for this card type');
        expect(validateCVV('123', 'amex')).toBe('CVV must be 4 digits for American Express');
      });

      it('should reject non-numeric CVV', () => {
        expect(validateCVV('abc', 'visa')).toBe('CVV must contain only numbers');
        expect(validateCVV('12a', 'visa')).toBe('CVV must contain only numbers');
      });

      it('should handle empty CVV', () => {
        expect(validateCVV('', 'visa')).toBe('CVV is required');
        expect(validateCVV('   ', 'visa')).toBe('CVV is required');
      });
    });

    describe('validateRoutingNumber', () => {
      it('should validate correct routing numbers', () => {
        expect(validateRoutingNumber('021000021')).toBe(null);
        expect(validateRoutingNumber('111000025')).toBe(null);
        expect(validateRoutingNumber('026009593')).toBe(null);
      });

      it('should reject invalid routing number lengths', () => {
        expect(validateRoutingNumber('12345')).toBe('Routing number must be 9 digits');
        expect(validateRoutingNumber('1234567890')).toBe('Routing number must be 9 digits');
      });

      it('should reject non-numeric routing numbers', () => {
        expect(validateRoutingNumber('12345678a')).toBe('Routing number must contain only numbers');
        expect(validateRoutingNumber('abc123456')).toBe('Routing number must contain only numbers');
      });

      it('should reject routing numbers that fail checksum', () => {
        expect(validateRoutingNumber('123456789')).toBe('Invalid routing number');
        expect(validateRoutingNumber('999999999')).toBe('Invalid routing number');
      });

      it('should handle empty routing number', () => {
        expect(validateRoutingNumber('')).toBe('Routing number is required');
        expect(validateRoutingNumber('   ')).toBe('Routing number is required');
      });
    });

    describe('validateAccountNumber', () => {
      it('should validate account numbers within valid ranges', () => {
        expect(validateAccountNumber('1234567890')).toBe(null);
        expect(validateAccountNumber('123456789012345')).toBe(null);
        expect(validateAccountNumber('12345678')).toBe(null);
      });

      it('should reject account numbers that are too short', () => {
        expect(validateAccountNumber('123')).toBe('Account number must be between 4 and 17 digits');
        expect(validateAccountNumber('1234')).toBe(null);
      });

      it('should reject account numbers that are too long', () => {
        expect(validateAccountNumber('123456789012345678')).toBe('Account number must be between 4 and 17 digits');
      });

      it('should reject non-numeric account numbers', () => {
        expect(validateAccountNumber('12345abc')).toBe('Account number must contain only numbers');
        expect(validateAccountNumber('abcd1234')).toBe('Account number must contain only numbers');
      });

      it('should handle empty account number', () => {
        expect(validateAccountNumber('')).toBe('Account number is required');
        expect(validateAccountNumber('   ')).toBe('Account number is required');
      });
    });

    describe('validateRecurringFrequency', () => {
      it('should validate standard frequencies', () => {
        expect(validateRecurringFrequency('weekly')).toBe(null);
        expect(validateRecurringFrequency('monthly')).toBe(null);
        expect(validateRecurringFrequency('quarterly')).toBe(null);
        expect(validateRecurringFrequency('annually')).toBe(null);
      });

      it('should reject invalid frequencies', () => {
        expect(validateRecurringFrequency('daily')).toBe('Invalid recurring frequency');
        expect(validateRecurringFrequency('custom')).toBe('Invalid recurring frequency');
        expect(validateRecurringFrequency('')).toBe('Recurring frequency is required');
      });
    });

    describe('validateCurrency', () => {
      it('should validate supported currencies', () => {
        expect(validateCurrency('USD')).toBe(null);
        expect(validateCurrency('CAD')).toBe(null);
        expect(validateCurrency('EUR')).toBe(null);
      });

      it('should reject unsupported currencies', () => {
        expect(validateCurrency('JPY')).toBe('Currency JPY is not supported');
        expect(validateCurrency('BTC')).toBe('Currency BTC is not supported');
        expect(validateCurrency('')).toBe('Currency is required');
      });
    });
  });

  describe('Payment data utilities', () => {
    describe('sanitizePaymentData', () => {
      it('should remove sensitive payment information', () => {
        const paymentData = {
          cardNumber: '4242424242424242',
          cvv: '123',
          amount: 100,
          customerEmail: 'test@example.com'
        };

        const sanitized = sanitizePaymentData(paymentData);
        expect(sanitized.cardNumber).toBe('[REDACTED]');
        expect(sanitized.cvv).toBe('[REDACTED]');
        expect(sanitized.amount).toBe(100);
        expect(sanitized.customerEmail).toBe('test@example.com');
      });

      it('should handle nested payment objects', () => {
        const data = {
          payment: {
            method: {
              card: {
                number: '4242424242424242',
                cvc: '123'
              }
            },
            amount: 100
          }
        };

        const sanitized = sanitizePaymentData(data);
        expect(sanitized.payment.method.card.number).toBe('[REDACTED]');
        expect(sanitized.payment.method.card.cvc).toBe('[REDACTED]');
        expect(sanitized.payment.amount).toBe(100);
      });
    });

    describe('formatCurrencyForDisplay', () => {
      it('should format USD amounts correctly', () => {
        expect(formatCurrencyForDisplay(100, 'USD')).toBe('$100.00');
        expect(formatCurrencyForDisplay(25.50, 'USD')).toBe('$25.50');
        expect(formatCurrencyForDisplay(1000, 'USD')).toBe('$1,000.00');
      });

      it('should format other currencies correctly', () => {
        expect(formatCurrencyForDisplay(100, 'EUR')).toBe('€100.00');
        expect(formatCurrencyForDisplay(100, 'CAD')).toBe('CA$100.00');
      });

      it('should handle zero and negative amounts', () => {
        expect(formatCurrencyForDisplay(0, 'USD')).toBe('$0.00');
        expect(formatCurrencyForDisplay(-25.50, 'USD')).toBe('-$25.50');
      });
    });

    describe('parseCurrencyInput', () => {
      it('should parse currency strings to numbers', () => {
        expect(parseCurrencyInput('$100.00')).toBe(100);
        expect(parseCurrencyInput('25.50')).toBe(25.50);
        expect(parseCurrencyInput('1,000.00')).toBe(1000);
      });

      it('should handle currency symbols and formatting', () => {
        expect(parseCurrencyInput('$1,234.56')).toBe(1234.56);
        expect(parseCurrencyInput('€100.00')).toBe(100);
        expect(parseCurrencyInput('CA$50.25')).toBe(50.25);
      });

      it('should return null for invalid inputs', () => {
        expect(parseCurrencyInput('invalid')).toBe(null);
        expect(parseCurrencyInput('')).toBe(null);
        expect(parseCurrencyInput('$')).toBe(null);
      });
    });
  });
});