// src/components/donations/MobileDonationModal.tsx
// Mobile-optimized donation modal with multi-step flow and progress indicators
// Integrates DonationForm and PaymentForm for streamlined mobile experience

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { DonationForm } from './DonationForm';
import { PaymentForm } from './PaymentForm';
import { DonationFormData } from '../../types/donations';

interface MobileDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (donationId: string) => void;
}

export const MobileDonationModal: React.FC<MobileDonationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [donationData, setDonationData] = useState<DonationFormData | null>(
    null
  );
  const [donationId, setDonationId] = useState<string>('');

  const handleDonationSubmit = (data: DonationFormData) => {
    setDonationData(data);
    setStep('payment');
  };

  const handlePaymentSuccess = (id: string) => {
    setDonationId(id);
    setStep('success');
    onSuccess?.(id);
  };

  const handleClose = () => {
    setStep('form');
    setDonationData(null);
    setDonationId('');
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'form':
        return (
          <DonationForm
            onSubmit={handleDonationSubmit}
            onCancel={handleClose}
            isMobile={true}
          />
        );

      case 'payment':
        return donationData ? (
          <PaymentForm
            donationData={donationData}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep('form')}
          />
        ) : null;

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check
                className="w-8 h-8 text-green-600"
                role="img"
                aria-label="Success"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Thank You!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your donation has been processed successfully.
            </p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Done
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4">
        <div
          className="w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all"
          role="dialog"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {step === 'form' && 'Make a Donation'}
              {step === 'payment' && 'Complete Payment'}
              {step === 'success' && 'Donation Complete'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{renderStep()}</div>

          {/* Progress Indicator */}
          {step !== 'success' && (
            <div className="px-6 pb-6">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex-1 h-2 rounded-full ${
                    step === 'form'
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  role="progressbar"
                  aria-label={`Step 1: ${step === 'form' ? 'Active' : 'Completed'}`}
                />
                <div
                  className={`flex-1 h-2 rounded-full ${
                    step === 'payment'
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  role="progressbar"
                  aria-label={`Step 2: ${step === 'payment' ? 'Active' : 'Pending'}`}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Donation Details</span>
                <span>Payment</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
