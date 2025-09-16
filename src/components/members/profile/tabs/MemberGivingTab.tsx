// src/components/members/profile/tabs/MemberGivingTab.tsx
// Member giving history tab component for member profile integration
// Displays donation history using existing MemberDonationHistory component
// RELEVANT FILES: src/components/donations/MemberDonationHistory.tsx, src/pages/MemberProfile.tsx

import React, { useContext } from 'react';
import { MemberContext } from '../../../../pages/MemberProfile';
import { useAuth } from '../../../../hooks/useUnifiedAuth';
import { MemberDonationHistory } from '../../../donations/MemberDonationHistory';

export default function MemberGivingTab() {
  const { member } = useContext(MemberContext);
  const { member: currentMember } = useAuth();

  if (!member) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Security check: ensure proper access control
  const isAdminOrPastor =
    currentMember?.role === 'admin' || currentMember?.role === 'pastor';
  const isOwnProfile = currentMember?.id === member.id;

  if (!isAdminOrPastor && !isOwnProfile) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Access Restricted
        </h3>
        <p className="text-gray-500">
          You don't have permission to view this member's giving history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="giving-history-tab">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Giving History for {member.firstName} {member.lastName}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Complete donation history and tax statements
        </p>
      </div>

      {/* Use existing MemberDonationHistory component */}
      <MemberDonationHistory
        memberId={member.id}
        memberName={`${member.firstName} ${member.lastName}`}
      />
    </div>
  );
}
