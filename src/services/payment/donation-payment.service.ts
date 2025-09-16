import { auth } from '../../lib/firebase';
import { donationsService } from '../firebase/donations.service';
import { getStripeService } from './stripe.service';
import type {
  Donation,
  DonationFormData,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  RecurringDonation,
} from '../../types/donations';

/**
 * Integration service that connects Stripe payments with donation records
 * Implements PRP-2C-008 payment processing integration
 */
export class DonationPaymentService {
  /**
   * Creates a payment intent and processes the donation
   */
  async processOnlineDonation(
    formData: DonationFormData,
    paymentMethodId: string
  ): Promise<{ donation: Donation; paymentIntent: PaymentIntentResponse }> {
    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to process donations');
    }

    // Get Firebase auth token for backend verification
    const authToken = await currentUser.getIdToken();

    try {
      // Create payment intent with Stripe
      const stripeService = getStripeService();
      const paymentRequest: CreatePaymentIntentRequest = {
        amount: Math.round(formData.amount * 100), // Convert to cents
        currency: 'usd',
        memberId: formData.memberId || currentUser.uid,
        donationCategoryId: formData.categoryId,
        paymentMethodId,
        description: `Donation to ${formData.categoryId}`,
        receiptEmail: formData.receiptEmail,
        confirmationMethod: 'automatic',
        metadata: {
          donationFormId: Date.now().toString(),
          authToken: authToken.substring(0, 50), // Truncated for security
        },
      };

      const paymentIntent =
        await stripeService.createPaymentIntent(paymentRequest);

      if (paymentIntent.error) {
        throw new Error(`Payment failed: ${paymentIntent.error.message}`);
      }

      // Process the payment
      const processedPayment = await stripeService.processPayment(
        paymentIntent.id
      );

      if (processedPayment.error || processedPayment.status !== 'succeeded') {
        throw new Error(
          `Payment processing failed: ${processedPayment.error?.message || 'Unknown error'}`
        );
      }

      // Create donation record in Firebase
      const donationData: DonationFormData = {
        ...formData,
        method: 'stripe',
        sourceLabel: `Stripe Payment ${paymentIntent.id}`,
        note: `${formData.note || ''} | Stripe Payment ID: ${paymentIntent.id}`.trim(),
      };

      const donation = await donationsService.createDonation(donationData);

      return {
        donation,
        paymentIntent: processedPayment,
      };
    } catch (error) {
      console.error('Error processing online donation:', error);
      throw error;
    }
  }

  /**
   * Sets up a recurring donation with Stripe and creates initial record
   */
  async setupRecurringDonation(
    formData: DonationFormData,
    paymentMethodId: string,
    frequency: 'weekly' | 'monthly' | 'yearly'
  ): Promise<{ donation: Donation; subscription: RecurringDonation }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error(
        'User must be authenticated to setup recurring donations'
      );
    }

    try {
      const stripeService = getStripeService();

      // Create recurring donation with Stripe
      const subscription = await stripeService.setupRecurringDonation({
        memberId: formData.memberId || currentUser.uid,
        amount: Math.round(formData.amount * 100), // Convert to cents
        frequency,
        paymentMethodId,
        categoryId: formData.categoryId,
        description: `Recurring ${frequency} donation`,
      });

      // Create initial donation record
      const donationData: DonationFormData = {
        ...formData,
        method: 'stripe',
        sourceLabel: `Recurring Donation ${subscription.id}`,
        note: `${formData.note || ''} | Stripe Subscription ID: ${subscription.id}`.trim(),
      };

      const donation = await donationsService.createDonation(donationData);

      return {
        donation,
        subscription,
      };
    } catch (error) {
      console.error('Error setting up recurring donation:', error);
      throw error;
    }
  }

  /**
   * Cancels a recurring donation
   */
  async cancelRecurringDonation(subscriptionId: string): Promise<boolean> {
    try {
      const stripeService = getStripeService();
      return await stripeService.cancelRecurringDonation(subscriptionId);
    } catch (error) {
      console.error('Error canceling recurring donation:', error);
      return false;
    }
  }

  /**
   * Updates a recurring donation amount
   */
  async updateRecurringDonation(
    subscriptionId: string,
    newAmount: number
  ): Promise<RecurringDonation | null> {
    try {
      const stripeService = getStripeService();
      return await stripeService.updateRecurringDonation(subscriptionId, {
        amount: Math.round(newAmount * 100), // Convert to cents
      });
    } catch (error) {
      console.error('Error updating recurring donation:', error);
      return null;
    }
  }

  /**
   * Retries a failed payment
   */
  async retryFailedPayment(
    paymentIntentId: string
  ): Promise<PaymentIntentResponse> {
    try {
      const stripeService = getStripeService();
      return await stripeService.retryPayment(paymentIntentId);
    } catch (error) {
      console.error('Error retrying failed payment:', error);
      throw error;
    }
  }

  /**
   * Gets saved payment methods for the current user
   */
  async getPaymentMethods(): Promise<
    import('../../types/donations').PaymentMethod[]
  > {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to retrieve payment methods');
    }

    try {
      const stripeService = getStripeService();
      return await stripeService.getPaymentMethods(currentUser.uid);
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      return [];
    }
  }

  /**
   * Deletes a saved payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const stripeService = getStripeService();
      return await stripeService.deletePaymentMethod(paymentMethodId);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }
}

// Export singleton instance
export const donationPaymentService = new DonationPaymentService();
