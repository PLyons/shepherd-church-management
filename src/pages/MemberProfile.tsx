// src/pages/MemberProfile.tsx
// Detailed member profile page with tabbed interface and household information sidebar
// This file exists to provide comprehensive member information display with role-based access and editing capabilities
// RELEVANT FILES: src/components/members/profile/MemberProfileHeader.tsx, src/components/members/profile/MemberProfileTabs.tsx, src/components/members/profile/HouseholdSidebar.tsx, src/pages/Members.tsx

import { useState, useEffect, createContext, Suspense } from 'react';
import { useParams, Link, useNavigate, Outlet } from 'react-router-dom';
import { Member } from '../types';
import { useAuth } from '../hooks/useUnifiedAuth';
import { membersService } from '../services/firebase';
import MemberProfileHeader from '../components/members/profile/MemberProfileHeader';
import MemberProfileTabs from '../components/members/profile/MemberProfileTabs';
import HouseholdSidebar from '../components/members/profile/HouseholdSidebar';
import { User } from 'lucide-react';

// Create context to pass member data to tabs
export const MemberContext = createContext<{ member: Member | null }>({
  member: null,
});

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const { member: currentMember } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
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
      {/* Desktop-first container with minimum width constraint */}
      <div className="min-w-[1200px] space-y-4">
        <MemberProfileHeader
          member={member}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <MemberProfileTabs memberId={id!} />

        {/* Flexbox layout replacing grid for better control */}
        <div className="flex gap-6">
          {/* Main content area - flexible width */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<TabLoadingSpinner />}>
              <Outlet />
            </Suspense>
          </div>

          {/* Fixed household sidebar - 400px width */}
          <div className="w-[400px] flex-shrink-0">
            <HouseholdSidebar
              memberId={id!}
              currentHouseholdId={member?.householdId}
              className="sticky top-6"
            />
          </div>
        </div>
      </div>
    </MemberContext.Provider>
  );
}
