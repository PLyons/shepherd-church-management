// src/components/members/profile/MemberProfileHeader.tsx
// Member profile header component displaying key information with edit and action controls
// Provides quick access to member details, membership type editing, and profile management actions
// RELEVANT FILES: src/pages/MemberProfile.tsx, src/components/members/profile/MembershipTypeSelector.tsx, src/types/index.ts, src/components/common/Dropdown.tsx

import { useState } from 'react';
import {
  Edit,
  MoreVertical,
  Trash2,
  ArrowLeft,
  User,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Member } from '../../../types';
import { useAuth } from '../../../hooks/useUnifiedAuth';
import Tooltip from '../../common/Tooltip';
import { EnhancedDropdown, DropdownItem } from '../../common/Dropdown';
import { MembershipTypeSelector } from './MembershipTypeSelector';

interface MemberProfileHeaderProps {
  member: Member;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRecordDonation?: () => void;
}

export default function MemberProfileHeader({
  member,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onRecordDonation,
}: MemberProfileHeaderProps) {
  const [currentMember, setCurrentMember] = useState(member);
  const { member: currentUser } = useAuth();

  const handleStatusChange = (newStatus: string) => {
    // Optimistic update for immediate UI feedback
    setCurrentMember((prev) => ({
      ...prev,
      memberStatus: newStatus as typeof prev.memberStatus,
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'pastor':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Avatar component for member
  const Avatar = ({
    firstName,
    lastName,
    size = 'lg',
  }: {
    firstName: string;
    lastName: string;
    size?: 'md' | 'lg';
  }) => {
    const initials =
      `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    const sizeClasses = {
      md: 'h-12 w-12 text-base',
      lg: 'h-20 w-20 text-2xl',
    };

    return (
      <div
        className={`
        ${sizeClasses[size]} 
        bg-blue-100 text-blue-800 rounded-full 
        flex items-center justify-center font-semibold border-4 border-white shadow-lg
      `}
      >
        {initials || <User className="h-8 w-8" />}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Back button positioned absolutely */}
      <div className="mb-4">
        <Tooltip content="Back to Members">
          <Link
            to="/members"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Members
          </Link>
        </Tooltip>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Large Avatar */}
          <Avatar
            firstName={currentMember.firstName}
            lastName={currentMember.lastName}
            size="lg"
          />

          {/* Member info and prominent badges */}
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {currentMember.firstName} {currentMember.lastName}
              </h1>
              {/* Prominent badges positioned directly under name */}
              <div className="flex items-center gap-3">
                {/* Interactive Membership Status Selector */}
                <MembershipTypeSelector
                  member={currentMember}
                  onStatusChange={handleStatusChange}
                />
                {/* Enhanced Role badge */}
                <span
                  className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${getRoleColor(currentMember.role || 'member')}`}
                >
                  {currentMember.role || 'member'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Record Donation button for admin/pastor */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'pastor') &&
            onRecordDonation && (
              <Tooltip content="Record Donation">
                <button
                  onClick={onRecordDonation}
                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Record Donation
                </button>
              </Tooltip>
            )}

          {/* Edit button */}
          {canEdit && (
            <Tooltip content="Edit Profile">
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            </Tooltip>
          )}

          {/* Actions dropdown */}
          <EnhancedDropdown
            trigger={
              <Tooltip content="More Actions">
                <div className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer">
                  <MoreVertical className="h-5 w-5" />
                </div>
              </Tooltip>
            }
          >
            {canDelete && (
              <DropdownItem
                onClick={onDelete}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Member
              </DropdownItem>
            )}

            {/* Future actions - disabled for now */}
            <DropdownItem disabled>Merge Profiles</DropdownItem>
            <DropdownItem disabled>Export Data</DropdownItem>
            <DropdownItem disabled>View History</DropdownItem>
          </EnhancedDropdown>
        </div>
      </div>
    </div>
  );
}
