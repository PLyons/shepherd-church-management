# Stripe Webhook Handler

This module implements comprehensive Stripe webhook handling for PRP-2C-008, providing secure and reliable processing of payment events for the Shepherd Church Management System.

## Overview

The webhook handler processes Stripe events and automatically creates donation records in the Firestore database. It includes signature verification, idempotency handling, and comprehensive error management.

## Supported Events

### Payment Events

- `payment_intent.succeeded` - Records successful one-time donations
- `payment_intent.payment_failed` - Logs failed payment attempts

### Recurring Payment Events

- `invoice.payment_succeeded` - Records successful recurring donations
- `invoice.payment_failed` - Logs failed recurring payments

### Subscription Events

- `customer.subscription.deleted` - Handles subscription cancellations

## Features

### Security

- **Webhook Signature Verification**: Uses Stripe's webhook signature verification to ensure requests are authentic
- **Environment Variable Validation**: Validates required environment variables at runtime
- **Request Sanitization**: Properly validates and sanitizes incoming webhook data

### Reliability

- **Idempotency**: Prevents duplicate processing of the same webhook event
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Retry Support**: Returns appropriate status codes for Stripe's retry logic

### Integration

- **DonationsService Integration**: Uses existing `donationsService` for database operations
- **Member Lookup**: Supports both member-linked and anonymous donations
- **Category Management**: Falls back to default categories when not specified

## Usage

### Serverless Deployment

The webhook handler is designed for serverless deployment (e.g., Vercel, Netlify Functions, AWS Lambda):

```typescript
import { handler } from './src/api/stripe/webhook';

export default handler;
```

### Environment Variables

Required environment variables:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
VITE_DEFAULT_DONATION_CATEGORY_ID=cat_general_fund
VITE_DEFAULT_DONATION_CATEGORY_NAME=General Fund
```

### Webhook Endpoint

Configure your Stripe webhook endpoint to point to:

```
https://your-domain.com/api/stripe/webhook
```

### Stripe Dashboard Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint with the URL above
3. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## API Response Format

### Success Response (200)

```json
{
  "received": true,
  "eventId": "evt_1234567890",
  "eventType": "payment_intent.succeeded",
  "processed": true,
  "donationId": "donation_abc123"
}
```

### Error Responses

#### Missing Signature (400)

```json
{
  "error": "Missing Stripe signature"
}
```

#### Invalid Signature (400)

```json
{
  "error": "Webhook signature verification failed: Invalid signature",
  "code": "INVALID_SIGNATURE"
}
```

#### Processing Error (500)

```json
{
  "error": "Webhook processing failed",
  "eventId": "evt_1234567890",
  "eventType": "payment_intent.succeeded",
  "details": "Database connection failed"
}
```

## Donation Metadata

### Payment Intent Metadata

When creating payment intents, include this metadata for proper donation recording:

```javascript
{
  memberId: "member_123",
  memberName: "John Doe",
  donationCategoryId: "cat_general_fund",
  donationCategoryName: "General Fund",
  isAnonymous: "false" // "true" for anonymous donations
}
```

### Recurring Donations

Recurring donations use the same metadata structure in the subscription's metadata.

## Testing

The webhook handler includes comprehensive tests covering:

- **Signature Verification**: Valid/invalid signatures, missing secrets
- **Event Handling**: All supported event types with various scenarios
- **Error Handling**: Service failures, malformed data, processing errors
- **Idempotency**: Duplicate event prevention
- **Integration**: Full integration with DonationsService

Run tests:

```bash
npm run test -- src/api/stripe/__tests__/webhook.test.ts
```

## Security Best Practices

1. **Always verify webhook signatures** - Never process unverified webhooks
2. **Use HTTPS endpoints** - Stripe requires HTTPS for webhook endpoints
3. **Validate environment variables** - Ensure webhook secret is properly configured
4. **Log security events** - Monitor for signature verification failures
5. **Rate limiting** - Implement rate limiting in production deployments

## Deployment Considerations

### Serverless Functions

- **Cold starts**: Handler is optimized for quick startup
- **Memory usage**: Minimal memory footprint for cost efficiency
- **Timeout**: Configure timeout to handle database operations

### Error Monitoring

- **Failed webhooks**: Monitor 4xx/5xx responses in Stripe dashboard
- **Database errors**: Monitor DonationsService errors
- **Signature failures**: Monitor for potential security issues

### Performance

- **Response time**: Handler responds quickly to prevent Stripe timeouts
- **Database connections**: Uses existing Firebase connection pool
- **Idempotency cache**: In-memory cache for duplicate prevention

## Troubleshooting

### Common Issues

1. **Signature verification fails**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure webhook endpoint URL matches Stripe configuration
   - Verify Stripe is sending to the correct endpoint

2. **Donations not created**
   - Check DonationsService logs for errors
   - Verify database permissions
   - Check required metadata is present

3. **Duplicate donations**
   - Idempotency should prevent this automatically
   - Check for issues with event ID generation

### Debug Mode

Enable verbose logging by setting:

```bash
DEBUG=stripe:webhook
```

This will log detailed information about webhook processing.
