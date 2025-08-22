import { useState, useEffect, createContext, Suspense } from 'react';
import { useParams, Link, useNavigate, Outlet } from 'react-router-dom';
import { Member } from '../types';
import { useAuth } from '../hooks/useUnifiedAuth';
import { membersService } from '../services/firebase';
import MemberProfileHeader from '../components/members/profile/MemberProfileHeader';
import MemberProfileTabs from '../components/members/profile/MemberProfileTabs';
import HouseholdSidebar from '../components/members/profile/HouseholdSidebar';
import {
  User,
  Users,
} from 'lucide-react';

// Create context to pass member data to tabs
export const MemberContext = createContext<{ member: Member | null }>({ member: null });

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { member: currentMember } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHouseholdDrawer, setShowHouseholdDrawer] = useState(false);

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
          Back to Members
        </Link>
      </div>
    );
  }

  const TabLoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <MemberContext.Provider value={{ member }}>
      <div className="space-y-6">
        <MemberProfileHeader
          member={member}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <MemberProfileTabs memberId={id!} />
        
        {/* Responsive layout container with horizontal scroll support */}
        <div className="w-full overflow-x-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 min-w-full xl:min-w-0">
            {/* Main content */}
            <div className="xl:col-span-3 min-w-0">
              <Suspense fallback={<TabLoadingSpinner />}>
                <Outlet />
              </Suspense>
            </div>
            
            {/* Household sidebar - visible on xl screens (1280px+) */}
            <div className="hidden xl:block xl:col-span-1 min-w-0">
              <HouseholdSidebar 
                memberId={id!}
                currentHouseholdId={member?.householdId}
                className="sticky top-6"
              />
            </div>
          </div>
        </div>

        {/* Intermediate screen size household access (lg to xl) */}
        <div className="hidden lg:block xl:hidden mt-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {member?.householdId ? 'Household Information' : 'No Household'}
                </span>
              </div>
              {member?.householdId ? (
                <button 
                  onClick={() => setShowHouseholdDrawer(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Users className="h-4 w-4 mr-1" />
                  View Household
                </button>
              ) : (
                <span className="text-sm text-gray-500">
                  This member is not part of a household
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile household button */}
        {member?.householdId && (
          <div className="block lg:hidden">
            <button 
              onClick={() => setShowHouseholdDrawer(true)}
              className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Users className="h-4 w-4" />
              View Household
            </button>
          </div>
        )}

        {/* Mobile and tablet drawer */}
        {showHouseholdDrawer && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-25" 
              onClick={() => setShowHouseholdDrawer(false)} 
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg p-6 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Household</h3>
                <button
                  onClick={() => setShowHouseholdDrawer(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  ✕
                </button>
              </div>
              <HouseholdSidebar 
                memberId={id!}
                currentHouseholdId={member?.householdId}
              />
            </div>
          </div>
        )}
      </div>
    </MemberContext.Provider>
  );
}
