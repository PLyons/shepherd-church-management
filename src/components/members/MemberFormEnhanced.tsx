import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import { firebaseService } from '../../services/firebase';
import { MemberFormData, Member } from '../../types';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { STATES_AND_TERRITORIES } from '../../constants/states';

interface CollapsibleSections {
  basic: boolean;
  contact: boolean;
  addresses: boolean;
  administrative: boolean;
}

export const MemberFormEnhanced: React.FC = () => {
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
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
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
  const {
    fields: emailFields,
    append: appendEmail,
    remove: removeEmail,
  } = useFieldArray({
    control,
    name: 'emails',
  });

  const {
    fields: phoneFields,
    append: appendPhone,
    remove: removePhone,
  } = useFieldArray({
    control,
    name: 'phones',
  });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control,
    name: 'addresses',
  });

  // Watch for conditional rendering
  const watchedPhones = watch('phones');

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
        reset({
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
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('basic')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            >
              <h3 className="text-lg font-medium text-gray-900">
                Basic Information
              </h3>
              {expandedSections.basic ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.basic && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prefix
                    </label>
                    <input
                      type="text"
                      {...register('prefix')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mr., Mrs., Dr."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register('firstName', {
                        required: 'First name is required',
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      {...register('middleName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suffix
                    </label>
                    <input
                      type="text"
                      {...register('suffix')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Jr., Sr., III"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register('lastName', {
                        required: 'Last name is required',
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      {...register('birthDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anniversary Date
                    </label>
                    <input
                      type="date"
                      {...register('anniversaryDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marital Status
                    </label>
                    <select
                      {...register('maritalStatus')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="widowed">Widowed</option>
                      <option value="divorced">Divorced</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('contact')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            >
              <h3 className="text-lg font-medium text-gray-900">
                Contact Information
              </h3>
              {expandedSections.contact ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.contact && (
              <div className="p-4 space-y-6">
                {/* Email Addresses */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Addresses
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        appendEmail({
                          type: 'home',
                          address: '',
                          primary: false,
                        })
                      }
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Email
                    </button>
                  </div>

                  {emailFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <select
                        {...register(`emails.${index}.type` as const)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>

                      <input
                        type="email"
                        {...register(`emails.${index}.address` as const, {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register(`emails.${index}.primary` as const)}
                          className="mr-1"
                        />
                        <span className="text-xs text-gray-500">Primary</span>
                      </label>

                      {emailFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmail(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Phone Numbers */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Numbers
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        appendPhone({
                          type: 'mobile',
                          number: '',
                          primary: false,
                          smsOptIn: false,
                        })
                      }
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Phone
                    </button>
                  </div>

                  {phoneFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="space-y-2 mb-4 p-3 border border-gray-200 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <select
                          {...register(`phones.${index}.type` as const)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="mobile">Mobile</option>
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>

                        <input
                          type="tel"
                          {...register(`phones.${index}.number` as const)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(555) 123-4567"
                        />

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register(`phones.${index}.primary` as const)}
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-500">Primary</span>
                        </label>

                        {phoneFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* SMS Opt-in for mobile phones */}
                      {watchedPhones &&
                        watchedPhones[index]?.type === 'mobile' && (
                          <label className="flex items-center text-sm text-gray-600">
                            <input
                              type="checkbox"
                              {...register(`phones.${index}.smsOptIn` as const)}
                              className="mr-2"
                            />
                            Allow SMS messages to this number
                          </label>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Addresses Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('addresses')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            >
              <h3 className="text-lg font-medium text-gray-900">Addresses</h3>
              {expandedSections.addresses ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.addresses && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Physical Addresses
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      appendAddress({
                        type: 'home',
                        addressLine1: '',
                        addressLine2: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        country: 'United States',
                        primary: false,
                      })
                    }
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Address
                  </button>
                </div>

                {addressFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 mb-4 p-4 border border-gray-200 rounded-md"
                  >
                    <div className="flex items-center justify-between">
                      <select
                        {...register(`addresses.${index}.type` as const)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>

                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register(`addresses.${index}.primary` as const)}
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-500">Primary</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeAddress(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        {...register(
                          `addresses.${index}.addressLine1` as const
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Street Address"
                      />

                      <input
                        type="text"
                        {...register(
                          `addresses.${index}.addressLine2` as const
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Apt, Suite, etc. (optional)"
                      />

                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          {...register(`addresses.${index}.city` as const)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="City"
                        />

                        <select
                          {...register(`addresses.${index}.state` as const)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select State...</option>
                          {STATES_AND_TERRITORIES.map((state) => (
                            <option key={state.code} value={state.code}>
                              {state.name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          {...register(
                            `addresses.${index}.postalCode` as const
                          )}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ZIP Code"
                        />
                      </div>

                      <input
                        type="text"
                        {...register(`addresses.${index}.country` as const)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                ))}

                {addressFields.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No addresses added. Click "Add Address" to get started.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Administrative Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('administrative')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
            >
              <h3 className="text-lg font-medium text-gray-900">
                Administrative
              </h3>
              {expandedSections.administrative ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.administrative && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Status *
                    </label>
                    <select
                      {...register('memberStatus', {
                        required: 'Member status is required',
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {errors.memberStatus && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.memberStatus.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      {...register('role', { required: 'Role is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="pastor">Pastor</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.role.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/members')}
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
