// src/utils/validation.ts
// Form validation utilities with regex patterns for email, phone, name, and general field validation
// Provides consistent validation functions used across forms with standardized error messaging
// RELEVANT FILES: src/components/members/MemberFormEnhanced.tsx, src/components/households/HouseholdForm.tsx, src/components/events/EventForm.tsx, src/utils/member-form-utils.ts

export const validateRequired = (value: string): string | null => {
  return value.trim() ? null : 'This field is required';
};

export const validateEmail = (value: string): string | null => {
  if (!value.trim()) return null; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : 'Please enter a valid email address';
};

export const validatePhone = (value: string): string | null => {
  if (!value.trim()) return null; // Optional field
  const phoneRegex = /^[\d\s\-()]{10,}$/;
  return phoneRegex.test(value) ? null : 'Please enter a valid phone number';
};

export const validateName = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name must be less than 50 characters';
  return null;
};

// Payment validation functions for donations and financial transactions
// These functions provide PCI compliant validation and formatting for payment data

export const validatePaymentAmount = (
  amount: number,
  paymentType?: 'card' | 'ach'
): string | null => {
  if (isNaN(amount) || !isFinite(amount)) {
    return 'Invalid payment amount';
  }

  if (amount <= 0) {
    return 'Payment amount must be greater than $0';
  }

  // Check decimal precision
  const decimals = (amount.toString().split('.')[1] || '').length;
  if (decimals > 2) {
    return 'Amount cannot have more than 2 decimal places';
  }

  // Payment type specific minimums
  if (paymentType === 'card' && amount < 0.5) {
    return 'Minimum card payment amount is $0.50';
  }
  if (paymentType === 'ach' && amount < 1.0) {
    return 'Minimum ACH payment amount is $1.00';
  }

  // Maximum amount
  if (amount > 10000) {
    return 'Maximum payment amount is $10,000.00';
  }

  return null;
};

export const validateCreditCardNumber = (cardNumber: string): string | null => {
  const trimmed = cardNumber.replace(/[\s-]/g, '').trim();

  if (!trimmed) {
    return 'Credit card number is required';
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(trimmed)) {
    return 'Invalid credit card number';
  }

  // Luhn algorithm validation first
  let sum = 0;
  let isEven = false;

  for (let i = trimmed.length - 1; i >= 0; i--) {
    let digit = parseInt(trimmed.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return 'Invalid credit card number';
  }

  // Check length (13-19 digits for most cards, but specific lengths for known brands)
  const validLengths = [13, 14, 15, 16, 17, 18, 19];
  if (!validLengths.includes(trimmed.length)) {
    return 'Invalid credit card number';
  }

  // Additional brand-specific length validation
  const firstDigit = trimmed[0];
  const firstTwoDigits = trimmed.substring(0, 2);

  // Visa: 13, 16, 19 digits starting with 4
  if (firstDigit === '4' && ![13, 16, 19].includes(trimmed.length)) {
    return 'Invalid credit card number';
  }

  // Mastercard: 16 digits starting with 51-55 or 2221-2720
  if (
    (parseInt(firstTwoDigits) >= 51 && parseInt(firstTwoDigits) <= 55) ||
    (parseInt(trimmed.substring(0, 4)) >= 2221 &&
      parseInt(trimmed.substring(0, 4)) <= 2720)
  ) {
    if (trimmed.length !== 16) {
      return 'Invalid credit card number';
    }
  }

  // American Express: 15 digits starting with 34 or 37
  if (
    (firstTwoDigits === '34' || firstTwoDigits === '37') &&
    trimmed.length !== 15
  ) {
    return 'Invalid credit card number';
  }

  return null;
};

export const validateExpiryDate = (
  month: number,
  year: number
): string | null => {
  if (month < 1 || month > 12) {
    return 'Invalid expiry month';
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  if (year < 1000 || year > currentYear + 20) {
    if (year < 1000) {
      return 'Invalid expiry year';
    } else {
      return 'Expiry year too far in future';
    }
  }

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return 'Credit card has expired';
  }

  return null;
};

export const validateCVV = (cvv: string, cardType?: string): string | null => {
  const trimmed = cvv.trim();

  if (!trimmed) {
    return 'CVV is required';
  }

  if (!/^\d+$/.test(trimmed)) {
    return 'CVV must contain only numbers';
  }

  const isAmex = cardType === 'amex' || cardType === 'american_express';
  const expectedLength = isAmex ? 4 : 3;

  if (trimmed.length !== expectedLength) {
    return isAmex
      ? 'CVV must be 4 digits for American Express'
      : 'CVV must be 3 digits for this card type';
  }

  return null;
};

export const validateRoutingNumber = (routingNumber: string): string | null => {
  const trimmed = routingNumber.trim();

  if (!trimmed) {
    return 'Routing number is required';
  }

  if (!/^\d{9}$/.test(trimmed)) {
    if (trimmed.length !== 9) {
      return 'Routing number must be 9 digits';
    } else {
      return 'Routing number must contain only numbers';
    }
  }

  // ABA routing number checksum validation
  const digits = trimmed.split('').map(Number);
  const checksum =
    (3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      1 * (digits[2] + digits[5] + digits[8])) %
    10;

  if (checksum !== 0) {
    return 'Invalid routing number';
  }

  return null;
};

export const validateAccountNumber = (accountNumber: string): string | null => {
  const trimmed = accountNumber.trim();

  if (!trimmed) {
    return 'Account number is required';
  }

  if (!/^\d+$/.test(trimmed)) {
    return 'Account number must contain only numbers';
  }

  if (trimmed.length < 4 || trimmed.length > 17) {
    return 'Account number must be between 4 and 17 digits';
  }

  return null;
};

export const validateRecurringFrequency = (
  frequency: string
): string | null => {
  const validFrequencies = ['weekly', 'monthly', 'quarterly', 'annually'];

  if (!frequency.trim()) {
    return 'Recurring frequency is required';
  }

  if (!validFrequencies.includes(frequency)) {
    return 'Invalid recurring frequency';
  }

  return null;
};

export const validateCurrency = (currency: string): string | null => {
  const supportedCurrencies = ['USD', 'CAD', 'EUR'];

  if (!currency.trim()) {
    return 'Currency is required';
  }

  if (!supportedCurrencies.includes(currency)) {
    return `Currency ${currency} is not supported`;
  }

  return null;
};

// Payment data sanitization and formatting utilities

export const sanitizePaymentData = (data: unknown): unknown => {
  const sensitiveFields = [
    'cardNumber',
    'card_number',
    'number',
    'cvv',
    'cvc',
    'securityCode',
    'security_code',
  ];

  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePaymentData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizePaymentData(value);
      }
    }
    return sanitized;
  }

  return data;
};

export const formatCurrencyForDisplay = (
  amount: number,
  currency: string = 'USD'
): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};

export const parseCurrencyInput = (input: string): number | null => {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Remove currency symbols and formatting
  const cleaned = input.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
};
