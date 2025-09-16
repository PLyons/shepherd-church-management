// src/components/donations/QuickDonationModal.tsx
// Quick donation recording modal for member profiles
// Allows admin/pastor to quickly record donations from member profile
// RELEVANT FILES: src/components/members/profile/MemberProfileHeader.tsx, src/services/firebase/donations.service.ts

import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  donationsService,
  donationCategoriesService,
} from '../../services/firebase';
import { useToast } from '../../contexts/ToastContext';
import { DonationMethod, DonationCreateInput } from '../../types/donations';

interface QuickDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  onSuccess?: () => void;
}

interface DonationFormData {
  amount: string;
  method: DonationMethod;
  date: string;
  categoryId: string;
  notes: string;
}

export default function QuickDonationModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  onSuccess,
}: QuickDonationModalProps) {
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DonationFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      method: 'cash' as DonationMethod,
      categoryId: '',
      notes: '',
    },
  });

  // Load categories when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await donationCategoriesService.getAll();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading donation categories:', error);
      addToast('Failed to load donation categories', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const onSubmit = async (data: DonationFormData) => {
    try {
      setLoading(true);

      const donation: DonationCreateInput = {
        memberId,
        amount: parseFloat(data.amount),
        method: data.method,
        date: new Date(data.date),
        categoryId: data.categoryId,
        notes: data.notes,
        status: 'completed',
        isRecurring: false,
      };

      await donationsService.create(donation);

      addToast(`Donation recorded for ${memberName}`, 'success');
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error recording donation:', error);
      addToast('Failed to record donation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Record Donation
              </h2>
              <p className="text-sm text-gray-600">for {memberName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('amount', {
                  required: 'Amount is required',
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: 'Please enter a valid amount',
                  },
                  min: {
                    value: 0.01,
                    message: 'Amount must be greater than 0',
                  },
                })}
                type="number"
                step="0.01"
                min="0.01"
                id="amount"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                {...register('date', { required: 'Date is required' })}
                type="date"
                id="date"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Donation Method */}
          <div>
            <label
              htmlFor="method"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Donation Method *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('method', {
                  required: 'Donation method is required',
                })}
                id="method"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online</option>
              </select>
            </div>
            {errors.method && (
              <p className="mt-1 text-sm text-red-600">
                {errors.method.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              {...register('categoryId')}
              id="categoryId"
              disabled={categoriesLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
            >
              <option value="">Select category (optional)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                {...register('notes')}
                id="notes"
                rows={3}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about this donation..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Recording...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Record Donation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
