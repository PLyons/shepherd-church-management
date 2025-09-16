// src/components/donations/sections/BatchModeSection.tsx
// Batch donation entry mode controls and status display for processing multiple donations efficiently
// Provides toggle controls and batch entry counter with action buttons for bulk donation processing
// RELEVANT FILES: src/types/donations.ts, src/components/donations/DonationForm.tsx

import React from 'react';
import { DonationFormData } from '../../../types/donations';

interface BatchModeSectionProps {
  enableBatchMode: boolean;
  batchMode: boolean;
  batchEntries: DonationFormData[];
  onBatchModeToggle: (enabled: boolean) => void;
  onAddBatchEntry: () => void;
}

export const BatchModeSection: React.FC<BatchModeSectionProps> = ({
  enableBatchMode,
  batchMode,
  batchEntries,
  onBatchModeToggle,
  onAddBatchEntry,
}) => {
  if (!enableBatchMode) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={batchMode}
            onChange={(e) => onBatchModeToggle(e.target.checked)}
            className="mr-2"
          />
          <span>Batch Entry Mode</span>
        </label>
      </div>

      {batchMode && (
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">
              Batch Entries: {batchEntries.length}
            </span>
            <button
              type="button"
              onClick={onAddBatchEntry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Another Donation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
