/**
 * Stripe Webhook Handler Tests
 * Comprehensive test suite for PRP-2C-008 Stripe webhook handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';
import {
  handleStripeWebhook,
  handlePaymentSucceeded,
  handlePaymentFailed,
  handleRecurringPaymentSucceeded,
  handleRecurringPaymentFailed,
  handleSubscriptionCanceled,
  verifyWebhookSignature,
  processedEvents,
  handler,
} from '../webhook';
import { donationsService } from '../../../services/firebase/donations.service';
import {
  StripeWebhookEvent,
  StripePaymentIntent,
  StripeInvoice,
  StripeSubscription,
  WebhookValidationError,
} from '../../../types/webhook';

// Mock the donations service
vi.mock('../../../services/firebase/donations.service');

// Mock environment variables
const mockEnv = {
  STRIPE_WEBHOOK_SECRET: 'whsec_test123',
  VITE_DEFAULT_DONATION_CATEGORY_ID: 'cat_general_fund',
  VITE_DEFAULT_DONATION_CATEGORY_NAME: 'General Fund',
};

// Helper function to create mock events
const createMockEvent = (
  type: string,
  data: Record<string, unknown>
): StripeWebhookEvent => ({
  id: 'evt_test123',
  object: 'event',
  api_version: '2024-06-20',
  created: 1645123456,
  data: {
    object: data,
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test123',
    idempotency_key: null,
  },
  type: type as any,
});

beforeEach(() => {
  vi.clearAllMocks();
  // Setup environment variables
  Object.assign(process.env, mockEnv);
  // Clear the processed events cache before each test
  processedEvents.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Webhook Signature Verification', () => {
  it('should verify valid webhook signature successfully', async () => {
    const payload = JSON.stringify({ test: 'data' });
    const secret = 'whsec_test123';
    const signature = 'valid_signature';

    // Mock Stripe's constructEvent method
    const mockEvent = {
      id: 'evt_test',
      type: 'payment_intent.succeeded',
    } as StripeWebhookEvent;
    vi.spyOn(Stripe.webhooks, 'constructEvent').mockReturnValue(mockEvent);

    const result = await verifyWebhookSignature(payload, signature, secret);

    expect(result).toEqual(mockEvent);
    expect(Stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      payload,
      signature,
      secret
    );
  });

  it('should throw WebhookValidationError for invalid signature', async () => {
    const payload = JSON.stringify({ test: 'data' });
    const secret = 'whsec_test123';
    const signature = 'invalid_signature';

    // Mock Stripe's constructEvent to throw an error
    vi.spyOn(Stripe.webhooks, 'constructEvent').mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    await expect(
      verifyWebhookSignature(payload, signature, secret)
    ).rejects.toThrow(WebhookValidationError);
    await expect(
      verifyWebhookSignature(payload, signature, secret)
    ).rejects.toMatchObject({
      code: 'INVALID_SIGNATURE',
      statusCode: 400,
    });
  });

  it('should throw WebhookValidationError when webhook secret is missing', async () => {
    const payload = JSON.stringify({ test: 'data' });
    const signature = 'some_signature';

    await expect(
      verifyWebhookSignature(payload, signature, '')
    ).rejects.toThrow(WebhookValidationError);
    await expect(
      verifyWebhookSignature(payload, signature, '')
    ).rejects.toMatchObject({
      code: 'MISSING_SECRET',
      statusCode: 500,
    });
  });

  it('should handle malformed payload gracefully', async () => {
    const payload = 'invalid json';
    const secret = 'whsec_test123';
    const signature = 'valid_signature';

    vi.spyOn(Stripe.webhooks, 'constructEvent').mockImplementation(() => {
      throw new Error('Invalid payload');
    });

    await expect(
      verifyWebhookSignature(payload, signature, secret)
    ).rejects.toThrow(WebhookValidationError);
  });
});

describe('Payment Success Handler', () => {
  const mockPaymentIntent: StripePaymentIntent = {
    id: 'pi_test123',
    object: 'payment_intent',
    amount: 10000, // $100.00
    currency: 'usd',
    status: 'succeeded',
    metadata: {
      memberId: 'member_123',
      memberName: 'John Doe',
      donationCategoryId: 'cat_general_fund',
      donationCategoryName: 'General Fund',
    },
    receipt_email: 'john@example.com',
    description: 'One-time donation',
    created: 1645123456,
    customer: 'cus_customer123',
  };

  it('should create donation record for successful payment', async () => {
    const mockDonation = {
      id: 'donation_123',
      amount: 100,
      memberId: 'member_123',
      status: 'verified',
    };

    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handlePaymentSucceeded(mockPaymentIntent);

    expect(result.success).toBe(true);
    expect(result.donationId).toBe('donation_123');
    expect(donationsService.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
        memberId: 'member_123',
        method: 'stripe',
      })
    );
  });

  it('should handle anonymous donations without member information', async () => {
    const anonymousPaymentIntent = {
      ...mockPaymentIntent,
      metadata: {
        donationCategoryId: 'cat_general_fund',
        donationCategoryName: 'General Fund',
        isAnonymous: 'true',
      },
    };

    const mockDonation = { id: 'donation_anonymous', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handlePaymentSucceeded(anonymousPaymentIntent);

    expect(result.success).toBe(true);
    expect(donationsService.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: undefined,
        memberName: undefined,
        form990Fields: expect.objectContaining({
          isAnonymous: true,
        }),
      })
    );
  });

  it('should use default category when category not specified', async () => {
    const paymentIntentWithoutCategory = {
      ...mockPaymentIntent,
      metadata: {
        memberId: 'member_123',
        memberName: 'John Doe',
      },
    };

    const mockDonation = { id: 'donation_default_cat', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handlePaymentSucceeded(paymentIntentWithoutCategory);

    expect(result.success).toBe(true);
    expect(donationsService.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat_general_fund',
        categoryName: 'General Fund',
      })
    );
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(donationsService.createDonation).mockRejectedValue(
      new Error('Database error')
    );

    const result = await handlePaymentSucceeded(mockPaymentIntent);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Database error');
  });
});

describe('Payment Failed Handler', () => {
  const mockFailedPaymentIntent: StripePaymentIntent = {
    id: 'pi_failed123',
    object: 'payment_intent',
    amount: 5000,
    currency: 'usd',
    status: 'requires_payment_method',
    metadata: {
      memberId: 'member_456',
      memberName: 'Jane Smith',
    },
    created: 1645123456,
  };

  it('should log failed payment attempt', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await handlePaymentFailed(mockFailedPaymentIntent);

    expect(result.success).toBe(true);
    expect(result.processed).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Payment failed for member member_456')
    );

    consoleSpy.mockRestore();
  });

  it('should handle payment failures without member information', async () => {
    const anonymousFailedPayment = {
      ...mockFailedPaymentIntent,
      metadata: {},
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await handlePaymentFailed(anonymousFailedPayment);

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Payment failed for anonymous user')
    );

    consoleSpy.mockRestore();
  });
});

describe('Recurring Payment Success Handler', () => {
  const mockInvoice: StripeInvoice = {
    id: 'in_test123',
    object: 'invoice',
    amount_paid: 2500, // $25.00
    amount_due: 2500,
    currency: 'usd',
    status: 'paid',
    metadata: {
      memberId: 'member_recurring',
      memberName: 'Bob Wilson',
      donationCategoryId: 'cat_tithe',
      donationCategoryName: 'Tithe',
    },
    customer: 'cus_recurring123',
    subscription: 'sub_recurring456',
    created: 1645123456,
    period_start: 1645123456,
    period_end: 1647801856,
  };

  it('should create donation record for successful recurring payment', async () => {
    const mockDonation = {
      id: 'donation_recurring_123',
      amount: 25,
      memberId: 'member_recurring',
      status: 'verified',
    };

    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handleRecurringPaymentSucceeded(mockInvoice);

    expect(result.success).toBe(true);
    expect(result.donationId).toBe('donation_recurring_123');
    expect(donationsService.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25,
        memberId: 'member_recurring',
        method: 'stripe',
        stripeInvoiceId: 'in_test123',
        stripeSubscriptionId: 'sub_recurring456',
      })
    );
  });

  it('should handle recurring payment with partial payment', async () => {
    const partialInvoice = {
      ...mockInvoice,
      amount_paid: 1500, // Only $15 paid out of $25 due
      amount_due: 2500,
    };

    const mockDonation = { id: 'donation_partial', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handleRecurringPaymentSucceeded(partialInvoice);

    expect(result.success).toBe(true);
    expect(donationsService.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 15, // Should record the amount actually paid
        note: expect.stringContaining('Partial payment'),
      })
    );
  });
});

describe('Recurring Payment Failed Handler', () => {
  const mockFailedInvoice: StripeInvoice = {
    id: 'in_failed123',
    object: 'invoice',
    amount_paid: 0,
    amount_due: 3000,
    currency: 'usd',
    status: 'open',
    metadata: {
      memberId: 'member_failed_recurring',
      memberName: 'Alice Johnson',
    },
    customer: 'cus_failed123',
    subscription: 'sub_failed456',
    created: 1645123456,
    period_start: 1645123456,
    period_end: 1647801856,
  };

  it('should log failed recurring payment', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await handleRecurringPaymentFailed(mockFailedInvoice);

    expect(result.success).toBe(true);
    expect(result.processed).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Recurring payment failed')
    );

    consoleSpy.mockRestore();
  });
});

describe('Subscription Canceled Handler', () => {
  const mockSubscription: StripeSubscription = {
    id: 'sub_canceled123',
    object: 'subscription',
    status: 'canceled',
    customer: 'cus_canceled123',
    metadata: {
      memberId: 'member_canceled',
      memberName: 'Charlie Brown',
    },
    current_period_start: 1645123456,
    current_period_end: 1647801856,
    canceled_at: 1645723456,
    created: 1645123456,
  };

  it('should log subscription cancellation', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await handleSubscriptionCanceled(mockSubscription);

    expect(result.success).toBe(true);
    expect(result.processed).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Subscription canceled for member member_canceled'
      )
    );

    consoleSpy.mockRestore();
  });

  it('should handle subscription cancellation without member info', async () => {
    const anonymousSubscription = {
      ...mockSubscription,
      metadata: {},
    };

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await handleSubscriptionCanceled(anonymousSubscription);

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Subscription canceled for unknown member')
    );

    consoleSpy.mockRestore();
  });
});

describe('Main Webhook Handler', () => {
  it('should handle payment_intent.succeeded events', async () => {
    const mockEvent = {
      id: 'evt_success_unique123',
      object: 'event' as const,
      api_version: '2024-06-20',
      created: 1645123456,
      data: {
        object: {
          id: 'pi_success123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            memberId: 'member_123',
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_success123',
        idempotency_key: null,
      },
      type: 'payment_intent.succeeded' as any,
    };

    const mockDonation = { id: 'donation_123', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handleStripeWebhook(mockEvent);

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('payment_intent.succeeded');
    expect(result.donationId).toBe('donation_123');
  });

  it('should handle payment_intent.payment_failed events', async () => {
    const mockEvent = {
      id: 'evt_failed_unique123',
      object: 'event' as const,
      api_version: '2024-06-20',
      created: 1645123456,
      data: {
        object: {
          id: 'pi_failed123',
          amount: 5000,
          currency: 'usd',
          status: 'requires_payment_method',
          metadata: {
            memberId: 'member_456',
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_failed123',
        idempotency_key: null,
      },
      type: 'payment_intent.payment_failed' as any,
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await handleStripeWebhook(mockEvent);

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('payment_intent.payment_failed');
    expect(result.processed).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should handle invoice.payment_succeeded events', async () => {
    const mockEvent = {
      id: 'evt_invoice_unique123',
      object: 'event' as const,
      api_version: '2024-06-20',
      created: 1645123456,
      data: {
        object: {
          id: 'in_success123',
          amount_paid: 2500,
          currency: 'usd',
          status: 'paid',
          metadata: {
            memberId: 'member_recurring',
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_invoice123',
        idempotency_key: null,
      },
      type: 'invoice.payment_succeeded' as any,
    };

    const mockDonation = { id: 'donation_recurring_123', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handleStripeWebhook(mockEvent);

    expect(result.success).toBe(true);
    expect(result.eventType).toBe('invoice.payment_succeeded');
    expect(result.donationId).toBe('donation_recurring_123');
  });

  it('should skip unsupported event types', async () => {
    const mockEvent = {
      id: 'evt_unsupported_unique123',
      object: 'event' as const,
      api_version: '2024-06-20',
      created: 1645123456,
      data: {
        object: {
          id: 'pm_test123',
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_unsupported123',
        idempotency_key: null,
      },
      type: 'payment_method.attached' as any,
    };

    const result = await handleStripeWebhook(mockEvent);

    expect(result.success).toBe(true);
    expect(result.processed).toBe(false);
    expect(result.skipReason).toBe(
      'Unsupported event type: payment_method.attached'
    );
  });

  it('should handle processing errors gracefully', async () => {
    const mockEvent = {
      id: 'evt_error_unique123',
      object: 'event' as const,
      api_version: '2024-06-20',
      created: 1645123456,
      data: {
        object: {
          id: 'pi_error123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            memberId: 'member_error',
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_error123',
        idempotency_key: null,
      },
      type: 'payment_intent.succeeded' as any,
    };

    vi.mocked(donationsService.createDonation).mockRejectedValue(
      new Error('Processing failed')
    );

    const result = await handleStripeWebhook(mockEvent);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Processing failed');
  });
});

describe('Idempotency Handling', () => {
  it('should prevent duplicate processing of same event', async () => {
    // Create unique mock event to avoid interference with other tests
    const mockEvent = {
      id: 'evt_duplicate_unique123',
      object: 'event' as const,
      api_version: '2024-06-20',
      created: 1645123456,
      data: {
        object: {
          id: 'pi_duplicate123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            memberId: 'member_123',
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_duplicate123',
        idempotency_key: null,
      },
      type: 'payment_intent.succeeded' as any,
    };

    const mockDonation = { id: 'donation_123', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    // Process the same event twice
    const result1 = await handleStripeWebhook(mockEvent);
    const result2 = await handleStripeWebhook(mockEvent);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result2.processed).toBe(false);
    expect(result2.skipReason).toContain('already processed');
    // Should only create one donation record
    expect(donationsService.createDonation).toHaveBeenCalledTimes(1);
  });
});

describe('Environment Configuration', () => {
  it('should use environment variables for default category', async () => {
    // Create unique mock event to avoid interference with other tests
    const mockEvent = {
      id: 'evt_env_unique123',
      object: 'event' as const,
      api_version: '2024-06-20',
      created: 1645123456,
      data: {
        object: {
          id: 'pi_env_test123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            memberId: 'member_123',
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_env123',
        idempotency_key: null,
      },
      type: 'payment_intent.succeeded' as any,
    };

    const mockDonation = { id: 'donation_env_123', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    await handleStripeWebhook(mockEvent);

    expect(donationsService.createDonation).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'cat_general_fund',
        categoryName: 'General Fund',
      })
    );
  });
});

describe('Serverless Handler', () => {
  it('should return 405 for non-POST requests', async () => {
    const result = await handler({
      body: '',
      headers: {},
    });

    expect(result.statusCode).toBe(405);
    expect(JSON.parse(result.body)).toEqual({ error: 'Method not allowed' });
  });

  it('should return 400 for missing signature', async () => {
    const result = await handler({
      body: JSON.stringify({ test: 'data' }),
      headers: {},
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Missing Stripe signature',
    });
  });

  it('should return 500 for missing webhook secret', async () => {
    // Temporarily remove webhook secret
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const result = await handler({
      body: JSON.stringify({ test: 'data' }),
      headers: { 'stripe-signature': 'sig_test' },
    });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Webhook secret not configured',
    });

    // Restore webhook secret
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it('should return 400 for invalid signature', async () => {
    // Mock Stripe's constructEvent to throw an error
    vi.spyOn(Stripe.webhooks, 'constructEvent').mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const result = await handler({
      body: JSON.stringify({ test: 'data' }),
      headers: { 'stripe-signature': 'invalid_sig' },
    });

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain('Webhook signature verification failed');
    expect(body.code).toBe('INVALID_SIGNATURE');

    vi.restoreAllMocks();
  });

  it('should return 200 for successful webhook processing', async () => {
    const mockEvent = {
      id: 'evt_handler_test123',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_handler_test123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            memberId: 'member_123',
          },
          created: 1645123456,
        },
      },
    };

    // Mock Stripe's constructEvent to return our mock event
    vi.spyOn(Stripe.webhooks, 'constructEvent').mockReturnValue(
      mockEvent as any
    );

    const mockDonation = { id: 'donation_handler_123', status: 'verified' };
    vi.mocked(donationsService.createDonation).mockResolvedValue(
      mockDonation as any
    );

    const result = await handler({
      body: JSON.stringify(mockEvent),
      headers: { 'stripe-signature': 'valid_sig' },
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.received).toBe(true);
    expect(body.eventId).toBe('evt_handler_test123');
    expect(body.eventType).toBe('payment_intent.succeeded');
    expect(body.processed).toBe(true);
    expect(body.donationId).toBe('donation_handler_123');

    vi.restoreAllMocks();
  });

  it('should return 500 for webhook processing errors', async () => {
    const mockEvent = {
      id: 'evt_handler_error123',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_handler_error123',
          amount: 10000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            memberId: 'member_error',
          },
          created: 1645123456,
        },
      },
    };

    // Mock Stripe's constructEvent to return our mock event
    vi.spyOn(Stripe.webhooks, 'constructEvent').mockReturnValue(
      mockEvent as any
    );

    // Mock donations service to throw an error
    vi.mocked(donationsService.createDonation).mockRejectedValue(
      new Error('Database error')
    );

    const result = await handler({
      body: JSON.stringify(mockEvent),
      headers: { 'stripe-signature': 'valid_sig' },
    });

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Webhook processing failed');
    expect(body.eventId).toBe('evt_handler_error123');
    expect(body.eventType).toBe('payment_intent.succeeded');
    expect(body.details).toContain('Database error');

    vi.restoreAllMocks();
  });

  it('should include CORS headers in all responses', async () => {
    const result = await handler({
      body: '',
      headers: {},
    });

    expect(result.headers).toEqual(
      expect.objectContaining({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
        'Content-Type': 'application/json',
      })
    );
  });
});
