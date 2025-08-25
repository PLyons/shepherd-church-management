import { ChevronDown, ChevronUp } from 'lucide-react';
import { UseFormReturn, FieldErrors } from 'react-hook-form';
import { MemberFormData } from '../../../types';

interface AdministrativeSectionProps {
  form: UseFormReturn<MemberFormData>;
  isExpanded: boolean;
  onToggle: () => void;
  errors: FieldErrors<MemberFormData>;
}

export function AdministrativeSection({
  form,
  isExpanded,
  onToggle,
  errors,
}: AdministrativeSectionProps) {
  const { register } = form;

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
      >
        <h3 className="text-lg font-medium text-gray-900">
          Administrative
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Status *
              </label>
              <select
                {...register('memberStatus', {
                  required: 'Member status is required',
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.memberStatus && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.memberStatus.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member</option>
                <option value="pastor">Pastor</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}