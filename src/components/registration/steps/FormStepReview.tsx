import { RegistrationFormData } from '../../../types/registration';

interface FormStepReviewProps {
  formData: RegistrationFormData;
}

export function FormStepReview({ formData }: FormStepReviewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900">
          Review Your Information
        </h3>
        <p className="text-gray-600 mt-2">
          Please confirm your details before submitting
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900">Basic Information</h4>
          <p className="text-gray-600">
            {formData.firstName} {formData.lastName}
          </p>
        </div>

        {(formData.email || formData.phone) && (
          <div>
            <h4 className="font-medium text-gray-900">
              Contact Information
            </h4>
            {formData.email && (
              <p className="text-gray-600">{formData.email}</p>
            )}
            {formData.phone && (
              <p className="text-gray-600">{formData.phone}</p>
            )}
          </div>
        )}

        {(formData.birthdate || formData.gender) && (
          <div>
            <h4 className="font-medium text-gray-900">
              Personal Information
            </h4>
            {formData.birthdate && (
              <p className="text-gray-600">
                Born: {new Date(formData.birthdate).toLocaleDateString()}
              </p>
            )}
            {formData.gender && (
              <p className="text-gray-600">Gender: {formData.gender}</p>
            )}
          </div>
        )}

        {formData.address.line1 && (
          <div>
            <h4 className="font-medium text-gray-900">Address</h4>
            <p className="text-gray-600">
              {formData.address.line1}
              {formData.address.line2 && (
                <>
                  <br />
                  {formData.address.line2}
                </>
              )}
              {formData.address.city && (
                <>
                  <br />
                  {formData.address.city}, {formData.address.state}{' '}
                  {formData.address.postalCode}
                </>
              )}
            </p>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-900">Status</h4>
          <p className="text-gray-600 capitalize">
            {formData.memberStatus}
          </p>
        </div>
      </div>
    </div>
  );
}