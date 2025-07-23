import React, { useState, useEffect, useRef } from 'react';
import { Member, Household } from '../../types';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { X, User, Save } from 'lucide-react';
import { membersService } from '../../services/firebase';
import { HouseholdSelector } from '../common/HouseholdSelector';

// Phone number formatting utilities
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');

  // Apply formatting based on length
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

const cleanPhoneNumber = (value: string): string => {
  // Remove all formatting and return just digits
  return value.replace(/\D/g, '');
};

const normalizePhoneForStorage = (value: string): string => {
  const cleaned = cleanPhoneNumber(value);
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned; // Return as-is if not 10 digits
};

interface MemberFormProps {
  onClose: () => void;
  onSubmit: (member: Member) => void;
  member?: Member | null;
}

export function MemberForm({ onClose, onSubmit, member }: MemberFormProps) {
  const { member: currentMember } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(
    null
  );

  // Refs for birthday date inputs
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // State for individual birthday components
  const [birthdayComponents, setBirthdayComponents] = useState({
    month: '',
    day: '',
    year: '',
  });

  const [formData, setFormData] = useState({
    householdId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '' as 'Male' | 'Female' | '',
    role: 'member' as 'admin' | 'pastor' | 'member',
    memberStatus: 'active' as 'active' | 'inactive' | 'visitor',
  });

  useEffect(() => {
    if (member) {
      // Parse birthdate into components if it exists
      let month = '',
        day = '',
        year = '';
      if (member.birthdate) {
        const parts = member.birthdate.split('-');
        if (parts.length === 3) {
          year = parts[0];
          month = parts[1];
          day = parts[2];
        }
      }

      setFormData({
        householdId: member.householdId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone ? formatPhoneNumber(member.phone) : '',
        birthdate: member.birthdate || '',
        gender: member.gender || '',
        role: member.role,
        memberStatus: member.memberStatus,
      });

      setBirthdayComponents({ month, day, year });
    }
  }, [member]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleBirthdayChange = (
    component: 'month' | 'day' | 'year',
    value: string
  ) => {
    const newComponents = { ...birthdayComponents, [component]: value };
    setBirthdayComponents(newComponents);

    // Update the birthdate in formData
    if (newComponents.month && newComponents.day && newComponents.year) {
      const birthdate = `${newComponents.year}-${newComponents.month.padStart(2, '0')}-${newComponents.day.padStart(2, '0')}`;
      setFormData({ ...formData, birthdate });
    } else {
      setFormData({ ...formData, birthdate: '' });
    }

    // Auto-advance focus
    if (component === 'month' && value.length === 2 && dayRef.current) {
      dayRef.current.focus();
    } else if (component === 'day' && value.length === 2 && yearRef.current) {
      yearRef.current.focus();
    }
  };

  const handleHouseholdSelect = (householdId: string, household: Household) => {
    setSelectedHousehold(household);
    setFormData({ ...formData, householdId });
  };

  const handleHouseholdCreate = async (familyName: string) => {
    if (!currentMember) return;

    try {
      const { householdsService } = await import('../../services/firebase');

      // Create household with validation
      const newHousehold = await householdsService.createWithValidation(
        { familyName: familyName.trim() },
        currentMember.id,
        true // require approval
      );

      // Update form data with the new household
      setSelectedHousehold(newHousehold);
      setFormData({ ...formData, householdId: newHousehold.id });

      // Show appropriate message based on status
      if (newHousehold.status === 'pending') {
        alert(
          'Your family name has been submitted for approval. You can continue adding the member, and both will be reviewed together.'
        );
      } else {
        alert('Family created successfully!');
      }
    } catch (error) {
      console.error('Error creating household:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create family. Please try again.'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.householdId) {
      alert('Please select or create a family before adding a member.');
      return;
    }

    setLoading(true);

    try {
      const memberData = {
        householdId: formData.householdId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
          ? normalizePhoneForStorage(formData.phone)
          : undefined,
        birthdate: formData.birthdate || undefined,
        gender: formData.gender || undefined,
        role: formData.role,
        memberStatus: formData.memberStatus,
      };

      let savedMember: Member;

      if (member) {
        // Update existing member
        savedMember = await membersService.update(member.id, memberData);
      } else {
        // Create new member
        console.log('Creating member with data:', memberData);
        savedMember = await membersService.create(memberData);
        console.log('Member created successfully:', savedMember);
      }

      console.log('Calling onSubmit with member:', savedMember);
      onSubmit(savedMember);
    } catch (error) {
      console.error('Error saving member:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Error saving member. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const canEditRole =
    currentMember?.role === 'admin' || currentMember?.role === 'pastor';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            {member ? 'Edit Member' : 'Add New Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birthdate
              </label>
              <div className="flex gap-2">
                <input
                  ref={monthRef}
                  type="text"
                  value={birthdayComponents.month}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 2 && parseInt(value) <= 12) {
                      handleBirthdayChange('month', value);
                    }
                  }}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  placeholder="MM"
                  maxLength={2}
                />
                <span className="flex items-center text-gray-400">/</span>
                <input
                  ref={dayRef}
                  type="text"
                  value={birthdayComponents.day}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 2 && parseInt(value) <= 31) {
                      handleBirthdayChange('day', value);
                    }
                  }}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  placeholder="DD"
                  maxLength={2}
                />
                <span className="flex items-center text-gray-400">/</span>
                <input
                  ref={yearRef}
                  type="text"
                  value={birthdayComponents.year}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) {
                      handleBirthdayChange('year', value);
                    }
                  }}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  placeholder="YYYY"
                  maxLength={4}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as 'Male' | 'Female' | '',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Family *
              </label>
              <HouseholdSelector
                value={formData.householdId}
                onSelect={handleHouseholdSelect}
                onCreateNew={handleHouseholdCreate}
                placeholder="Search for a family or create new..."
                allowCreateNew={true}
                requireApproval={true}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                value={formData.memberStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    memberStatus: e.target.value as
                      | 'active'
                      | 'inactive'
                      | 'visitor',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>

            {canEditRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'pastor' | 'member',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="pastor">Pastor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
