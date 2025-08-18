import React, { useState } from 'react';
import { isValidEmail } from '../../utils/member-form-utils';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showValidation?: boolean;
}

export function EmailInput({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = 'email@example.com',
  required = false,
  disabled = false,
  showValidation = true,
}: EmailInputProps) {
  const [emailError, setEmailError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    onChange(email);
    
    // Validate email if not empty and validation is enabled
    if (showValidation) {
      if (email && !isValidEmail(email)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const handleBlur = () => {
    onBlur?.();
  };

  const hasError = showValidation && emailError;

  return (
    <div>
      <input
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          hasError ? 'border-red-300' : 'border-gray-300'
        } ${className}`}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      {hasError && (
        <p className="mt-1 text-sm text-red-600">{emailError}</p>
      )}
    </div>
  );
}