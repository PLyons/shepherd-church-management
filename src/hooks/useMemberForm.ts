// src/hooks/useMemberForm.ts
// Custom hook for member form state management with React Hook Form integration and validation
// Handles form initialization, data loading, submission, and section collapsibility for member creation/editing
// RELEVANT FILES: src/components/members/MemberFormEnhanced.tsx, src/types/index.ts, src/services/firebase/members.service.ts, src/utils/member-form-utils.ts

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';
import { firebaseService } from '../services/firebase';
import { MemberFormData, Member } from '../types';

interface CollapsibleSections {
  basic: boolean;
  contact: boolean;
  addresses: boolean;
  administrative: boolean;
}

export function useMemberForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<CollapsibleSections>(
    {
      basic: true,
      contact: true,
      addresses: false,
      administrative: false,
    }
  );

  // Form setup with react-hook-form
  const form = useForm<MemberFormData>({
    defaultValues: {
      prefix: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      emails: [{ type: 'home', address: '', primary: true }],
      phones: [{ type: 'mobile', number: '', primary: true, smsOptIn: false }],
      addresses: [],
      birthDate: undefined,
      anniversaryDate: undefined,
      maritalStatus: undefined,
      memberStatus: 'active',
      role: 'member',
      gender: undefined,
    },
  });

  // Field arrays for dynamic fields
  const emailFieldArray = useFieldArray({
    control: form.control,
    name: 'emails',
  });

  const phoneFieldArray = useFieldArray({
    control: form.control,
    name: 'phones',
  });

  const addressFieldArray = useFieldArray({
    control: form.control,
    name: 'addresses',
  });

  // Watch for conditional rendering
  const watchedPhones = form.watch('phones');

  // Load existing member data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadMemberData(id);
    }
  }, [isEditMode, id]);

  const loadMemberData = async (memberId: string) => {
    try {
      setLoading(true);
      const member = await firebaseService.members.getById(memberId);

      if (member) {
        // Migrate old data format if needed
        const migratedMember = migrateLegacyData(member);

        // Reset form with loaded data
        form.reset({
          prefix: migratedMember.prefix || '',
          firstName: migratedMember.firstName || '',
          middleName: migratedMember.middleName || '',
          lastName: migratedMember.lastName || '',
          suffix: migratedMember.suffix || '',
          emails:
            migratedMember.emails && migratedMember.emails.length > 0
              ? migratedMember.emails
              : [{ type: 'home', address: '', primary: true }],
          phones:
            migratedMember.phones && migratedMember.phones.length > 0
              ? migratedMember.phones
              : [
                  {
                    type: 'mobile',
                    number: '',
                    primary: true,
                    smsOptIn: false,
                  },
                ],
          addresses: migratedMember.addresses || [],
          birthDate: migratedMember.birthDate,
          anniversaryDate: migratedMember.anniversaryDate,
          maritalStatus: migratedMember.maritalStatus,
          memberStatus: migratedMember.memberStatus || 'active',
          role: migratedMember.role || 'member',
          gender: migratedMember.gender,
        });
      }
    } catch (error) {
      console.error('Failed to load member:', error);
      showToast('Failed to load member data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Migrate legacy email/phone data to arrays
  const migrateLegacyData = (member: Member): Member => {
    const migrated = { ...member };

    // Migrate old email to emails array if no emails exist
    if (!migrated.emails || migrated.emails.length === 0) {
      if (migrated.email) {
        migrated.emails = [
          { type: 'home', address: migrated.email, primary: true },
        ];
      }
    }

    // Migrate old phone to phones array if no phones exist
    if (!migrated.phones || migrated.phones.length === 0) {
      if (migrated.phone) {
        migrated.phones = [
          {
            type: 'mobile',
            number: migrated.phone,
            primary: true,
            smsOptIn: false,
          },
        ];
      }
    }

    return migrated;
  };

  // Toggle collapsible sections
  const toggleSection = (section: keyof CollapsibleSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Form submission
  const onSubmit = async (data: MemberFormData) => {
    try {
      // Prepare data for Firestore
      const preparedData = prepareDataForFirestore(data);

      if (isEditMode && id) {
        await firebaseService.members.update(id, preparedData);
        showToast('Member updated successfully', 'success');
      } else {
        await firebaseService.members.create(preparedData);
        showToast('Member created successfully', 'success');
      }

      navigate('/members');
    } catch (error) {
      console.error('Failed to save member:', error);
      showToast('Failed to save member', 'error');
    }
  };

  // Prepare data for Firestore submission
  const prepareDataForFirestore = (
    data: MemberFormData
  ): Omit<Member, 'id' | 'fullName'> => {
    // Filter out empty entries first
    const filteredEmails =
      data.emails?.filter((email) => email.address.trim() !== '') || [];
    const filteredPhones =
      data.phones?.filter((phone) => phone.number.trim() !== '') || [];
    const filteredAddresses =
      data.addresses?.filter(
        (addr) => addr.addressLine1?.trim() !== '' && addr.city?.trim() !== ''
      ) || [];

    const prepared: Omit<Member, 'id' | 'fullName'> = {
      // Required fields
      firstName: data.firstName,
      lastName: data.lastName,
      memberStatus: data.memberStatus,
      role: data.role,

      // Optional basic fields
      prefix: data.prefix,
      middleName: data.middleName,
      suffix: data.suffix,
      gender: data.gender,
      maritalStatus: data.maritalStatus,
      joinedAt: data.joinedAt,

      // Contact arrays (only include if not empty)
      ...(filteredEmails.length > 0 && { emails: filteredEmails }),
      ...(filteredPhones.length > 0 && { phones: filteredPhones }),
      ...(filteredAddresses.length > 0 && { addresses: filteredAddresses }),

      // Dates converted to Firestore Timestamps
      ...(data.birthDate && {
        birthDate: Timestamp.fromDate(new Date(data.birthDate)),
      }),
      ...(data.anniversaryDate && {
        anniversaryDate: Timestamp.fromDate(new Date(data.anniversaryDate)),
      }),

      // Timestamps
      updatedAt: Timestamp.now(),
      ...(isEditMode ? {} : { createdAt: Timestamp.now() }),

      // DEPRECATED fields for compatibility (optional)
      email: data.email,
      phone: data.phone,
      birthdate: data.birthdate,
    };

    return prepared;
  };

  const handleCancel = () => {
    navigate('/members');
  };

  return {
    // State
    loading,
    isEditMode,
    expandedSections,
    watchedPhones,

    // Form
    form,
    emailFieldArray,
    phoneFieldArray,
    addressFieldArray,

    // Actions
    toggleSection,
    onSubmit,
    handleCancel,
  };
}
