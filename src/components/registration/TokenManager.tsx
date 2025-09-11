// src/components/registration/TokenManager.tsx
// Registration token management form component for creating and configuring QR registration tokens
// This file exists to provide admin interface for creating time-limited registration tokens with metadata
// RELEVANT FILES: src/services/firebase/registration-tokens.service.ts, src/pages/admin/RegistrationTokens.tsx, src/components/registration/QRCodeDisplay.tsx, src/utils/token-generator.ts

import React, { useState } from 'react';
import { X, Calendar, Hash, FileText, MapPin } from 'lucide-react';

interface TokenManagerProps {
  onSubmit: (tokenData: {
    expiresAt?: string;
    maxUses?: number;
    metadata: {
      purpose: string;
      notes?: string;
      eventDate?: string;
      location?: string;
    };
  }) => void;
  onCancel: () => void;
}

export function TokenManager({ onSubmit, onCancel }: TokenManagerProps) {
  const [formData, setFormData] = useState({
    purpose: '',
    notes: '',
    eventDate: '',
    location: '',
    expiresAt: '',
    maxUses: '',
    hasExpiration: false,
    hasUsageLimit: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    if (formData.hasExpiration && !formData.expiresAt) {
      newErrors.expiresAt =
        'Expiration date is required when expiration is enabled';
    }

    if (
      formData.hasUsageLimit &&
      (!formData.maxUses || parseInt(formData.maxUses) <= 0)
    ) {
      newErrors.maxUses =
        'Valid usage limit is required when usage limit is enabled';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare submission data
    const tokenData = {
      expiresAt: formData.hasExpiration ? formData.expiresAt : undefined,
      maxUses: formData.hasUsageLimit ? parseInt(formData.maxUses) : -1,
      metadata: {
        purpose: formData.purpose.trim(),
        notes: formData.notes.trim() || undefined,
        eventDate: formData.eventDate || undefined,
        location: formData.location.trim() || undefined,
      },
    };

    onSubmit(tokenData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Registration Token
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Purpose *
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="e.g., Sunday Service, Youth Event, Christmas Service"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.purpose ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.purpose && (
              <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this registration token..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Event Date (Optional)
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => handleInputChange('eventDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location (Optional)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Main Sanctuary, Youth Room, Fellowship Hall"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expiration Settings */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="hasExpiration"
                checked={formData.hasExpiration}
                onChange={(e) =>
                  handleInputChange('hasExpiration', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hasExpiration"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Set expiration date
              </label>
            </div>

            {formData.hasExpiration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Expires At *
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    handleInputChange('expiresAt', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.expiresAt ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expiresAt && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expiresAt}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Usage Limit Settings */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="hasUsageLimit"
                checked={formData.hasUsageLimit}
                onChange={(e) =>
                  handleInputChange('hasUsageLimit', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hasUsageLimit"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Set usage limit
              </label>
            </div>

            {formData.hasUsageLimit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Maximum Uses *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => handleInputChange('maxUses', e.target.value)}
                  placeholder="e.g., 100"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.maxUses ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maxUses && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxUses}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  The token will be automatically disabled after this many
                  registrations
                </p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
