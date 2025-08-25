import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { MemberFormData, Phone } from '../../../types';

interface ContactInfoSectionProps {
  form: UseFormReturn<MemberFormData>;
  emailFieldArray: UseFieldArrayReturn<MemberFormData, 'emails'>;
  phoneFieldArray: UseFieldArrayReturn<MemberFormData, 'phones'>;
  watchedPhones: Phone[] | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ContactInfoSection({
  form,
  emailFieldArray,
  phoneFieldArray,
  watchedPhones,
  isExpanded,
  onToggle,
}: ContactInfoSectionProps) {
  const { register } = form;
  const { fields: emailFields, append: appendEmail, remove: removeEmail } = emailFieldArray;
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = phoneFieldArray;

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
      >
        <h3 className="text-lg font-medium text-gray-900">
          Contact Information
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Email Addresses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Email Addresses
              </label>
              <button
                type="button"
                onClick={() =>
                  appendEmail({
                    type: 'home',
                    address: '',
                    primary: false,
                  })
                }
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Email
              </button>
            </div>

            {emailFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center space-x-2 mb-2"
              >
                <select
                  {...register(`emails.${index}.type` as const)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>

                <input
                  type="email"
                  {...register(`emails.${index}.address` as const, {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register(`emails.${index}.primary` as const)}
                    className="mr-1"
                  />
                  <span className="text-xs text-gray-500">Primary</span>
                </label>

                {emailFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmail(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Phone Numbers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Phone Numbers
              </label>
              <button
                type="button"
                onClick={() =>
                  appendPhone({
                    type: 'mobile',
                    number: '',
                    primary: false,
                    smsOptIn: false,
                  })
                }
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Phone
              </button>
            </div>

            {phoneFields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-2 mb-4 p-3 border border-gray-200 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <select
                    {...register(`phones.${index}.type` as const)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mobile">Mobile</option>
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    type="tel"
                    {...register(`phones.${index}.number` as const)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register(`phones.${index}.primary` as const)}
                      className="mr-1"
                    />
                    <span className="text-xs text-gray-500">Primary</span>
                  </label>

                  {phoneFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* SMS Opt-in for mobile phones */}
                {watchedPhones &&
                  watchedPhones[index]?.type === 'mobile' && (
                    <label className="flex items-center text-sm text-gray-600">
                      <input
                        type="checkbox"
                        {...register(`phones.${index}.smsOptIn` as const)}
                        className="mr-2"
                      />
                      Allow SMS messages to this number
                    </label>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}