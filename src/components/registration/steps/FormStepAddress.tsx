import { RegistrationFormData } from '../../../types/registration';

interface FormStepAddressProps {
  formData: RegistrationFormData;
  updateAddress: (field: string, value: string) => void;
}

export function FormStepAddress({
  formData,
  updateAddress,
}: FormStepAddressProps) {
  const inputClass =
    'mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-4';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900">
          Where are you from?
        </h3>
        <p className="text-gray-600 mt-2">
          Address information is optional but helpful
        </p>
      </div>

      <div>
        <label className={labelClass}>Street Address</label>
        <input
          type="text"
          value={formData.address.line1}
          onChange={(e) => updateAddress('line1', e.target.value)}
          className={inputClass}
          placeholder="123 Main Street"
        />
      </div>

      <div>
        <label className={labelClass}>Apartment, Suite, etc.</label>
        <input
          type="text"
          value={formData.address.line2}
          onChange={(e) => updateAddress('line2', e.target.value)}
          className={inputClass}
          placeholder="Apt 4B, Suite 200, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            value={formData.address.city}
            onChange={(e) => updateAddress('city', e.target.value)}
            className={inputClass}
            placeholder="City"
          />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            type="text"
            value={formData.address.state}
            onChange={(e) => updateAddress('state', e.target.value)}
            className={inputClass}
            placeholder="State"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Postal Code</label>
        <input
          type="text"
          value={formData.address.postalCode}
          onChange={(e) => updateAddress('postalCode', e.target.value)}
          className={inputClass}
          placeholder="12345"
        />
      </div>
    </div>
  );
}