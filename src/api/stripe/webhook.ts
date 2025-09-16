/**
 * Stripe Webhook Handler
 * Serverless function to handle Stripe webhook events for PRP-2C-008
 */

import Stripe from 'stripe';
import { donationsService } from '../../services/firebase/donations.service';
import {
  StripeWebhookEvent,
  StripePaymentIntent,
  StripeInvoice,
  StripeSubscription,
  WebhookProcessingResult,
  WebhookValidationError,
  DonationFromWebhook,
} from '../../types/webhook';
import { Donation } from '../../types/donations';

// Cache for processed events to prevent duplicates
export const processedEvents = new Set<string>();

/**
 * Verify webhook signature using Stripe's validation
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<StripeWebhookEvent> {
  if (!secret) {
    const error = new Error(
      'Webhook secret is missing'
    ) as WebhookValidationError;
    error.code = 'MISSING_SECRET';
    error.statusCode = 500;
    throw error;
  }

  try {
    const event = Stripe.webhooks.constructEvent(payload, signature, secret);
    return event as StripeWebhookEvent;
  } catch (err) {
    const error = new Error(
      `Webhook signature verification failed: ${(err as Error).message}`
    ) as WebhookValidationError;
    error.code = 'INVALID_SIGNATURE';
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Handle successful payment intent
 */
export async function handlePaymentSucceeded(
  paymentIntent: StripePaymentIntent
): Promise<WebhookProcessingResult> {
  try {
    const donationData = createDonationFromPaymentIntent(paymentIntent);
    const donation = await donationsService.createDonation(donationData);

    return {
      success: true,
      donationId: donation.id,
      eventType: 'payment_intent.succeeded',
      processed: true,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process payment success: ${(error as Error).message}`,
      eventType: 'payment_intent.succeeded',
      processed: false,
    };
  }
}

/**
 * Handle failed payment intent
 */
export async function handlePaymentFailed(
  paymentIntent: StripePaymentIntent
): Promise<WebhookProcessingResult> {
  // Log the failure for tracking and potential follow-up
  const memberId = paymentIntent.metadata?.memberId;
  const memberName = paymentIntent.metadata?.memberName;
  const amount = paymentIntent.amount / 100; // Convert from cents

  if (memberId) {
    console.error(
      `Payment failed for member ${memberId} (${memberName}): $${amount} - Payment Intent: ${paymentIntent.id}`
    );
  } else {
    console.error(
      `Payment failed for anonymous user: $${amount} - Payment Intent: ${paymentIntent.id}`
    );
  }

  // For now, we just log failures. In the future, we might:
  // - Send notification emails
  // - Create failed payment records for retry attempts
  // - Update member records with payment failure counts

  return {
    success: true,
    eventType: 'payment_intent.payment_failed',
    processed: true,
  };
}

/**
 * Handle successful recurring payment (invoice paid)
 */
export async function handleRecurringPaymentSucceeded(
  invoice: StripeInvoice
): Promise<WebhookProcessingResult> {
  try {
    const donationData = createDonationFromInvoice(invoice);
    const donation = await donationsService.createDonation(donationData);

    return {
      success: true,
      donationId: donation.id,
      eventType: 'invoice.payment_succeeded',
      processed: true,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to process recurring payment: ${(error as Error).message}`,
      eventType: 'invoice.payment_succeeded',
      processed: false,
    };
  }
}

/**
 * Handle failed recurring payment (invoice payment failed)
 */
