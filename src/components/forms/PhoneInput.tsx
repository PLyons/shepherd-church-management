// src/components/forms/PhoneInput.tsx
// Phone number input component with automatic formatting and validation for consistent form usage
// This file exists to provide standardized phone input with US phone number formatting across all forms
// RELEVANT FILES: src/utils/member-form-utils.ts, src/components/forms/EmailInput.tsx, src/components/members/MemberFormEnhanced.tsx, src/components/registration/steps/FormStepContact.tsx

import React from 'react';
import { formatPhoneNumber } from '../../utils/member-form-utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = '(555) 123-4567',
  required = false,
  disabled = false,
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure phone number is properly formatted when leaving the field
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
    onBlur?.();
  };

  return (
    <input
      type="tel"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      placeholder={placeholder}
      maxLength={14}
      required={required}
      disabled={disabled}
    />
  );
}
