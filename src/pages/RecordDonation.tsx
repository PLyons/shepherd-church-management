// src/pages/RecordDonation.tsx
// Single donation recording page for admin/pastor users
// Wrapper around DonationForm component with proper access control
// RELEVANT FILES: src/components/donations/DonationForm.tsx, src/components/auth/RoleGuard.tsx, src/pages/EditDonation.tsx

import React from 'react';
import { DonationForm } from '../components/donations/DonationForm';
import { RoleGuard } from '../components/auth/RoleGuard';

export const RecordDonation: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm />
        </div>
      </div>
    </RoleGuard>
  );
};

export default RecordDonation;