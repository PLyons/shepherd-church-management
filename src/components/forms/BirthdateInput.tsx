import { useRef, useState, useEffect } from 'react';
import {
  BirthdateComponents,
  parseBirthdate,
  formatBirthdate,
  shouldAdvanceFromMonth,
  shouldAdvanceFromDay,
} from '../../utils/member-form-utils';

interface BirthdateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function BirthdateInput({
  value,
  onChange,
  className = '',
  disabled = false,
}: BirthdateInputProps) {
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const [components, setComponents] = useState<BirthdateComponents>(() =>
    parseBirthdate(value)
  );

  // Sync with external value changes
  useEffect(() => {
    setComponents(parseBirthdate(value));
  }, [value]);

  const handleComponentChange = (
    component: keyof BirthdateComponents,
    newValue: string
  ) => {
    const newComponents = { ...components, [component]: newValue };
    setComponents(newComponents);

    // Update the parent with formatted birthdate
    const formattedDate = formatBirthdate(
      newComponents.month,
      newComponents.day,
      newComponents.year
    );
    onChange(formattedDate);

    // Auto-advance focus with intelligent tabbing
    if (component === 'month' && shouldAdvanceFromMonth(newValue)) {
      setTimeout(() => {
        if (dayRef.current) {
          dayRef.current.focus();
        }
      }, 0);
    } else if (component === 'day' && shouldAdvanceFromDay(newValue)) {
      setTimeout(() => {
        if (yearRef.current) {
          yearRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <input
        ref={monthRef}
        type="text"
        value={components.month}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          // Ensure value is max 2 digits and valid month range
          if (value.length <= 2) {
            const monthNum = parseInt(value);
            if (!value || (monthNum >= 1 && monthNum <= 12)) {
              handleComponentChange('month', value);
            }
          }
        }}
        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
        placeholder="MM"
        maxLength={2}
        disabled={disabled}
      />
      <span className="flex items-center text-gray-400">/</span>
      <input
        ref={dayRef}
        type="text"
        value={components.day}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          // Ensure value is max 2 digits and valid day range
          if (value.length <= 2) {
            const dayNum = parseInt(value);
            if (!value || (dayNum >= 1 && dayNum <= 31)) {
              handleComponentChange('day', value);
            }
          }
        }}
        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
        placeholder="DD"
        maxLength={2}
        disabled={disabled}
      />
      <span className="flex items-center text-gray-400">/</span>
      <input
        ref={yearRef}
        type="text"
        value={components.year}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '');
          if (value.length <= 4) {
            handleComponentChange('year', value);
          }
        }}
        className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
        placeholder="YYYY"
        maxLength={4}
        disabled={disabled}
      />
    </div>
  );
}
