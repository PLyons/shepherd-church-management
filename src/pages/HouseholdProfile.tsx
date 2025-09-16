import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Crown,
} from 'lucide-react';
import { Household, Member } from '../types/firestore';
import { householdsService } from '../services/firebase/households.service';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function HouseholdProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { member: currentUser } = useAuth();
  const { showToast } = useToast();

  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadHousehold();
    }
  }, [id]);

  const loadHousehold = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [householdData, membersData] = await Promise.all([
        householdsService.getById(id),
        householdsService.getMembers(id),
      ]);

      if (!householdData) {
        showToast('Household not found', 'error');
        navigate('/households');
        return;
      }

      setHousehold(householdData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading household:', error);
      showToast('Failed to load household', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHousehold = async () => {
    if (!household) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the ${household.familyName} household? This will remove all members from the household and cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await householdsService.delete(household.id);
      showToast('Household deleted successfully', 'success');
      navigate('/households');
    } catch (error) {
      console.error('Error deleting household:', error);
      showToast('Failed to delete household', 'error');
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!household) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.firstName} ${member.lastName} from this household?`
    );

    if (!confirmed) return;

    try {
      await householdsService.removeMember(household.id, member.id);
      showToast('Member removed from household', 'success');
      loadHousehold(); // Reload to get updated data
    } catch (error) {
      console.error('Error removing member:', error);
      showToast('Failed to remove member from household', 'error');
    }
  };

  const handleSetPrimaryContact = async (member: Member) => {
    if (!household) return;

    try {
      await householdsService.setPrimaryContact(household.id, member.id);
      showToast(
        `${member.firstName} ${member.lastName} set as primary contact`,
        'success'
      );
      loadHousehold(); // Reload to get updated data
    } catch (error) {
      console.error('Error setting primary contact:', error);
      showToast('Failed to set primary contact', 'error');
    }
  };

  const formatAddress = (household: Household) => {
    if (!household.address) return null;

    const { addressLine1, addressLine2, city, state, postalCode, country } =
      household.address;
    const addressParts = [
      addressLine1,
      addressLine2,
      [city, state].filter(Boolean).join(', '),
      postalCode,
      country,
    ].filter(Boolean);

    return addressParts.length > 0 ? addressParts : null;
  };

  const getPrimaryContact = () => {
    return members.find((member) => member.isPrimaryContact);
  };

  const getContactInfo = (member: Member) => {
    const primaryEmail =
      member.emails?.find((email) => email.type === 'home')?.address ||
      member.emails?.[0]?.address;
    const primaryPhone =
      member.phones?.find((phone) => phone.type === 'home')?.number ||
      member.phones?.[0]?.number;

    return { email: primaryEmail, phone: primaryPhone };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!household) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Household not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The household you're looking for doesn't exist.
          </p>
          <div className="mt-6">
            <Link
              to="/households"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Households
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canManage =
    currentUser?.role === 'admin' || currentUser?.role === 'pastor';
  const addressParts = formatAddress(household);
  const primaryContact = getPrimaryContact();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/households"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Households
            </Link>
          </div>
          {canManage && (
            <div className="flex items-center space-x-3">
              <Link
                to={`/households/${household.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={handleDeleteHousehold}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Home className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {household.familyName} Family
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-gray-600">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                Created {new Date(household.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Household Information */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Household Information
              </h2>
            </div>
            <div className="px-6 py-6">
              {/* Address */}
              {addressParts && (
                <div className="flex items-start space-x-3 mb-6">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Address
                    </h3>
                    <div className="mt-1 text-sm text-gray-600">
                      {addressParts.map((part, index) => (
                        <div key={index}>{part}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Contact */}
              {primaryContact && (
                <div className="flex items-start space-x-3">
                  <Crown className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Primary Contact
                    </h3>
                    <div className="mt-1">
                      <Link
                        to={`/members/${primaryContact.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {primaryContact.firstName} {primaryContact.lastName}
                      </Link>
                      <div className="mt-1 space-y-1">
                        {(() => {
                          const contactInfo = getContactInfo(primaryContact);
                          return (
                            <>
                              {contactInfo.email && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4" />
                                  <span>{contactInfo.email}</span>
                                </div>
                              )}
                              {contactInfo.phone && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  <span>{contactInfo.phone}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">
                    Family Members ({members.length})
                  </h2>
                </div>
                {canManage && (
                  <Link
                    to={`/households/${household.id}/members`}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Manage Members
                  </Link>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {members.map((member) => {
                const contactInfo = getContactInfo(member);
                return (
                  <div key={member.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/members/${member.id}`}
                              className="text-lg font-medium text-blue-600 hover:text-blue-800"
                            >
                              {member.firstName} {member.lastName}
                            </Link>
                            {member.isPrimaryContact && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Primary Contact
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-1">
                            {contactInfo.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="h-3 w-3" />
                                <span>{contactInfo.email}</span>
                              </div>
                            )}
                            {contactInfo.phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-3 w-3" />
                                <span>{contactInfo.phone}</span>
                              </div>
                            )}
                            {member.birthDate && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Born{' '}
                                  {new Date(
                                    member.birthDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex items-center space-x-2">
                          {!member.isPrimaryContact && (
                            <button
                              onClick={() => handleSetPrimaryContact(member)}
                              className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-md hover:bg-yellow-200"
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Set as Primary
                            </button>
                          )}
                          {members.length > 1 && (
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="inline-flex items-center px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Members</span>
                <span className="text-sm font-medium text-gray-900">
                  {members.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Adults</span>
                <span className="text-sm font-medium text-gray-900">
                  {
                    members.filter((m) => {
                      if (!m.birthDate) return true; // Assume adult if no birth date
                      const age =
                        new Date().getFullYear() -
                        new Date(m.birthDate).getFullYear();
                      return age >= 18;
                    }).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Children</span>
                <span className="text-sm font-medium text-gray-900">
                  {
                    members.filter((m) => {
                      if (!m.birthDate) return false;
                      const age =
                        new Date().getFullYear() -
                        new Date(m.birthDate).getFullYear();
                      return age < 18;
                    }).length
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {canManage && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  to={`/households/${household.id}/edit`}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <Edit className="h-4 w-4 inline mr-2" />
                  Edit Household
                </Link>
                <Link
                  to={`/households/${household.id}/members`}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <UserPlus className="h-4 w-4 inline mr-2" />
                  Manage Members
                </Link>
                <button
                  onClick={handleDeleteHousehold}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="h-4 w-4 inline mr-2" />
                  Delete Household
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
