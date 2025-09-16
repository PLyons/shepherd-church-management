import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserMinus, Users, Search } from 'lucide-react';
import { Household, Member } from '../types/firestore';
import { householdsService } from '../services/firebase/households.service';
import { membersService } from '../services/firebase/members.service';
import { useAuth } from '../hooks/useUnifiedAuth';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function HouseholdMembers() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { member: currentUser } = useAuth();
  const { showToast } = useToast();

  const [household, setHousehold] = useState<Household | null>(null);
  const [currentMembers, setCurrentMembers] = useState<Member[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    } else {
      navigate('/households');
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [householdData, householdMembers, allMembers] = await Promise.all([
        householdsService.getById(id),
        householdsService.getMembers(id),
        membersService.getAll(),
      ]);

      if (!householdData) {
        showToast('Household not found', 'error');
        navigate('/households');
        return;
      }

      setHousehold(householdData);
      setCurrentMembers(householdMembers);

      // Filter out members already in this household
      const householdMemberIds = new Set(householdMembers.map((m) => m.id));
      const available = allMembers.filter(
        (member) => !householdMemberIds.has(member.id)
      );
      setAvailableMembers(available);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load household data', 'error');
      navigate('/households');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (member: Member) => {
    if (!household) return;

    try {
      await householdsService.addMember(household.id, member.id);
      showToast(
        `${member.firstName} ${member.lastName} added to household`,
        'success'
      );
      setShowAddMemberModal(false);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error adding member:', error);
      showToast('Failed to add member to household', 'error');
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
      showToast(
        `${member.firstName} ${member.lastName} removed from household`,
        'success'
      );
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error removing member:', error);
      showToast('Failed to remove member from household', 'error');
    }
  };

  const setPrimaryContact = async (member: Member) => {
    if (!household) return;

    try {
      await householdsService.setPrimaryContact(household.id, member.id);
      showToast(
        `${member.firstName} ${member.lastName} set as primary contact`,
        'success'
      );
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error setting primary contact:', error);
      showToast('Failed to set primary contact', 'error');
    }
  };

  const filteredAvailableMembers = availableMembers.filter(
    (member) =>
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.emails?.some((email) =>
        email.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Role-based access control
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'pastor') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to manage household members.
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!household) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Household Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            The household you're trying to manage doesn't exist.
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/households/${household.id}`}
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Household
            </Link>
          </div>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </button>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Manage {household.familyName} Family Members
          </h1>
          <p className="mt-2 text-gray-600">
            Add or remove members from this household
          </p>
        </div>
      </div>

      {/* Current Members */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">
              Current Members ({currentMembers.length})
            </h2>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {currentMembers.map((member) => (
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
                    <div className="text-sm text-gray-600">
                      {member.emails?.[0]?.address}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!member.isPrimaryContact && (
                    <button
                      onClick={() => setPrimaryContact(member)}
                      className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-md hover:bg-yellow-200"
                    >
                      Set as Primary
                    </button>
                  )}
                  {currentMembers.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="inline-flex items-center px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Member to Household
                </h3>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Available Members */}
              <div className="max-h-96 overflow-y-auto">
                {filteredAvailableMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm
                        ? 'No matching members'
                        : 'No available members'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? 'Try adjusting your search terms.'
                        : 'All members are already assigned to households.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {member.firstName[0]}
                              {member.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {member.emails?.[0]?.address}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(member)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
