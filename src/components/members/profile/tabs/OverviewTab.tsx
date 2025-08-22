import { useContext, useMemo } from 'react';
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

export default function OverviewTab() {
  const { member } = useContext(MemberContext);

  if (!member) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Helper function to format addresses
  const formatAddress = (address: any) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      [address.city, address.state].filter(Boolean).join(', '),
      address.postalCode,
      address.country
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < anniversaryDate.getDate())) {
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'pastor':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Process contact data with memoization for performance
  const processedContacts = useMemo(() => {
    const emailContacts = member.emails?.map(email => ({
      type: email.type,
      value: email.address,
      primary: email.primary,
      label: `${email.type} Email`
    })) || (member.email ? [{
      type: 'email',
      value: member.email,
      primary: true,
      label: 'Email'
    }] : []);

    const phoneContacts = member.phones?.map(phone => ({
      type: phone.type,
      value: formatPhoneForDisplay(phone.number),
      primary: phone.primary,
      label: `${phone.type} Phone${phone.smsOptIn ? ' (SMS)' : ''}`
    })) || (member.phone ? [{
      type: 'phone',
      value: formatPhoneForDisplay(member.phone),
      primary: true,
      label: 'Phone'
    }] : []);

    const addressContacts = member.addresses?.map(address => ({
      type: address.type,
      value: formatAddress(address),
      primary: address.primary,
      label: `${address.type} Address`
    })) || [];

    return { emailContacts, phoneContacts, addressContacts };
  }, [member.emails, member.email, member.phones, member.phone, member.addresses]);

  return (
    <div className="grid grid-cols-3 gap-6">
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
        <InfoField 
          label="Full Name"
          value={`${member.firstName} ${member.lastName}`}
          icon={User}
        />
        
        {member.gender && (
          <InfoField 
            label="Gender"
            value={member.gender}
            icon={User}
          />
        )}

        {(member.birthDate || member.birthdate) && (
          <InfoField 
            label="Birth Date"
            value={formatDateWithAge(member.birthDate || member.birthdate)}
            icon={Calendar}
          />
        )}

        {member.anniversaryDate && (
          <InfoField 
            label="Anniversary"
            value={formatDateWithYears(member.anniversaryDate)}
            icon={Heart}
          />
        )}

        {member.maritalStatus && (
          <InfoField 
            label="Marital Status"
            value={member.maritalStatus}
            icon={Users}
          />
        )}
      </InfoCard>

      {/* Church Information */}
      <InfoCard title="Church Information" icon={Badge}>
        <InfoField 
          label="Member Status"
          value={
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus || 'active')}`}>
              {member.memberStatus || 'active'}
            </span>
          }
          icon={Badge}
        />

        <InfoField 
          label="Role"
          value={
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role || 'member')}`}>
              {member.role || 'member'}
            </span>
          }
          icon={Shield}
        />

        {member.joinedAt && (
          <InfoField 
            label="Joined"
            value={formatDate(member.joinedAt)}
            icon={Clock}
          />
        )}
      </InfoCard>
    </div>
  );
}