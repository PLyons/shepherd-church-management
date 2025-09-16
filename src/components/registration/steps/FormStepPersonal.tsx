import { FormErrors } from '../../../hooks/useQRRegistration';
import { RegistrationFormData } from '../../../types/registration';

interface FormStepPersonalProps {
  formData: RegistrationFormData;
  errors: FormErrors;
  updateFormData: (field: keyof RegistrationFormData, value: string) => void;
  validateStep: (step: 'personal') => boolean;
}

export function FormStepPersonal({
  formData,
  errors,
  updateFormData,
  validateStep,
}: FormStepPersonalProps) {
  const inputClass =
    'mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-4';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
  const errorClass = 'mt-1 text-sm text-red-600';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900">
          Tell us a bit about yourself
        </h3>
        <p className="text-gray-600 mt-2">
          This helps us serve you better (optional)
        </p>
      </div>

      <div>
        <label className={labelClass}>Birth Date</label>
        <input
          type="date"
          value={formData.birthdate}
          onChange={(e) => updateFormData('birthdate', e.target.value)}
          onBlur={() => validateStep('personal')}
          className={`${inputClass} ${errors.birthdate ? 'border-red-500' : ''}`}
          max={new Date().toISOString().split('T')[0]}
        />
        {errors.birthdate && <p className={errorClass}>{errors.birthdate}</p>}
      </div>

      <div>
        <label className={labelClass}>Gender</label>
        <select
          value={formData.gender}
          onChange={(e) => updateFormData('gender', e.target.value)}
          className={inputClass}
        >
          <option value="">Prefer not to say</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
    </div>
  );
}
