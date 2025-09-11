// src/pages/EditDonation.tsx
// Edit existing donation page with URL parameter handling
// Extracts donation ID from URL params and passes to DonationForm
// RELEVANT FILES: src/components/donations/DonationForm.tsx, src/pages/RecordDonation.tsx, src/components/auth/RoleGuard.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import { DonationForm } from '../components/donations/DonationForm';
import { RoleGuard } from '../components/auth/RoleGuard';

export const EditDonation: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <RoleGuard allowedRoles={['admin', 'pastor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <DonationForm donationId={id} />
        </div>
      </div>
    </RoleGuard>
  );
};

export default EditDonation;