export async function handleRecurringPaymentFailed(
  invoice: StripeInvoice
): Promise<WebhookProcessingResult> {
  // Log the failure for tracking
  const memberId = invoice.metadata?.memberId;
  const memberName = invoice.metadata?.memberName;
  const amount = invoice.amount_due / 100; // Convert from cents

  console.error(
    `Recurring payment failed for ${memberId ? `member ${memberId} (${memberName})` : 'unknown member'}: $${amount} - Invoice: ${invoice.id}`
  );

  // In the future, we might:
  // - Pause the subscription after multiple failures
  // - Send notification emails to member and admin
  // - Create follow-up tasks for pastoral care

  return {
    success: true,
    eventType: 'invoice.payment_failed',
    processed: true,
  };
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionCanceled(
  subscription: StripeSubscription
): Promise<WebhookProcessingResult> {
  // Log the cancellation
  const memberId = subscription.metadata?.memberId;
  const memberName = subscription.metadata?.memberName;

  if (memberId) {
    console.log(
      `Subscription canceled for member ${memberId} (${memberName}) - Subscription: ${subscription.id}`
    );
  } else {
    console.log(
      `Subscription canceled for unknown member - Subscription: ${subscription.id}`
    );
  }

  // In the future, we might:
  // - Update member records with subscription status
  // - Send confirmation emails
  // - Create pastoral care follow-up tasks

  return {
    success: true,
    eventType: 'customer.subscription.deleted',
    processed: true,
  };
}

/**
 * Main webhook handler that routes events to appropriate handlers
 */
export async function handleStripeWebhook(
  event: StripeWebhookEvent
): Promise<WebhookProcessingResult> {
  // Implement idempotency to prevent duplicate processing
  if (processedEvents.has(event.id)) {
    return {
      success: true,
      eventType: event.type,
      processed: false,
      skipReason: `Event ${event.id} already processed`,
    };
  }

  try {
    let result: WebhookProcessingResult;

    switch (event.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentSucceeded(
          event.data.object as StripePaymentIntent
        );
        break;

      case 'payment_intent.payment_failed':
        result = await handlePaymentFailed(
          event.data.object as StripePaymentIntent
        );
        break;

      case 'invoice.payment_succeeded':
        result = await handleRecurringPaymentSucceeded(
          event.data.object as StripeInvoice
        );
        break;

      case 'invoice.payment_failed':
        result = await handleRecurringPaymentFailed(
          event.data.object as StripeInvoice
        );
        break;

      case 'customer.subscription.deleted':
        result = await handleSubscriptionCanceled(
          event.data.object as StripeSubscription
        );
        break;

      default:
        // For unsupported event types, we just skip them
        result = {
          success: true,
          eventType: event.type,
          processed: false,
          skipReason: `Unsupported event type: ${event.type}`,
        };
    }

    // Mark event as processed if successful
    if (result.success && result.processed) {
      processedEvents.add(event.id);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: `Webhook processing failed: ${(error as Error).message}`,
      eventType: event.type,
      processed: false,
    };
  }
}

/**
 * Create donation object from Stripe payment intent
 */
function createDonationFromPaymentIntent(
  paymentIntent: StripePaymentIntent
): Omit<Donation, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  const amount = paymentIntent.amount / 100; // Convert from cents to dollars
  const isAnonymous = paymentIntent.metadata?.isAnonymous === 'true';
  const memberId = paymentIntent.metadata?.memberId;
  const memberName = paymentIntent.metadata?.memberName;

  // Use category from metadata or fall back to environment defaults
  const categoryId =
    paymentIntent.metadata?.donationCategoryId ||
    process.env.VITE_DEFAULT_DONATION_CATEGORY_ID ||
    'cat_general_fund';
  const categoryName =
    paymentIntent.metadata?.donationCategoryName ||
    process.env.VITE_DEFAULT_DONATION_CATEGORY_NAME ||
    'General Fund';

  // Ensure created is a valid number
  const createdTimestamp =
    typeof paymentIntent.created === 'number'
      ? paymentIntent.created
      : Math.floor(Date.now() / 1000);
  const donationDate = new Date(createdTimestamp * 1000).toISOString();
  const taxYear = new Date(createdTimestamp * 1000).getFullYear();

  return {
    // Core identification
    memberId: isAnonymous ? undefined : memberId,
    memberName: isAnonymous ? undefined : memberName,

    // Basic donation details
    amount,
    donationDate,
    method: 'stripe',
    note: paymentIntent.description || undefined,

    // Category classification
    categoryId,
    categoryName,

    // Form 990 compliance fields
    form990Fields: {
      lineItem: 'one_time_cash_donation',
      isAnonymous,
      isQuidProQuo: false,
      restrictionType: 'unrestricted',
    },

    // Receipt and tracking
    isReceiptSent: false,

    // Tax information
    isTaxDeductible: true,
    taxYear,

    // Administrative - using 'system' for webhook-created donations
    createdBy: 'system_webhook',

    // Stripe-specific tracking
    stripePaymentIntentId: paymentIntent.id,
  };
}

