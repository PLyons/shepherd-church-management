/**
 * Test Suite: Currency Utilities
 * Purpose: Comprehensive TDD test coverage for financial calculation utilities
 * Agent: claude-sonnet-4-20250514 | Created: 2025-01-11
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, isValidCurrency } from '../currency-utils';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers with dollar sign and two decimal places', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(100.5)).toBe('$100.50');
      expect(formatCurrency(100.99)).toBe('$100.99');
    });

    it('should format large numbers with comma separators', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(12345.67)).toBe('$12,345.67');
      expect(formatCurrency(123456.78)).toBe('$123,456.78');
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle zero and small amounts correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.1)).toBe('$0.10');
      expect(formatCurrency(1)).toBe('$1.00');
    });

    it('should handle maximum donation amounts', () => {
      expect(formatCurrency(100000)).toBe('$100,000.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should maintain precision for financial calculations', () => {
      expect(formatCurrency(123.456)).toBe('$123.46'); // Should round to 2 decimal places
      expect(formatCurrency(123.454)).toBe('$123.45'); // Should round down
      expect(formatCurrency(123.455)).toBe('$123.46'); // Should round up
    });

    it('should handle edge case numbers', () => {
      expect(formatCurrency(0.001)).toBe('$0.00'); // Very small amount rounds to 0
      expect(formatCurrency(0.999)).toBe('$1.00'); // Rounds up to dollar
      expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toMatch(/^\$[\d,]+\.00$/); // Very large numbers
    });
  });

  describe('parseCurrency', () => {
    it('should parse clean currency strings to numbers', () => {
      expect(parseCurrency('$100.00')).toBe(100);
      expect(parseCurrency('$1234.56')).toBe(1234.56);
      expect(parseCurrency('$0.01')).toBe(0.01);
      expect(parseCurrency('$0.00')).toBe(0);
    });

    it('should handle comma-separated values', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
      expect(parseCurrency('$12,345.67')).toBe(12345.67);
      expect(parseCurrency('$123,456.78')).toBe(123456.78);
      expect(parseCurrency('$1,234,567.89')).toBe(1234567.89);
    });

    it('should remove symbols and spaces', () => {
      expect(parseCurrency('$ 1,000 ')).toBe(1000);
      expect(parseCurrency(' $500.50 ')).toBe(500.50);
      expect(parseCurrency('1000')).toBe(1000); // No dollar sign
      expect(parseCurrency('1,000.50')).toBe(1000.50); // No dollar sign with commas
    });

    it('should handle invalid input gracefully', () => {
      expect(parseCurrency('abc')).toBe(0);
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('$')).toBe(0);
      expect(parseCurrency('$abc')).toBe(0);
      expect(parseCurrency('NaN')).toBe(0);
      expect(parseCurrency('undefined')).toBe(0);
      expect(parseCurrency('null')).toBe(0);
    });

    it('should maintain precision for cents', () => {
      expect(parseCurrency('$123.45')).toBe(123.45);
      expect(parseCurrency('$0.01')).toBe(0.01);
      expect(parseCurrency('$999.99')).toBe(999.99);
      expect(parseCurrency('$1.234')).toBe(1.23); // Should round to 2 decimal places
    });

    it('should handle edge cases', () => {
      expect(parseCurrency('$0')).toBe(0);
      expect(parseCurrency('0')).toBe(0);
      expect(parseCurrency('$000.00')).toBe(0);
      expect(parseCurrency('$-100')).toBe(-100); // Negative numbers should parse but be handled elsewhere
    });

    it('should handle various decimal formats', () => {
      expect(parseCurrency('$100')).toBe(100); // No decimal places
      expect(parseCurrency('$100.')).toBe(100); // Trailing decimal
      expect(parseCurrency('$100.5')).toBe(100.5); // One decimal place
      expect(parseCurrency('$.50')).toBe(0.5); // Leading decimal
    });
  });

  describe('isValidCurrency', () => {
    describe('valid amounts (should return true)', () => {
      it('should accept positive amounts within range', () => {
        expect(isValidCurrency(100)).toBe(true);
        expect(isValidCurrency(0.01)).toBe(true);
        expect(isValidCurrency(1234.56)).toBe(true);
        expect(isValidCurrency(999999.99)).toBe(true);
      });

      it('should accept zero as valid', () => {
        expect(isValidCurrency(0)).toBe(true);
        expect(isValidCurrency('0')).toBe(true);
        expect(isValidCurrency('$0.00')).toBe(true);
      });

      it('should accept valid string formats', () => {
        expect(isValidCurrency('$100.00')).toBe(true);
        expect(isValidCurrency('$1,234.56')).toBe(true);
        expect(isValidCurrency('100')).toBe(true);
        expect(isValidCurrency('0.01')).toBe(true);
      });

      it('should accept boundary values', () => {
        expect(isValidCurrency(1000000)).toBe(true); // Exactly at limit
        expect(isValidCurrency('$1,000,000.00')).toBe(true);
      });
    });

    describe('invalid amounts (should return false)', () => {
      it('should reject negative amounts', () => {
        expect(isValidCurrency(-1)).toBe(false);
        expect(isValidCurrency(-100.50)).toBe(false);
        expect(isValidCurrency('$-100.00')).toBe(false);
        expect(isValidCurrency('-50')).toBe(false);
      });

      it('should reject amounts over limit', () => {
        expect(isValidCurrency(1000001)).toBe(false);
        expect(isValidCurrency(2000000)).toBe(false);
        expect(isValidCurrency('$1,000,000.01')).toBe(false);
        expect(isValidCurrency('$2,000,000.00')).toBe(false);
      });

      it('should reject invalid string input', () => {
        expect(isValidCurrency('abc')).toBe(false);
        expect(isValidCurrency('')).toBe(false);
        expect(isValidCurrency('$')).toBe(false);
        expect(isValidCurrency('$abc')).toBe(false);
        expect(isValidCurrency('NaN')).toBe(false);
        expect(isValidCurrency('undefined')).toBe(false);
        expect(isValidCurrency('null')).toBe(false);
      });

      it('should reject non-finite numbers', () => {
        expect(isValidCurrency(Infinity)).toBe(false);
        expect(isValidCurrency(-Infinity)).toBe(false);
        expect(isValidCurrency(NaN)).toBe(false);
      });

      it('should reject unreasonable precision', () => {
        expect(isValidCurrency(100.001)).toBe(false); // More than 2 decimal places
        expect(isValidCurrency('$100.123')).toBe(false);
        expect(isValidCurrency(0.001)).toBe(false); // Less than a cent
      });
    });

    describe('edge cases', () => {
      it('should handle boundary conditions correctly', () => {
        // Just under the limit
        expect(isValidCurrency(999999.99)).toBe(true);
        // Just over the limit
        expect(isValidCurrency(1000000.01)).toBe(false);
        
        // Smallest valid amount
        expect(isValidCurrency(0.01)).toBe(true);
        // Just under smallest valid amount
        expect(isValidCurrency(0.009)).toBe(false);
      });

      it('should handle various input types', () => {
        expect(isValidCurrency(null as any)).toBe(false);
        expect(isValidCurrency(undefined as any)).toBe(false);
        expect(isValidCurrency({} as any)).toBe(false);
        expect(isValidCurrency([] as any)).toBe(false);
        expect(isValidCurrency(true as any)).toBe(false);
        expect(isValidCurrency(false as any)).toBe(false);
      });

      it('should validate reasonable donation ranges', () => {
        // Common donation amounts should be valid
        expect(isValidCurrency(5)).toBe(true);
        expect(isValidCurrency(10)).toBe(true);
        expect(isValidCurrency(25)).toBe(true);
        expect(isValidCurrency(50)).toBe(true);
        expect(isValidCurrency(100)).toBe(true);
        expect(isValidCurrency(500)).toBe(true);
        expect(isValidCurrency(1000)).toBe(true);
        expect(isValidCurrency(5000)).toBe(true);
        
        // Large but reasonable amounts
        expect(isValidCurrency(25000)).toBe(true);
        expect(isValidCurrency(100000)).toBe(true);
      });
    });

    describe('financial precision requirements', () => {
      it('should handle decimal precision correctly', () => {
        expect(isValidCurrency(123.45)).toBe(true);
        expect(isValidCurrency(123.456)).toBe(false); // Too many decimal places
        expect(isValidCurrency('123.45')).toBe(true);
        expect(isValidCurrency('123.456')).toBe(false);
      });

      it('should validate currency formatting standards', () => {
        expect(isValidCurrency('$1,234.56')).toBe(true);
        expect(isValidCurrency('1234.56')).toBe(true);
        expect(isValidCurrency('1,234.56')).toBe(true);
        expect(isValidCurrency('$1234.56')).toBe(true); // No commas but valid
      });
    });
  });

  describe('integration scenarios', () => {
    it('should maintain consistency between parse and format operations', () => {
      const testValues = ['$100.00', '$1,234.56', '$0.01', '$999,999.99'];
      
      testValues.forEach(value => {
        const parsed = parseCurrency(value);
        const formatted = formatCurrency(parsed);
        const reparsed = parseCurrency(formatted);
        
        expect(reparsed).toBe(parsed);
      });
    });

    it('should handle round-trip validation correctly', () => {
      const testAmounts = [0, 0.01, 100, 1234.56, 999999.99];
      
      testAmounts.forEach(amount => {
        expect(isValidCurrency(amount)).toBe(true);
        const formatted = formatCurrency(amount);
        expect(isValidCurrency(formatted)).toBe(true);
        const parsed = parseCurrency(formatted);
        expect(parsed).toBe(amount);
      });
    });

    it('should reject invalid amounts consistently across all functions', () => {
      const invalidInputs = [-100, 1000001, 'abc', '', NaN, Infinity];
      
      invalidInputs.forEach(input => {
        expect(isValidCurrency(input)).toBe(false);
        
        if (typeof input === 'string') {
          const parsed = parseCurrency(input);
          if (parsed !== 0) { // parseCurrency might return 0 for invalid strings
            expect(isValidCurrency(parsed)).toBe(false);
          }
        }
      });
    });
  });
});