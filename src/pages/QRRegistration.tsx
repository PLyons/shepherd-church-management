import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  QrCode,
  UserPlus,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Heart,
} from 'lucide-react';
import { registrationTokensService } from '../services/firebase/registration-tokens.service';
import { publicRegistrationService } from '../services/firebase/public-registration.service';
import {
  RegistrationToken,
  RegistrationFormData,
  TokenValidationResult,
} from '../types/registration';

// Form step enumeration
type FormStep =
  | 'basic'
  | 'contact'
  | 'personal'
  | 'address'
  | 'status'
  | 'review';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthdate?: string;
}

export default function QRRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [token, setToken] = useState<RegistrationToken | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '',
    memberStatus: 'visitor',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
    },
  });

  const tokenParam = searchParams.get('token');

  // Form step configuration
  const steps: { id: FormStep; title: string; required: boolean }[] = [
    { id: 'basic', title: 'Basic Info', required: true },
    { id: 'contact', title: 'Contact', required: false },
    { id: 'personal', title: 'Personal', required: false },
    { id: 'address', title: 'Address', required: false },
    { id: 'status', title: 'Status', required: true },
    { id: 'review', title: 'Review', required: true },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (tokenParam) {
      validateToken(tokenParam);
    } else {
      setLoading(false);
    }
  }, [tokenParam]);

  const validateToken = async (tokenValue: string) => {
    try {
      setLoading(true);

      const result: TokenValidationResult =
        await registrationTokensService.validateToken(tokenValue);

      if (!result.isValid) {
        showToast(result.error || 'Invalid registration link', 'error');
        return;
      }

      setToken(result.token!);
    } catch (err) {
      showToast('Error validating registration link', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateStep = (step: FormStep): boolean => {
    const newErrors: FormErrors = {};

    if (step === 'basic') {
      if (!formData.firstName.trim())
        newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim())
        newErrors.lastName = 'Last name is required';
    }

    if (step === 'contact') {
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (
        formData.phone &&
        !/^[\d\s\-\(\)\+\.]{10,}$/.test(formData.phone.replace(/\D/g, ''))
      ) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (step === 'personal') {
      if (formData.birthdate && new Date(formData.birthdate) > new Date()) {
        newErrors.birthdate = 'Birth date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Phone number formatting
  const formatPhoneNumber = (value: string): string => {
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStep(steps[currentStepIndex + 1].id);
      }
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const canProceed = (): boolean => {
    if (currentStep === 'basic') {
      return (
        formData.firstName.trim() !== '' && formData.lastName.trim() !== ''
      );
    }
    if (currentStep === 'review') {
      return (
        formData.firstName.trim() !== '' && formData.lastName.trim() !== ''
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!token) {
      showToast('Invalid registration token', 'error');
      return;
    }

    if (!validateStep('basic')) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);

      // Enhanced metadata collection
      const metadata = {
        ipAddress: undefined, // Would need server-side implementation to get real IP
        userAgent: navigator.userAgent,
      };

      // Submit registration
      const result = await publicRegistrationService.submitRegistration(
        token.id,
        formData,
        metadata
      );

      if (!result.success) {
        showToast(result.error || 'Registration failed', 'error');
        return;
      }

      // Increment token usage
      await registrationTokensService.incrementUsage(token.id);

      setSubmitted(true);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Registration failed',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update form data with validation
  const updateFormData = (
    field: keyof RegistrationFormData,
    value: RegistrationFormData[keyof RegistrationFormData]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateAddress = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
        <p className="text-center text-gray-600 mt-4">
          Validating registration link...
        </p>
      </div>
    );
  }

  // No token parameter
  if (!tokenParam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <QrCode className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            QR Registration
          </h2>
          <p className="mt-4 text-gray-600">
            This page requires a valid registration token. Please scan a QR code
            provided by the church.
          </p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Invalid Registration Link
          </h2>
          <p className="mt-4 text-gray-600">
            This registration link is invalid, expired, or has been used. Please
            contact the church office for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Our Church Family!
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Thank you for registering! A church administrator will review your
            information and get in touch with you soon.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <ul className="text-left text-gray-600 space-y-2">
              <li>• We'll review your registration within 24 hours</li>
              <li>• You'll receive a welcome email with next steps</li>
              <li>• Feel free to visit us this Sunday!</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Progressive form renderer
  const renderFormStep = () => {
    const inputClass =
      'mt-1 block w-full h-12 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base px-4';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
    const errorClass = 'mt-1 text-sm text-red-600';

    switch (currentStep) {
      case 'basic':
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

      case 'contact':
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

      case 'personal':
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
              {errors.birthdate && (
                <p className={errorClass}>{errors.birthdate}</p>
              )}
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

      case 'address':
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

      case 'status':
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
                    <div className="text-lg font-medium text-gray-900">
                      Visitor
                    </div>
                    <div className="text-gray-600">
                      I'm visiting this church
                    </div>
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
                    <div className="text-lg font-medium text-gray-900">
                      Member
                    </div>
                    <div className="text-gray-600">
                      I'm already a member of this church
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
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
