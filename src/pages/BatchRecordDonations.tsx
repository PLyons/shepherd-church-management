// src/pages/BatchRecordDonations.tsx
// Batch donation recording page for admin users
// Uses DonationForm in batch mode; router also enforces admin RoleGuard
// RELEVANT FILES: src/components/donations/DonationForm.tsx, src/pages/RecordDonation.tsx, src/router/index.tsx

import React from 'react';
import { DonationForm } from '../components/donations/DonationForm';
import { RoleGuard } from '../components/auth/RoleGuard';

export const BatchRecordDonations: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm batchMode={true} />
        </div>
      </div>
    </RoleGuard>
  );
};

export default BatchRecordDonations;
