// src/pages/RecordDonation.tsx
// Single donation recording page for admin users
// Wrapper around DonationForm; router also enforces admin RoleGuard
// RELEVANT FILES: src/components/donations/DonationForm.tsx, src/components/auth/RoleGuard.tsx, src/router/index.tsx

import React from 'react';
import { DonationForm } from '../components/donations/DonationForm';
import { RoleGuard } from '../components/auth/RoleGuard';

export const RecordDonation: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm />
        </div>
      </div>
    </RoleGuard>
  );
};

export default RecordDonation;
