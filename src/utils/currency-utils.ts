/**
 * Currency Utilities: Financial calculation and formatting utilities
 * Purpose: Provide precise currency handling for donation and financial operations
 * Agent: claude-sonnet-4-20250514 | Created: 2025-01-11
 */

/**
 * Formats a numeric amount as US currency with proper symbols and separators
 * @param amount - Numeric amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parses a currency string back to a numeric value
 * @param value - Currency string to parse (e.g., "$1,234.56")
 * @returns Numeric value or 0 for invalid input
 */
export function parseCurrency(value: string): number {
  if (typeof value !== 'string') {
    return 0;
  }

  // Remove currency symbols, spaces, and commas
  const cleanValue = value.replace(/[$,\s]/g, '');

  // Handle empty string or just symbols
  if (cleanValue === '' || cleanValue === '.') {
    return 0;
  }

  const parsed = parseFloat(cleanValue);

  // Return 0 for invalid numbers
  if (isNaN(parsed)) {
    return 0;
  }

  // Round to 2 decimal places to handle precision issues
  return Math.round(parsed * 100) / 100;
}

/**
 * Validates currency amounts for donation limits and financial precision
 * @param value - Amount to validate (string or number)
 * @returns True if valid currency amount within acceptable range
 */
export function isValidCurrency(value: string | number): boolean {
  // Handle null, undefined, and non-primitive types
  if (value === null || value === undefined) {
    return false;
  }

  // Handle non-string, non-number types
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }

  let numericValue: number;

  if (typeof value === 'string') {
    numericValue = parseCurrency(value);

    // Check if the original string was actually invalid
    // (parseCurrency returns 0 for invalid strings, but 0 is a valid amount)
    if (
      numericValue === 0 &&
      value !== '0' &&
      value !== '$0' &&
      value !== '$0.00' &&
      value !== '0.00'
    ) {
      // If it parsed to 0 but wasn't actually a zero value, check if it's truly invalid
      const cleanValue = value.replace(/[$,\s]/g, '');
      if (
        cleanValue === '' ||
        cleanValue === '.' ||
        isNaN(parseFloat(cleanValue))
      ) {
        return false;
      }
    }

    // Check for more than 2 decimal places in the original string
    const cleanForDecimalCheck = value.replace(/[$,\s]/g, '');
    const decimalPart = cleanForDecimalCheck.split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      return false;
    }
  } else {
    numericValue = value;
  }

  // Check if number is finite
  if (!isFinite(numericValue)) {
    return false;
  }

  // Check range: must be >= 0 and <= 1,000,000
  if (numericValue < 0 || numericValue > 1000000) {
    return false;
  }

  // Check for unreasonable precision (more than 2 decimal places)
  // Round to 2 decimal places and compare
  const rounded = Math.round(numericValue * 100) / 100;
  if (Math.abs(numericValue - rounded) > Number.EPSILON) {
    return false;
  }

  // Check for amounts less than a cent (except exactly 0)
  if (numericValue > 0 && numericValue < 0.01) {
    return false;
  }

  return true;
}
