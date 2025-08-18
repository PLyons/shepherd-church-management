import React from 'react';
import { Member } from '../../types';
import { MemberFormShared } from './MemberFormShared';

interface MemberFormProps {
  onClose: () => void;
  onSubmit: (member: Member) => void;
  member?: Member | null;
}

export function MemberForm({ onClose, onSubmit, member }: MemberFormProps) {
  return (
    <MemberFormShared
      mode="modal"
      operation={member ? 'update' : 'create'}
      member={member}
      onClose={onClose}
      onSubmit={onSubmit}
      onCancel={onClose}
      showHouseholdSelector={true}
      showRoleSelector={true}
    />
  );
}
