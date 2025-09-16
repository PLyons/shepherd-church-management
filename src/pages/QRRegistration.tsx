import { UserPlus, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useQRRegistration } from '../hooks/useQRRegistration';
import { RegistrationStates } from '../components/registration/RegistrationStates';
import { FormStepBasic } from '../components/registration/steps/FormStepBasic';
import { FormStepContact } from '../components/registration/steps/FormStepContact';
import { FormStepPersonal } from '../components/registration/steps/FormStepPersonal';
import { FormStepAddress } from '../components/registration/steps/FormStepAddress';
import { FormStepStatus } from '../components/registration/steps/FormStepStatus';
import { FormStepReview } from '../components/registration/steps/FormStepReview';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function QRRegistration() {
  const {
    loading,
    submitting,
    submitted,
    currentStep,
    currentStepIndex,
    token,
    tokenParam,
    formData,
    errors,
    steps,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    canProceed,
    handleSubmit,
    updateFormData,
    updateAddress,
    validateStep,
    handleReturnHome,
  } = useQRRegistration();

  // Loading state
  if (loading) {
    return (
      <RegistrationStates state="loading" onReturnHome={handleReturnHome} />
    );
  }

  // No token parameter
  if (!tokenParam) {
    return (
      <RegistrationStates state="no-token" onReturnHome={handleReturnHome} />
    );
  }

  // Invalid token
  if (!token) {
    return (
      <RegistrationStates
        state="invalid-token"
        onReturnHome={handleReturnHome}
      />
    );
  }

  // Success state
  if (submitted) {
    return (
      <RegistrationStates state="success" onReturnHome={handleReturnHome} />
    );
  }

  // Progressive form renderer
  const renderFormStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <FormStepBasic
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            validateStep={validateStep}
          />
        );

      case 'contact':
        return (
          <FormStepContact
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            validateStep={validateStep}
          />
        );

      case 'personal':
        return (
          <FormStepPersonal
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            validateStep={validateStep}
          />
        );

      case 'address':
        return (
          <FormStepAddress formData={formData} updateAddress={updateAddress} />
        );

      case 'status':
        return (
          <FormStepStatus formData={formData} updateFormData={updateFormData} />
        );

      case 'review':
        return <FormStepReview formData={formData} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center">
            <UserPlus className="mx-auto h-10 w-10 text-blue-600" />
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Welcome to Our Church!
            </h1>
            {token.metadata.purpose && (
              <p className="text-sm text-gray-600 mt-1">
                {token.metadata.purpose}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-gray-900">
              {steps[currentStepIndex].title}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              ({currentStepIndex + 1} of {steps.length})
            </span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {renderFormStep()}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="bg-white border-t shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center space-x-4">
            {!isFirstStep ? (
              <button
                onClick={prevStep}
                className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>
            ) : (
              <div></div>
            )}

            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !canProceed()}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="w-5 h-5 mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Registration
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLastStep ? 'Review' : 'Continue'}
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
