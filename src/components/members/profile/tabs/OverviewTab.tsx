import { useContext, useMemo, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  MapPin,
  Heart,
  Badge,
  Users,
} from 'lucide-react';
import { formatPhoneForDisplay } from '../../../../utils/member-form-utils';
import { MemberContext } from '../../../../pages/MemberProfile';
import InfoCard from '../common/InfoCard';
import InfoField from '../common/InfoField';
import ContactList from '../common/ContactList';
import {
  InlineEditText,
  InlineEditSelect,
  InlineEditDate,
} from '../../../common/inline-edit';
import { useEditPermissions } from '../../../../hooks/useEditPermissions';
import { useToast } from '../../../../contexts/ToastContext';
import { membersService } from '../../../../services/firebase/members.service';
import { validateName } from '../../../../utils/validation';

export default function OverviewTab() {
  const { member } = useContext(MemberContext);
  const { showToast } = useToast();
  const permissions = useEditPermissions(member?.id || '');

  // Helper function to format addresses
  const formatAddress = (address: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.postalCode,
      address.country,
    ].filter(Boolean);
    return parts.join(' ');
  };

  const formatDate = (dateString: string) => {
    // Parse date in local timezone to avoid off-by-one errors
    // Split the ISO date string and create date in local timezone
    const [year, month, day] = dateString
      .split('-')
      .map((num) => parseInt(num, 10));
    const date = new Date(year, month - 1, day); // month is 0-based in Date constructor

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateWithAge = (dateString: string) => {
    const formattedDate = formatDate(dateString);
    const [year, month, day] = dateString
      .split('-')
      .map((num) => parseInt(num, 10));
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return `${formattedDate} (${age} years old)`;
  };

  const formatDateWithYears = (dateString: string) => {
    const formattedDate = formatDate(dateString);
    const [year, month, day] = dateString
      .split('-')
      .map((num) => parseInt(num, 10));
    const anniversaryDate = new Date(year, month - 1, day);
    const today = new Date();

    let years = today.getFullYear() - anniversaryDate.getFullYear();
    const monthDiff = today.getMonth() - anniversaryDate.getMonth();

    // Adjust years if anniversary hasn't occurred this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < anniversaryDate.getDate())
    ) {
      years--;
    }

    return `${formattedDate} (${years} years)`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'visitor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Process contact data with memoization for performance
  const processedContacts = useMemo(() => {
    if (!member)
      return { emailContacts: [], phoneContacts: [], addressContacts: [] };

    const emailContacts =
      member.emails?.map((email) => ({
        type: email.type,
        value: email.address,
        primary: email.primary,
        label: `${email.type} Email`,
      })) ||
      (member.email
        ? [
            {
              type: 'email',
              value: member.email,
              primary: true,
              label: 'Email',
            },
          ]
        : []);

    const phoneContacts =
      member.phones?.map((phone) => ({
        type: phone.type,
        value: formatPhoneForDisplay(phone.number),
        primary: phone.primary,
        label: `${phone.type} Phone${phone.smsOptIn ? ' (SMS)' : ''}`,
      })) ||
      (member.phone
        ? [
            {
              type: 'phone',
              value: formatPhoneForDisplay(member.phone),
              primary: true,
              label: 'Phone',
            },
          ]
        : []);

    const addressContacts =
      member.addresses?.map((address) => ({
        type: address.type,
        value: formatAddress(address),
        primary: address.primary,
        label: `${address.type} Address`,
      })) || [];

    return { emailContacts, phoneContacts, addressContacts };
  }, [
    member?.emails,
    member?.email,
    member?.phones,
    member?.phone,
    member?.addresses,
  ]);

  const handleFieldSave = useCallback(
    async (field: string, value: string) => {
      if (!member?.id) return;

      try {
        await membersService.update(member.id, { [field]: value });
        showToast('Field updated successfully', 'success');
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
        showToast('Failed to update field', 'error');
        throw error;
      }
    },
    [member?.id, showToast]
  );

  if (!member) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contact Information */}
      <InfoCard title="Contact Information" icon={Mail}>
        <ContactList
          contacts={processedContacts.emailContacts}
          icon={Mail}
          emptyText="Email"
        />
        <ContactList
          contacts={processedContacts.phoneContacts}
          icon={Phone}
          emptyText="Phone"
        />
        <ContactList
          contacts={processedContacts.addressContacts}
          icon={MapPin}
          emptyText="Address"
        />
      </InfoCard>

      {/* Personal Information */}
      <InfoCard title="Personal Information" icon={User}>
        <div className="grid grid-cols-2 gap-4">
          <InlineEditText
            value={member.firstName || ''}
            onSave={(value) => handleFieldSave('firstName', value)}
            label="First Name"
            icon={User}
            canEdit={permissions.canEditPersonalInfo}
            validation={validateName}
            placeholder="Enter first name"
          />

          <InlineEditText
            value={member.lastName || ''}
            onSave={(value) => handleFieldSave('lastName', value)}
            label="Last Name"
            icon={User}
            canEdit={permissions.canEditPersonalInfo}
            validation={validateName}
            placeholder="Enter last name"
          />

          <InlineEditSelect
            value={member.gender || ''}
            onSave={(value) => handleFieldSave('gender', value)}
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
            ]}
            label="Gender"
            icon={User}
            canEdit={permissions.canEditPersonalInfo}
          />

          <InlineEditSelect
            value={member.maritalStatus || ''}
            onSave={(value) => handleFieldSave('maritalStatus', value)}
            options={[
              { label: 'Single', value: 'Single' },
              { label: 'Married', value: 'Married' },
              { label: 'Divorced', value: 'Divorced' },
              { label: 'Widowed', value: 'Widowed' },
            ]}
            label="Marital Status"
            icon={Users}
            canEdit={permissions.canEditPersonalInfo}
          />

          <InlineEditDate
            value={member.birthDate || member.birthdate || ''}
            onSave={(value) => handleFieldSave('birthDate', value)}
            label="Birth Date"
            icon={Calendar}
            canEdit={permissions.canEditPersonalInfo}
            formatDisplay={(value) => formatDateWithAge(String(value))}
          />

          <InlineEditDate
            value={member.anniversaryDate || ''}
            onSave={(value) => handleFieldSave('anniversaryDate', value)}
            label="Anniversary"
            icon={Heart}
            canEdit={permissions.canEditPersonalInfo}
            formatDisplay={(value) => formatDateWithYears(String(value))}
          />
        </div>
      </InfoCard>

      {/* Church Information */}
      <InfoCard title="Church Information" icon={Badge}>
        <div className="grid grid-cols-2 gap-4">
          {/* Member Status - will be replaced with dropdown selector in PRP-006 */}
          <InfoField
            label="Member Status"
            value={
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus || 'active')}`}
              >
                {member.memberStatus || 'active'}
              </span>
            }
            icon={Badge}
          />

          <InlineEditSelect
            value={member.role || 'member'}
            onSave={(value) => handleFieldSave('role', value)}
            options={[
              { label: 'Member', value: 'member' },
              { label: 'Pastor', value: 'pastor' },
              { label: 'Admin', value: 'admin' },
            ]}
            label="Role"
            icon={Shield}
            canEdit={permissions.canEditRole}
          />

          <InlineEditDate
            value={member.joinedAt || ''}
            onSave={(value) => handleFieldSave('joinedAt', value)}
            label="Joined Date"
            icon={Clock}
            canEdit={permissions.canEditChurchInfo}
            formatDisplay={(value) => formatDate(String(value))}
          />
        </div>
      </InfoCard>
    </div>
  );
}