/**
 * Create donation object from Stripe invoice (recurring payment)
 */
function createDonationFromInvoice(
  invoice: StripeInvoice
): Omit<Donation, 'id' | 'createdAt' | 'updatedAt' | 'status'> {
  const amount = invoice.amount_paid / 100; // Convert from cents to dollars, use amount actually paid
  const memberId = invoice.metadata?.memberId;
  const memberName = invoice.metadata?.memberName;

  // Use category from metadata or fall back to environment defaults
  const categoryId =
    invoice.metadata?.donationCategoryId ||
    process.env.VITE_DEFAULT_DONATION_CATEGORY_ID ||
    'cat_general_fund';
  const categoryName =
    invoice.metadata?.donationCategoryName ||
    process.env.VITE_DEFAULT_DONATION_CATEGORY_NAME ||
    'General Fund';

  // Ensure created is a valid number
  const createdTimestamp =
    typeof invoice.created === 'number'
      ? invoice.created
      : Math.floor(Date.now() / 1000);
  const donationDate = new Date(createdTimestamp * 1000).toISOString();
  const taxYear = new Date(createdTimestamp * 1000).getFullYear();

  // Create note for partial payments
  let note = 'Recurring donation';
  if (invoice.amount_paid < invoice.amount_due) {
    note += ` (Partial payment: $${amount} of $${invoice.amount_due / 100} due)`;
  }

  return {
    // Core identification
    memberId,
    memberName,

    // Basic donation details
    amount,
    donationDate,
    method: 'stripe',
    note,

    // Category classification
    categoryId,
    categoryName,

    // Form 990 compliance fields
    form990Fields: {
      lineItem: 'one_time_cash_donation',
      isAnonymous: false, // Recurring donations typically have known members
      isQuidProQuo: false,
      restrictionType: 'unrestricted',
    },

    // Receipt and tracking
    isReceiptSent: false,

    // Tax information
    isTaxDeductible: true,
    taxYear,

    // Administrative - using 'system' for webhook-created donations
    createdBy: 'system_webhook',

    // Stripe-specific tracking
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: invoice.subscription,
  };
}

/**
 * Serverless function handler for webhook endpoint
 * This would be deployed as an API route (e.g., /api/stripe/webhook)
 */
export async function handler(req: {
  body: string;
  headers: Record<string, string>;
}): Promise<{
  statusCode: number;
  body: string;
  headers: Record<string, string>;
}> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Content-Type': 'application/json',
  };

  try {
    // Only accept POST requests
    if (!req.body) {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
        headers: corsHeaders,
      };
    }

    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing Stripe signature' }),
        headers: corsHeaders,
      };
    }

    if (!webhookSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Webhook secret not configured' }),
        headers: corsHeaders,
      };
    }

    // Verify the webhook signature
    const event = await verifyWebhookSignature(
      req.body,
      signature,
      webhookSecret
    );

    // Process the webhook event
    const result = await handleStripeWebhook(event);

    if (result.success) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          received: true,
          eventId: event.id,
          eventType: event.type,
          processed: result.processed,
          donationId: result.donationId,
          skipReason: result.skipReason,
        }),
        headers: corsHeaders,
      };
    } else {
      console.error('Webhook processing failed:', result.error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Webhook processing failed',
          eventId: event.id,
          eventType: event.type,
          details: result.error,
        }),
        headers: corsHeaders,
      };
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const webhookError = error as WebhookValidationError;
      return {
        statusCode: webhookError.statusCode,
        body: JSON.stringify({
          error: webhookError.message,
          code: webhookError.code,
        }),
        headers: corsHeaders,
      };
    }

    console.error('Unexpected webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
      headers: corsHeaders,
    };
  }
}
