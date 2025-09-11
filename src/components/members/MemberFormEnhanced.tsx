// src/components/members/MemberFormEnhanced.tsx
// Enhanced member registration form with multi-section layout and comprehensive data collection
// Integrates all member form sections for complete profile creation and editing workflow
// RELEVANT FILES: src/hooks/useMemberForm.tsx, src/components/members/form/BasicInfoSection.tsx, src/components/members/form/ContactInfoSection.tsx, src/pages/Members.tsx

import React from 'react';
import { useMemberForm } from '../../hooks/useMemberForm';
import { BasicInfoSection } from './form/BasicInfoSection';
import { ContactInfoSection } from './form/ContactInfoSection';
import { AddressesSection } from './form/AddressesSection';
import { AdministrativeSection } from './form/AdministrativeSection';

export const MemberFormEnhanced: React.FC = () => {
  const {
    loading,
    isEditMode,
    expandedSections,
    watchedPhones,
    form,
    emailFieldArray,
    phoneFieldArray,
    addressFieldArray,
    toggleSection,
    onSubmit,
    handleCancel,
  } = useMemberForm();

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Member' : 'Add New Member'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information Section */}
          <BasicInfoSection
            form={form}
            isExpanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
            errors={errors}
          />

          {/* Contact Information Section */}
          <ContactInfoSection
            form={form}
            emailFieldArray={emailFieldArray}
            phoneFieldArray={phoneFieldArray}
            watchedPhones={watchedPhones}
            isExpanded={expandedSections.contact}
            onToggle={() => toggleSection('contact')}
            errors={errors}
          />

          {/* Addresses Section */}
          <AddressesSection
            form={form}
            addressFieldArray={addressFieldArray}
            isExpanded={expandedSections.addresses}
            onToggle={() => toggleSection('addresses')}
            errors={errors}
          />

          {/* Administrative Section */}
          <AdministrativeSection
            form={form}
            isExpanded={expandedSections.administrative}
            onToggle={() => toggleSection('administrative')}
            errors={errors}
          />

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                  ? 'Update Member'
                  : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberFormEnhanced;