/**
 * Stripe Webhook Types
 * Type definitions for Stripe webhook events and processing
 */

export interface StripeWebhookEvent {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: StripeWebhookEventType;
}

export type StripeWebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.subscription.deleted'
  | 'payment_intent.created'
  | 'payment_intent.processing'
  | 'payment_intent.canceled';

export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: 'succeeded' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled';
  metadata: Record<string, string>;
  receipt_email?: string;
  description?: string;
  created: number;
  customer?: string;
  payment_method?: string;
}

export interface StripeInvoice {
  id: string;
  object: 'invoice';
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  metadata: Record<string, string>;
  customer: string;
  subscription?: string;
  created: number;
  period_start: number;
  period_end: number;
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  customer: string;
  metadata: Record<string, string>;
  current_period_start: number;
  current_period_end: number;
  canceled_at?: number;
  created: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  donationId?: string;
  error?: string;
  eventType: StripeWebhookEventType;
  processed: boolean;
  skipReason?: string;
}

export interface WebhookHandlerContext {
  event: StripeWebhookEvent;
  requestId: string;
  timestamp: number;
  retryCount?: number;
}

export interface DonationFromWebhook {
  memberId?: string;
  memberName?: string;
  amount: number;
  donationDate: string;
  method: 'stripe';
  categoryId: string;
  categoryName: string;
  form990Fields: {
    lineItem: 'one_time_cash_donation';
    isAnonymous: boolean;
    isQuidProQuo: boolean;
    quidProQuoValue?: number;
    restrictionType: 'unrestricted';
    restrictionDescription?: string;
  };
  isTaxDeductible: boolean;
  taxYear: number;
  createdBy: string;
  receiptNumber?: string;
  note?: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  stripeSubscriptionId?: string;
}

export interface WebhookValidationError extends Error {
  code: 'INVALID_SIGNATURE' | 'INVALID_PAYLOAD' | 'MISSING_SECRET' | 'PROCESSING_FAILED';
  statusCode: number;
}