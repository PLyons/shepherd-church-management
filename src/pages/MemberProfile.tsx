import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Member, MemberEvent } from '../types';
import { useAuth } from '../hooks/useUnifiedAuth';
import { membersService } from '../services/firebase';
import { formatPhoneForDisplay } from '../utils/member-form-utils';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit,
  ArrowLeft,
  Clock,
  Trash2,
  MapPin,
  Heart,
} from 'lucide-react';

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { member: currentMember } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [memberEvents, setMemberEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMemberData();
    }
  }, [id]);

  const fetchMemberData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Get member data
      const memberData = await membersService.getById(id);
      if (!memberData) {
        throw new Error('Member not found');
      }

      // For simplified CRUD, just use member data without household complexity
      setMember(memberData);
      setMemberEvents([]); // TODO: Implement member events in Firebase
    } catch (error) {
      console.error('Error fetching member data:', error);
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const canEdit =
    currentMember?.role === 'admin' ||
    currentMember?.role === 'pastor' ||
    currentMember?.id === id;

  const canDelete =
    currentMember?.role === 'admin' || currentMember?.role === 'pastor';

  const handleEdit = () => {
    navigate(`/members/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id || !member) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await membersService.delete(id);
      navigate('/members');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete member');
    }
  };

  // Helper function to get primary email from arrays or fallback to deprecated field
  const getPrimaryEmail = (member: Member) => {
    if (member.emails && member.emails.length > 0) {
      const primary = member.emails.find(e => e.primary);
      return primary?.address || member.emails[0].address;
    }
    return member.email || 'Not provided';
  };

  // Helper function to get primary phone from arrays or fallback to deprecated field
  const getPrimaryPhone = (member: Member) => {
    let phoneNumber = '';
    if (member.phones && member.phones.length > 0) {
      const primary = member.phones.find(p => p.primary);
      phoneNumber = primary?.number || member.phones[0].number;
    } else {
      phoneNumber = member.phone || '';
    }
    return phoneNumber ? formatPhoneForDisplay(phoneNumber) : 'Not provided';
  };

  // Helper function to get primary address from arrays
  const getPrimaryAddress = (member: Member) => {
    if (member.addresses && member.addresses.length > 0) {
      const primary = member.addresses.find(a => a.primary);
      const addr = primary || member.addresses[0];
      const parts = [
        addr.addressLine1,
        addr.addressLine2,
        [addr.city, addr.state].filter(Boolean).join(', '),
        addr.postalCode,
        addr.country
      ].filter(Boolean);
      return parts.join(' ');
    }
    return null;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Member not found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          The member you're looking for doesn't exist or you don't have
          permission to view it.
        </p>
        <Link
          to="/members"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/members"
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {member.firstName} {member.lastName}
          </h1>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
            {canDelete && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{member.firstName}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{member.lastName}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {getPrimaryEmail(member)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {getPrimaryPhone(member)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birthdate
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {(member.birthDate || member.birthdate)
                        ? formatDate(member.birthDate || member.birthdate)
                        : 'Not provided'}
                    </span>
                  </div>
                </div>

                {member.anniversaryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Anniversary Date
                    </label>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formatDate(member.anniversaryDate)}
                      </span>
                    </div>
                  </div>
                )}

                {getPrimaryAddress(member) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {getPrimaryAddress(member)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <span className="text-gray-900">
                    {member.gender || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

          {memberEvents.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Life Events
              </h2>
              <div className="space-y-3">
                {memberEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {event.event_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(event.event_date)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Member Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.memberStatus || 'active')}`}
                >
                  {member.memberStatus}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role || 'member')}`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {member.joinedAt
                      ? formatDate(member.joinedAt)
                      : 'Not available'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Household functionality temporarily removed for simplified CRUD */}
        </div>
      </div>
    </div>
  );
}
