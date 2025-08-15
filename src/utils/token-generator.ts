/**
 * Token Generation Utility for QR Registration System
 * Generates cryptographically secure, URL-safe tokens
 */

/**
 * Generates a cryptographically secure URL-safe token
 * @param length - Length of the token (default: 32)
 * @returns URL-safe token string
 */
export function generateSecureToken(length: number = 32): string {
  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  // Convert to base64url (URL-safe base64)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

/**
 * Generates a shorter, more user-friendly token for QR codes
 * Uses alphanumeric characters only for better QR code scanning
 * @param length - Length of the token (default: 16)
 * @returns Alphanumeric token string
 */
export function generateQRToken(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Validates token format
 * @param token - Token to validate
 * @returns True if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  // Token should be alphanumeric, dashes, and underscores only
  const tokenRegex = /^[A-Za-z0-9\-_]+$/;
  return tokenRegex.test(token) && token.length >= 8 && token.length <= 64;
}

/**
 * Generates a unique token with retry logic to ensure uniqueness
 * @param checkUniqueness - Function that returns true if token is unique
 * @param maxRetries - Maximum number of retry attempts (default: 10)
 * @returns Promise<string> - Unique token
 */
export async function generateUniqueToken(
  checkUniqueness: (token: string) => Promise<boolean>,
  maxRetries: number = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const token = generateQRToken();
    const isUnique = await checkUniqueness(token);
    
    if (isUnique) {
      return token;
    }
  }
  
  throw new Error('Failed to generate unique token after maximum retries');
}

/**
 * Creates a registration URL from a token
 * @param token - Registration token
 * @param baseUrl - Base URL (optional, defaults to current origin)
 * @returns Complete registration URL
 */
export function createRegistrationUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/register/qr?token=${encodeURIComponent(token)}`;
}