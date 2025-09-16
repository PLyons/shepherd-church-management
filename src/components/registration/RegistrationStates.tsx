// src/components/registration/RegistrationStates.tsx
// Registration state display component for QR code registration flow feedback messages
// This file exists to provide user feedback during different states of the registration process
// RELEVANT FILES: src/pages/QRRegistration.tsx, src/hooks/useQRRegistration.ts, src/services/firebase/public-registration.service.ts, src/components/common/LoadingSpinner.tsx

import { QrCode, AlertCircle, Heart } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface RegistrationStatesProps {
  state: 'loading' | 'no-token' | 'invalid-token' | 'success';
  onReturnHome: () => void;
}

export function RegistrationStates({
  state,
  onReturnHome,
}: RegistrationStatesProps) {
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
        <p className="text-center text-gray-600 mt-4">
          Validating registration link...
        </p>
      </div>
    );
  }

  if (state === 'no-token') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <QrCode className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            QR Registration
          </h2>
          <p className="mt-4 text-gray-600">
            This page requires a valid registration token. Please scan a QR code
            provided by the church.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'invalid-token') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Invalid Registration Link
          </h2>
          <p className="mt-4 text-gray-600">
            This registration link is invalid, expired, or has been used. Please
            contact the church office for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Our Church Family!
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Thank you for registering! A church administrator will review your
            information and get in touch with you soon.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <ul className="text-left text-gray-600 space-y-2">
              <li>• We'll review your registration within 24 hours</li>
              <li>• You'll receive a welcome email with next steps</li>
              <li>• Feel free to visit us this Sunday!</li>
            </ul>
          </div>
          <button
            onClick={onReturnHome}
            className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
}
