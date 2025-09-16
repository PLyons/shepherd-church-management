// src/pages/DonationDetail.tsx
// GREEN PHASE: Minimal implementation for PRP-2C-010 Navigation Integration
// Admin-only donation detail page placeholder

import React from 'react';
import { useParams } from 'react-router-dom';

export default function DonationDetail() {
  const { id } = useParams();

  return (
    <div data-testid="donation-detail-page" className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Donation Detail</h1>
      <p className="text-gray-600">Donation Details</p>
    </div>
  );
}
