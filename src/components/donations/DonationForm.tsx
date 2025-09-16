// src/components/donations/DonationForm.tsx
// Comprehensive donation recording form with React Hook Form validation and member lookup integration
// Supports single and batch donation entry with Form 990 compliance and role-based access control
// RELEVANT FILES: src/types/donations.ts, src/services/firebase/donations.service.ts, src/components/common/MemberLookup.tsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  donationsService,
  donationCategoriesService,
} from '../../services/firebase';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  DonationFormData,
  DonationCategory,
  DonationMethod,
  Form990LineItem,
} from '../../types/donations';
import { Member } from '../../types';
import { DonorInfoSection } from './sections/DonorInfoSection';
import { DonationDetailsSection } from './sections/DonationDetailsSection';
import { TaxReceiptSection } from './sections/TaxReceiptSection';
import { BatchModeSection } from './sections/BatchModeSection';

interface DonationFormProps {
  donationId?: string;
  onSubmit?: (donationData: DonationFormData) => void;
  onCancel?: () => void;
  enableBatchMode?: boolean;
}

export const DonationForm: React.FC<DonationFormProps> = ({
  donationId,
  onSubmit,
  onCancel,
  enableBatchMode = false,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDonation, setIsLoadingDonation] = useState(!!donationId);
  const [categories, setCategories] = useState<DonationCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchEntries, setBatchEntries] = useState<DonationFormData[]>([]);

  const isEditMode = !!donationId;
  const isMemberUser = (user as any)?.role === 'member';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<DonationFormData>({
    defaultValues: {
      amount: 0,
      donationDate: '',
      method: 'cash' as DonationMethod,
      categoryId: '',
      form990LineItem: '1a_cash_contributions' as Form990LineItem,
      isQuidProQuo: false,
      sendReceipt: true,
      isTaxDeductible: true,
    },
  });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load existing donation for editing
  useEffect(() => {
    if (donationId) {
      loadDonation();
    }
  }, [donationId]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const activeCategories =
        await donationCategoriesService.getActiveCategories();
      setCategories(activeCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      showToast('Error loading donation categories', 'error');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadDonation = async () => {
    if (!donationId) return;

    try {
      setIsLoadingDonation(true);
      const donation = await donationsService.getById(donationId);

      if (donation) {
        reset({
          amount: donation.amount,
          donationDate: donation.donationDate,
          method: donation.method,
          categoryId: donation.categoryId,
          note: donation.note,
          form990LineItem: donation.form990Fields.lineItem,
          isQuidProQuo: donation.form990Fields.isQuidProQuo,
          quidProQuoValue: donation.form990Fields.quidProQuoValue,
          sendReceipt: !donation.isReceiptSent,
          isTaxDeductible: donation.isTaxDeductible,
        });

        if (donation.memberId && donation.memberName) {
          setSelectedMember({
            id: donation.memberId,
            firstName: donation.memberName.split(' ')[0],
            lastName: donation.memberName.split(' ').slice(1).join(' '),
            fullName: donation.memberName,
            email: '',
            role: 'member',
            memberStatus: 'active',
            phone: '',
          });
        } else {
          setIsAnonymous(true);
        }
      }
    } catch (error) {
      console.error('Error loading donation:', error);
      showToast('Error loading donation details', 'error');
    } finally {
      setIsLoadingDonation(false);
    }
  };

  const handleAnonymousToggle = (checked: boolean) => {
    setIsAnonymous(checked);
  };

  const handleMemberSelect = (member: Member | null) => {
    setSelectedMember(member);
  };

  const handleBatchModeToggle = (checked: boolean) => {
    setBatchMode(checked);
    if (!checked) {
      setBatchEntries([]);
    }
  };

  const addBatchEntry = () => {
    const currentFormData = watch();
    setBatchEntries((prev) => [...prev, { ...currentFormData }]);
    reset(); // Clear form for next entry
    setSelectedMember(null);
    setIsAnonymous(false);
  };

  const onFormSubmit = async (data: DonationFormData) => {
    if (!user) return;

    // Client-side validation for member selection
    if (!isAnonymous && !isMemberUser && !selectedMember) {
      setError('memberId', { type: 'required', message: 'Member is required' });
      return;
    }

    try {
      setIsLoading(true);

      // Find category name for the current donation
      const selectedCategory = categories.find(
        (cat) => cat.id === data.categoryId
      );

      const donationData = {
        ...data,
        memberId: isAnonymous ? undefined : selectedMember?.id,
        memberName: isAnonymous
          ? undefined
          : selectedMember?.fullName ||
            `${selectedMember?.firstName} ${selectedMember?.lastName}`,
        categoryName: selectedCategory?.name || 'Unknown Category',
        form990Fields: {
          lineItem: data.form990LineItem,
          isQuidProQuo: data.isQuidProQuo,
          quidProQuoValue: data.quidProQuoValue,
          isAnonymous: isAnonymous,
        },
        taxYear: new Date(data.donationDate).getFullYear(),
        status: 'verified' as const,
        createdBy: user.uid,
        isReceiptSent: false,
      };

      if (batchMode) {
        // Transform all batch entries to proper donation format
        const transformedBatchEntries = await Promise.all(
          batchEntries.map(async (entry) => {
            // Find category name for entry
            const category = categories.find(
              (cat) => cat.id === entry.categoryId
            );
            return {
              ...entry,
              memberId: entry.memberId || undefined,
              memberName: entry.memberName || undefined,
              categoryName: category?.name || 'Unknown Category',
              form990Fields: {
                lineItem: entry.form990LineItem,
                isQuidProQuo: entry.isQuidProQuo,
                quidProQuoValue: entry.quidProQuoValue,
                isAnonymous: !entry.memberId,
              },
              taxYear: new Date(entry.donationDate).getFullYear(),
              status: 'verified' as const,
              createdBy: user.uid,
              isReceiptSent: false,
            };
          })
        );

        const allEntries = [...transformedBatchEntries, donationData];
        await donationsService.createMultipleDonations(allEntries);
        showToast(
          `${allEntries.length} donations recorded successfully!`,
          'success'
        );
        setBatchEntries([]);
        setBatchMode(false);
      } else if (isEditMode) {
        await donationsService.update(donationId!, donationData);
        showToast('Donation updated successfully!', 'success');
      } else {
        await donationsService.create(donationData);
        showToast('Donation recorded successfully!', 'success');
      }

      if (onSubmit) {
        onSubmit(data);
      } else {
        reset();
        setSelectedMember(null);
        setIsAnonymous(false);
      }
    } catch (error) {
      console.error('Error submitting donation:', error);
      const errorMessage = isEditMode
        ? 'Error updating donation. Please try again.'
        : 'Error recording donation. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  if (isLoadingDonation) {
    return (
      <div className="flex items-center justify-center p-8">
        <div
          data-testid="loading-spinner"
          role="status"
          className="text-gray-500"
        >
          Loading donation details...
        </div>
      </div>
    );
  }

  if (isLoadingCategories) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode
          ? 'Edit Donation'
          : isMemberUser
            ? 'Record Your Donation'
            : 'Record Donation'}
      </h1>

      <BatchModeSection
        enableBatchMode={enableBatchMode}
        batchMode={batchMode}
        batchEntries={batchEntries}
        onBatchModeToggle={handleBatchModeToggle}
        onAddBatchEntry={addBatchEntry}
      />

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Hidden fields for member data */}
        <input
          type="hidden"
          {...register('memberId', {
            validate: () => {
              if (!isAnonymous && !isMemberUser && !selectedMember) {
                return 'Member is required';
              }
              return true;
            },
          })}
        />
        <input type="hidden" {...register('memberName')} />

        <DonorInfoSection
          register={register}
          errors={errors}
          setValue={setValue}
          clearErrors={clearErrors}
          isAnonymous={isAnonymous}
          onAnonymousToggle={handleAnonymousToggle}
          selectedMember={selectedMember}
          onMemberSelect={handleMemberSelect}
          isMemberUser={isMemberUser}
        />

        <DonationDetailsSection
          register={register}
          errors={errors}
          watch={watch}
          categories={categories}
        />

        <TaxReceiptSection register={register} />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            data-testid="submit-button"
          >
            {isLoading
              ? batchMode
                ? 'Saving...'
                : isEditMode
                  ? 'Updating...'
                  : 'Recording...'
              : batchMode
                ? 'Save All Donations'
                : isEditMode
                  ? 'Update Donation'
                  : 'Record Donation'}
          </button>
        </div>
      </form>
    </div>
  );
};
