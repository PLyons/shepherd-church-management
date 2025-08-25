import { FormErrors, useQRRegistration } from '../../../hooks/useQRRegistration';
import { RegistrationFormData } from '../../../types/registration';

interface FormStepBasicProps {
  formData: RegistrationFormData;
  errors: FormErrors;
  updateFormData: (field: keyof RegistrationFormData, value: string) => void;
  validateStep: (step: 'basic') => boolean;
}

export function FormStepBasic({
  formData,
  errors,
  updateFormData,
  validateStep,
}: FormStepBasicProps) {
  const inputClass =
    'mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-4';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
  const errorClass = 'mt-1 text-sm text-red-600';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900">
          Let's start with the basics
        </h3>
        <p className="text-gray-600 mt-2">
          We just need your name to get started
        </p>
      </div>

      <div>
        <label className={labelClass}>First Name *</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => updateFormData('firstName', e.target.value)}
          onBlur={() => validateStep('basic')}
          className={`${inputClass} ${errors.firstName ? 'border-red-500' : ''}`}
          placeholder="Enter your first name"
          autoFocus
        />
        {errors.firstName && (
          <p className={errorClass}>{errors.firstName}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Last Name *</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => updateFormData('lastName', e.target.value)}
          onBlur={() => validateStep('basic')}
          className={`${inputClass} ${errors.lastName ? 'border-red-500' : ''}`}
          placeholder="Enter your last name"
        />
        {errors.lastName && (
          <p className={errorClass}>{errors.lastName}</p>
        )}
      </div>
    </div>
  );
}