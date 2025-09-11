// src/components/donations/sections/DonorInfoSection.tsx
// Donor information section for donation form with member search and anonymous donation support
// Handles member lookup with debounced search and provides clean dropdown selection interface
// RELEVANT FILES: src/components/common/MemberLookup.tsx, src/types/index.ts, src/services/firebase/members.service.ts

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormClearErrors } from 'react-hook-form';
import { Member } from '../../../types';
import { membersService } from '../../../services/firebase';
import { DonationFormData } from '../../../types/donations';

interface DonorInfoSectionProps {
  register: UseFormRegister<DonationFormData>;
  errors: FieldErrors<DonationFormData>;
  setValue: UseFormSetValue<DonationFormData>;
  clearErrors: UseFormClearErrors<DonationFormData>;
  isAnonymous: boolean;
  onAnonymousToggle: (anonymous: boolean) => void;
  selectedMember: Member | null;
  onMemberSelect: (member: Member | null) => void;
  isMemberUser: boolean;
}

export const DonorInfoSection: React.FC<DonorInfoSectionProps> = ({
  errors,
  setValue,
  clearErrors,
  isAnonymous,
  onAnonymousToggle,
  onMemberSelect,
  isMemberUser
}) => {
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchError, setMemberSearchError] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const searchMembers = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setMemberSearchResults([]);
      return;
    }

    try {
      setMemberSearchError(null);
      const results = await membersService.search(searchTerm);
      setMemberSearchResults(results);
    } catch (error) {
      console.error('Error searching members:', error);
      setMemberSearchError('Error searching members');
      setMemberSearchResults([]);
    }
  }, []);

  const handleMemberSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMemberSearchTerm(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchMembers(value);
    }, 300);
  }, [searchMembers]);

  const handleMemberSelect = useCallback((member: Member) => {
    onMemberSelect(member);
    setValue('memberId', member.id);
    setValue('memberName', member.fullName || `${member.firstName} ${member.lastName}`);
    setMemberSearchTerm(member.fullName || `${member.firstName} ${member.lastName}`);
    setShowMemberDropdown(false);
    clearErrors('memberId');
  }, [onMemberSelect, setValue, clearErrors]);

  const handleAnonymousToggle = useCallback((checked: boolean) => {
    onAnonymousToggle(checked);
    if (checked) {
      onMemberSelect(null);
      setValue('memberId', '');
      setValue('memberName', '');
      setMemberSearchTerm('');
      clearErrors('memberId');
    }
  }, [onAnonymousToggle, onMemberSelect, setValue, clearErrors]);

  return (
    <div className="border-b pb-6">
      <h2 className="text-lg font-semibold mb-4">Donor Information</h2>
      
      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => handleAnonymousToggle(e.target.checked)}
            className="mr-2"
          />
          <span>Anonymous Donation</span>
        </label>

        {!isAnonymous && !isMemberUser && (
          <div className="relative">
            <label htmlFor="member-search" className="block text-sm font-medium text-gray-700 mb-1">
              Member Search *
            </label>
            <input
              id="member-search"
              type="text"
              value={memberSearchTerm}
              onChange={handleMemberSearchChange}
              onFocus={() => setShowMemberDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search for member..."
            />
            
            {showMemberDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {memberSearchError ? (
                  <div className="p-3 text-center text-red-600">
                    Error searching members
                  </div>
                ) : memberSearchResults.length === 0 && memberSearchTerm.length >= 2 ? (
                  <div className="p-3 text-center text-gray-500">
                    No members found
                  </div>
                ) : (
                  memberSearchResults.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="font-medium">
                        {member.fullName || `${member.firstName} ${member.lastName}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {member.email}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {errors.memberId && (
              <p className="mt-1 text-sm text-red-600">{errors.memberId.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};