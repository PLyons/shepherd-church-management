// src/components/donations/sections/TaxReceiptSection.tsx
// Tax deductible and receipt information section for donation forms with checkbox controls
// Provides simple boolean toggles for tax deductibility and receipt generation preferences
// RELEVANT FILES: src/types/donations.ts, Form 990 compliance documentation

import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { DonationFormData } from '../../../types/donations';

interface TaxReceiptSectionProps {
  register: UseFormRegister<DonationFormData>;
}

export const TaxReceiptSection: React.FC<TaxReceiptSectionProps> = ({
  register,
}) => {
  return (
    <div className="pb-6">
      <h2 className="text-lg font-semibold mb-4">Tax & Receipt Information</h2>

      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('isTaxDeductible')}
            className="mr-2"
          />
          <span>Tax Deductible</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('sendReceipt')}
            className="mr-2"
          />
          <span>Send Receipt</span>
        </label>
      </div>
    </div>
  );
};
