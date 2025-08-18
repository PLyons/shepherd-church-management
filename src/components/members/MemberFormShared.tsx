import React, { useState, useEffect } from 'react';
import { Member, Household } from '../../types';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { X, User, Save } from 'lucide-react';
import { membersService } from '../../services/firebase';
import { HouseholdSelector } from '../common/HouseholdSelector';
import { PhoneInput } from '../forms/PhoneInput';
import { EmailInput } from '../forms/EmailInput';
import { BirthdateInput } from '../forms/BirthdateInput';
import {
  initializeMemberFormData,
  prepareMemberDataForSave,
  isValidEmail,
} from '../../utils/member-form-utils';

export interface MemberFormSharedProps {
  // Display mode
  mode: 'modal' | 'inline';
  
  // Operation type
  operation: 'create' | 'update';
  
  // Member data (for updates)
  member?: Member | null;
  
  // Event handlers
  onClose?: () => void;
  onSubmit: (member: Member) => void;
  onCancel?: () => void;
  
  // Feature flags
  showHouseholdSelector?: boolean;
  showRoleSelector?: boolean;
  // showDeleteButton?: boolean; // TODO: Implement delete functionality
  
  // UI customization
  title?: string;
  className?: string;
}

export function MemberFormShared({
  mode = 'modal',
  operation,
  member,
  onClose,
  onSubmit,
  onCancel,
  showHouseholdSelector = true,
  showRoleSelector = true,
  // showDeleteButton = false, // TODO: Implement delete functionality
  title,
  className = '',
}: MemberFormSharedProps) {
  const { member: currentMember } = useAuth();
  const [loading, setLoading] = useState(false);
  const [, setSelectedHousehold] = useState<Household | null>(null);
  const [formData, setFormData] = useState(() => initializeMemberFormData(member));

  // Re-initialize form data when member prop changes
  useEffect(() => {
    setFormData(initializeMemberFormData(member));
  }, [member]);

  const handlePhoneChange = (phone: string) => {
    setFormData({ ...formData, phone });
  };

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
  };

  const handleBirthdateChange = (birthdate: string) => {
    setFormData({ ...formData, birthdate });
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate email if provided
    if (formData.email && !isValidEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const memberData = prepareMemberDataForSave(formData);
      let savedMember: Member;

      if (operation === 'update' && member) {
        // Update existing member
        savedMember = await membersService.update(member.id, memberData);
      } else {
        // Create new member
        savedMember = await membersService.create(memberData);
      }

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

  const handleCancel = () => {
    if (member) {
      // Reset form data for updates
      setFormData(initializeMemberFormData(member));
    }
    onCancel?.();
  };

  const canEditRole =
    currentMember?.role === 'admin' || currentMember?.role === 'pastor';

  const displayTitle = title || (operation === 'create' ? 'Add New Member' : 'Edit Member');

  // Modal wrapper
  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              {displayTitle}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
          <div className="p-6">
            <MemberFormFields
              formData={formData}
              setFormData={setFormData}
              handlePhoneChange={handlePhoneChange}
              handleEmailChange={handleEmailChange}
              handleBirthdateChange={handleBirthdateChange}
              handleHouseholdSelect={handleHouseholdSelect}
              handleHouseholdCreate={handleHouseholdCreate}
              showHouseholdSelector={showHouseholdSelector}
              showRoleSelector={showRoleSelector && canEditRole}
              canEditRole={canEditRole}
            />
            <div className="flex justify-end gap-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Saving...' : operation === 'create' ? 'Add Member' : 'Update Member'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline form
  return (
    <div className={className}>
      <form onSubmit={handleSubmit}>
        <MemberFormFields
          formData={formData}
          setFormData={setFormData}
          handlePhoneChange={handlePhoneChange}
          handleEmailChange={handleEmailChange}
          handleBirthdateChange={handleBirthdateChange}
          handleHouseholdSelect={handleHouseholdSelect}
          handleHouseholdCreate={handleHouseholdCreate}
          showHouseholdSelector={showHouseholdSelector}
          showRoleSelector={showRoleSelector && canEditRole}
          canEditRole={canEditRole}
        />
      </form>
    </div>
  );
}

// Extracted form fields component for reuse
interface MemberFormFieldsProps {
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  handlePhoneChange: (phone: string) => void;
  handleEmailChange: (email: string) => void;
  handleBirthdateChange: (birthdate: string) => void;
  handleHouseholdSelect: (householdId: string, household: Household) => void;
  handleHouseholdCreate: (familyName: string) => Promise<void>;
  showHouseholdSelector: boolean;
  showRoleSelector: boolean;
  canEditRole: boolean;
}

function MemberFormFields({
  formData,
  setFormData,
  handlePhoneChange,
  handleEmailChange,
  handleBirthdateChange,
  handleHouseholdSelect,
  handleHouseholdCreate,
  showHouseholdSelector,
  showRoleSelector,
  canEditRole,
}: MemberFormFieldsProps) {
  return (
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
          Email
        </label>
        <EmailInput
          value={formData.email}
          onChange={handleEmailChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <PhoneInput
          value={formData.phone}
          onChange={handlePhoneChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Birthdate
        </label>
        <BirthdateInput
          value={formData.birthdate}
          onChange={handleBirthdateChange}
        />
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

      {showHouseholdSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Family
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
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.memberStatus}
          onChange={(e) =>
            setFormData({
              ...formData,
              memberStatus: e.target.value as 'active' | 'inactive' | 'visitor',
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="visitor">Visitor</option>
        </select>
      </div>

      {showRoleSelector && canEditRole && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
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
  );
}