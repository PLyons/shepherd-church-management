// src/components/registration/steps/FormStepContact.tsx
// Contact information form step component for QR code registration multi-step form
// This file exists to capture phone, email, and communication preferences in the registration process
// RELEVANT FILES: src/utils/member-form-utils.ts, src/hooks/useQRRegistration.ts, src/types/registration.ts, src/components/registration/steps/FormStepBasic.tsx

import { formatPhoneNumber } from '../../../utils/member-form-utils';
import { FormErrors } from '../../../hooks/useQRRegistration';
import { RegistrationFormData } from '../../../types/registration';

interface FormStepContactProps {
  formData: RegistrationFormData;
  errors: FormErrors;
  updateFormData: (field: keyof RegistrationFormData, value: string) => void;
  validateStep: (step: 'contact') => boolean;
}

export function FormStepContact({
  formData,
  errors,
  updateFormData,
  validateStep,
}: FormStepContactProps) {
  const inputClass =
    'mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-4';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
  const errorClass = 'mt-1 text-sm text-red-600';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900">
          How can we reach you?
        </h3>
        <p className="text-gray-600 mt-2">
          Contact information helps us stay connected (optional)
        </p>
      </div>

      <div>
        <label className={labelClass}>Email Address</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          onBlur={() => validateStep('contact')}
          className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
          placeholder="your@email.com"
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      <div>
        <label className={labelClass}>Phone Number</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            updateFormData('phone', formatted);
          }}
          onBlur={() => validateStep('contact')}
          className={`${inputClass} ${errors.phone ? 'border-red-500' : ''}`}
          placeholder="(555) 123-4567"
        />
        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
      </div>
    </div>
  );
}
