// src/constants/membershipTypes.ts
// Church membership type definitions with visual styling for member categorization and display
// This file exists to standardize membership types across the application with consistent UI representation
// RELEVANT FILES: src/types/index.ts, src/components/members/MemberFormEnhanced.tsx, src/components/members/MemberCard.tsx, src/pages/Members.tsx

export interface MembershipType {
  value: string;
  label: string;
  description: string;
  icon: string;
  color: {
    bg: string;
    text: string;
    border: string;
  };
  permissions: {
    canChangeTo: string[]; // roles that can set this status
    canChangeFrom: string[]; // roles that can change from this status
  };
}

export const MEMBERSHIP_TYPES: Record<string, MembershipType> = {
  active: {
    value: 'active',
    label: 'Active Member',
    description: 'Full church member in good standing',
    icon: '👤',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
    },
    permissions: {
      canChangeTo: ['admin', 'pastor'],
      canChangeFrom: ['admin', 'pastor'],
    },
  },
  regular_attender: {
    value: 'regular_attender',
    label: 'Regular Attender',
    description: 'Attends regularly but not yet a member',
    icon: '🔄',
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    permissions: {
      canChangeTo: ['admin', 'pastor'],
      canChangeFrom: ['admin', 'pastor'],
    },
  },
  visitor: {
    value: 'visitor',
    label: 'Visitor',
    description: 'First time or occasional visitor',
    icon: '👋',
    color: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
    },
    permissions: {
      canChangeTo: ['admin', 'pastor'],
      canChangeFrom: ['admin', 'pastor'],
    },
  },
  participant: {
    value: 'participant',
    label: 'Participant',
    description: 'Participates in activities but not regular attender',
    icon: '🎯',
    color: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
    },
    permissions: {
      canChangeTo: ['admin', 'pastor'],
      canChangeFrom: ['admin', 'pastor'],
    },
  },
  inactive: {
    value: 'inactive',
    label: 'Inactive',
    description: 'No longer actively participating',
    icon: '⏸️',
    color: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
    },
    permissions: {
      canChangeTo: ['admin', 'pastor'],
      canChangeFrom: ['admin', 'pastor'],
    },
  },
  not_set: {
    value: 'not_set',
    label: 'Not Set',
    description: 'Membership status not yet determined',
    icon: '❓',
    color: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-100',
    },
    permissions: {
      canChangeTo: ['admin', 'pastor'],
      canChangeFrom: ['admin', 'pastor'],
    },
  },
};

export const getAvailableStatusOptions = (
  currentRole: string,
  currentStatus: string
) => {
  return Object.values(MEMBERSHIP_TYPES).filter(
    (type) =>
      type.permissions.canChangeTo.includes(currentRole) &&
      type.value !== currentStatus
  );
};
