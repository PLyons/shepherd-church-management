// src/pages/BatchRecordDonations.tsx
// Batch donation recording page for efficient multiple entry
// Uses DonationForm in batch mode for recording multiple donations at once
// RELEVANT FILES: src/components/donations/DonationForm.tsx, src/pages/RecordDonation.tsx, src/components/auth/RoleGuard.tsx

import React from 'react';
import { DonationForm } from '../components/donations/DonationForm';
import { RoleGuard } from '../components/auth/RoleGuard';

export const BatchRecordDonations: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm batchMode={true} />
        </div>
      </div>
    </RoleGuard>
  );
};

export default BatchRecordDonations;