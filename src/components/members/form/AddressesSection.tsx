import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { MemberFormData } from '../../../types';
import { STATES_AND_TERRITORIES } from '../../../constants/states';

interface AddressesSectionProps {
  form: UseFormReturn<MemberFormData>;
  addressFieldArray: UseFieldArrayReturn<MemberFormData, 'addresses'>;
  isExpanded: boolean;
  onToggle: () => void;
}

export function AddressesSection({
  form,
  addressFieldArray,
  isExpanded,
  onToggle,
}: AddressesSectionProps) {
  const { register } = form;
  const { fields: addressFields, append: appendAddress, remove: removeAddress } = addressFieldArray;

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
      >
        <h3 className="text-lg font-medium text-gray-900">Addresses</h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Physical Addresses
            </label>
            <button
              type="button"
              onClick={() =>
                appendAddress({
                  type: 'home',
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  country: 'United States',
                  primary: false,
                })
              }
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </button>
          </div>

          {addressFields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-3 mb-4 p-4 border border-gray-200 rounded-md"
            >
              <div className="flex items-center justify-between">
                <select
                  {...register(`addresses.${index}.type` as const)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register(`addresses.${index}.primary` as const)}
                      className="mr-1"
                    />
                    <span className="text-xs text-gray-500">Primary</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  {...register(`addresses.${index}.addressLine1` as const)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street Address"
                />

                <input
                  type="text"
                  {...register(`addresses.${index}.addressLine2` as const)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apt, Suite, etc. (optional)"
                />

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    {...register(`addresses.${index}.city` as const)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />

                  <select
                    {...register(`addresses.${index}.state` as const)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select State...</option>
                    {STATES_AND_TERRITORIES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    {...register(`addresses.${index}.postalCode` as const)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ZIP Code"
                  />
                </div>

                <input
                  type="text"
                  {...register(`addresses.${index}.country` as const)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Country"
                />
              </div>
            </div>
          ))}

          {addressFields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No addresses added. Click "Add Address" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}