import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { registrationTokensService } from '../services/firebase/registration-tokens.service';
import { publicRegistrationService } from '../services/firebase/public-registration.service';
import {
  RegistrationToken,
  RegistrationFormData,
  TokenValidationResult,
} from '../types/registration';

// Form step enumeration
export type FormStep =
  | 'basic'
  | 'contact'
  | 'personal'
  | 'address'
  | 'status'
  | 'review';

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthdate?: string;
}

export function useQRRegistration() {
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
        !/^[\d\s\-()+.]{10,}$/.test(formData.phone.replace(/\D/g, ''))
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

  const handleReturnHome = () => {
    navigate('/');
  };

  return {
    // State
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
    
    // Actions
    nextStep,
    prevStep,
    canProceed,
    handleSubmit,
    updateFormData,
    updateAddress,
    validateStep,
    handleReturnHome,
  };
}