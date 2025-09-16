import { RegistrationFormData } from '../../../types/registration';

interface FormStepStatusProps {
  formData: RegistrationFormData;
  updateFormData: (field: keyof RegistrationFormData, value: string) => void;
}

export function FormStepStatus({
  formData,
  updateFormData,
}: FormStepStatusProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900">
          Are you visiting or a member?
        </h3>
        <p className="text-gray-600 mt-2">
          This helps us know how to best welcome you
        </p>
      </div>

      <div className="space-y-4">
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            formData.memberStatus === 'visitor'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => updateFormData('memberStatus', 'visitor')}
        >
          <div className="flex items-center">
            <input
              type="radio"
              name="memberStatus"
              value="visitor"
              checked={formData.memberStatus === 'visitor'}
              onChange={() => updateFormData('memberStatus', 'visitor')}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3">
              <div className="text-lg font-medium text-gray-900">Visitor</div>
              <div className="text-gray-600">I'm visiting this church</div>
            </div>
          </div>
        </div>

        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            formData.memberStatus === 'member'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => updateFormData('memberStatus', 'member')}
        >
          <div className="flex items-center">
            <input
              type="radio"
              name="memberStatus"
              value="member"
              checked={formData.memberStatus === 'member'}
              onChange={() => updateFormData('memberStatus', 'member')}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3">
              <div className="text-lg font-medium text-gray-900">Member</div>
              <div className="text-gray-600">
                I'm already a member of this church
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
