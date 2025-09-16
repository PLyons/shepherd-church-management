/**
 * Payment service exports
 * Implements PRP-2C-008 Stripe integration
 */

export { StripeService, createStripeService, getStripeService } from './stripe.service';

// Environment configuration helper
export function getStripeConfig(): import('../../types/donations').StripeConfig {
  const config = {
    publicKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET,
    currency: import.meta.env.VITE_STRIPE_CURRENCY || 'usd',
    minDonationAmount: parseInt(import.meta.env.VITE_STRIPE_MIN_DONATION_AMOUNT || '100', 10),
    maxDonationAmount: parseInt(import.meta.env.VITE_STRIPE_MAX_DONATION_AMOUNT || '1000000', 10),
    allowedCountries: import.meta.env.VITE_STRIPE_ALLOWED_COUNTRIES?.split(',') || ['US'],
    enableApplePay: import.meta.env.VITE_STRIPE_ENABLE_APPLE_PAY === 'true',
    enableGooglePay: import.meta.env.VITE_STRIPE_ENABLE_GOOGLE_PAY === 'true',
  };

  // Validate required configuration
  if (!config.publicKey) {
    throw new Error('VITE_STRIPE_PUBLISHABLE_KEY environment variable is required');
  }

  if (config.minDonationAmount < 50) {
    throw new Error('Minimum donation amount must be at least $0.50 (50 cents)');
  }

  return config;
}

// Initialize Stripe service with environment configuration
export function initializeStripeService(): StripeService {
  const config = getStripeConfig();
  return createStripeService(config);
}