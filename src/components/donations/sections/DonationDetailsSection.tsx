// src/components/donations/sections/DonationDetailsSection.tsx
// Donation details section with amount, date, method, category, and optional check number fields
// Provides form validation and responsive grid layout for efficient donation data entry
// RELEVANT FILES: src/types/donations.ts, src/services/firebase/donation-categories.service.ts

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { DonationFormData, DonationCategory } from '../../../types/donations';

interface DonationDetailsSectionProps {
  register: UseFormRegister<DonationFormData>;
  errors: FieldErrors<DonationFormData>;
  watch: UseFormWatch<DonationFormData>;
  categories: DonationCategory[];
}

export const DonationDetailsSection: React.FC<DonationDetailsSectionProps> = ({
  register,
  errors,
  watch,
  categories
}) => {
  const watchMethod = watch('method');

  return (
    <div className="border-b pb-6">
      <h2 className="text-lg font-semibold mb-4">Donation Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Donation Amount *
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            max="1000000"
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
              max: { value: 1000000, message: 'Amount cannot exceed $1,000,000' },
              valueAsNumber: true
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="donationDate" className="block text-sm font-medium text-gray-700 mb-1">
            Donation Date *
          </label>
          <input
            id="donationDate"
            type="date"
            {...register('donationDate', {
              required: 'Donation date is required',
              validate: (value) => {
                const today = new Date().toISOString().split('T')[0];
                return value <= today || 'Donation date cannot be in the future';
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.donationDate && (
            <p className="mt-1 text-sm text-red-600">{errors.donationDate.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method *
          </label>
          <select
            id="method"
            {...register('method', { required: 'Payment method is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="online">Online</option>
          </select>
          {errors.method && (
            <p className="mt-1 text-sm text-red-600">{errors.method.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
            Donation Category *
          </label>
          <select
            id="categoryId"
            {...register('categoryId', { required: 'Category is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        {watchMethod === 'check' && (
          <div>
            <label htmlFor="checkNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Check Number *
            </label>
            <input
              id="checkNumber"
              type="text"
              {...register('checkNumber', {
                required: watchMethod === 'check' ? 'Check number is required' : false
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Check number"
            />
            {errors.checkNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.checkNumber.message}</p>
            )}
          </div>
        )}

        <div className="md:col-span-2">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="note"
            rows={3}
            {...register('note')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional notes about this donation"
          />
        </div>
      </div>
    </div>
  );
};