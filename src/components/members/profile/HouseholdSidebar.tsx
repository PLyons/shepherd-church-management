import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Settings, AlertCircle } from 'lucide-react';
import { householdsService } from '../../../services/firebase/households.service';
import { useAuth } from '../../../hooks/useUnifiedAuth';
import { Household } from '../../../types/firestore';
import GivingSummary from '../../donations/GivingSummary';

interface HouseholdSidebarProps {
  memberId: string;
  currentHouseholdId?: string;
  className?: string;
}

interface HouseholdMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship?: string;
  isPrimaryContact?: boolean;
  memberStatus: string;
  role: string;
}

// Avatar component for displaying member initials
function Avatar({
  firstName,
  lastName,
  size = 'md',
  className = '',
}: {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const initials =
    `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl',
  };

  return (
    <div
      className={`
      ${sizeClasses[size]} 
      bg-blue-100 text-blue-800 rounded-full 
      flex items-center justify-center font-medium
      ${className}
    `}
    >
      {initials}
    </div>
  );
}

// Household header component
function HouseholdHeader({
  household,
  canManage,
}: {
  household: Household;
  canManage: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">
          {household?.familyName || 'Household'}
        </h3>
      </div>
      {canManage && (
        <button
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          title="Manage household"
        >
          <Settings className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Individual member card component
function HouseholdMemberCard({
  member,
  isCurrentMember,
}: {
  member: HouseholdMember;
  isCurrentMember: boolean;
}) {
  if (isCurrentMember) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border transition-colors border-blue-200 bg-blue-50">
        <Avatar
          firstName={member.firstName}
          lastName={member.lastName}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </p>
            {member.isPrimaryContact && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Primary
              </span>
            )}
          </div>

          {member.relationship && (
            <p className="text-xs text-gray-500 capitalize">
              {member.relationship}
            </p>
          )}
        </div>

        <div className="text-blue-600">
          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/members/${member.id}/overview`}
      className="flex items-center gap-4 p-4 rounded-lg border transition-colors border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
    >
      <Avatar
        firstName={member.firstName}
        lastName={member.lastName}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-base font-medium text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </p>
            {member.isPrimaryContact && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                Primary
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            {member.relationship && (
              <span className="capitalize">{member.relationship}</span>
            )}
            <span className="capitalize">{member.memberStatus}</span>
            {member.role !== 'member' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                {member.role}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Member list component
function HouseholdMemberList({
  members,
  currentMemberId,
}: {
  members: HouseholdMember[];
  currentMemberId: string;
}) {
  return (
    <div className="space-y-4">
      {members.map((member) => (
        <HouseholdMemberCard
          key={member.id}
          member={member}
          isCurrentMember={member.id === currentMemberId}
        />
      ))}

      {/* Household statistics */}
      {members.length > 1 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Household Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Members:</span>
              <span className="ml-2 font-medium">{members.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Active:</span>
              <span className="ml-2 font-medium">
                {members.filter((m) => m.memberStatus === 'active').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading state component
function HouseholdLoadingState() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error state component
function HouseholdErrorState({ error }: { error: string }) {
  return (
    <div className="bg-white rounded-lg border border-red-200 p-6">
      <div className="text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <h3 className="text-sm font-medium text-gray-900">
          Error Loading Household
        </h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    </div>
  );
}

// No household state component
function NoHouseholdState({ canManage }: { canManage: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center">
        <Users className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Household</h3>
        <p className="mt-1 text-sm text-gray-500">
          This member is not part of a household.
        </p>
        {canManage && (
          <button className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors">
            <Plus className="h-4 w-4 mr-1" />
            Add to Household
          </button>
        )}
      </div>
    </div>
  );
}

// Household actions component
function HouseholdActions() {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="space-y-2">
        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Plus className="inline h-4 w-4 mr-2" />
          Add Member
        </button>
        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Settings className="inline h-4 w-4 mr-2" />
          Manage Household
        </button>
      </div>
    </div>
  );
}

// Custom hook for household data
function useHouseholdData(householdId?: string) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) {
      setLoading(false);
      return;
    }

    const fetchHouseholdData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [householdData, householdMembers] = await Promise.all([
          householdsService.getById(householdId),
          householdsService.getMembers(householdId),
        ]);

        setHousehold(householdData);

        // Convert Member objects to HouseholdMember format
        const formattedMembers: HouseholdMember[] = householdMembers.map(
          (member) => ({
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            relationship: 'member', // TODO: Add relationship field to Member type
            isPrimaryContact: member.isPrimaryContact,
            memberStatus: member.memberStatus || 'active',
            role: member.role || 'member',
          })
        );

        setMembers(formattedMembers);
      } catch (err) {
        console.error('Error fetching household data:', err);
        setError('Failed to load household information');
      } finally {
        setLoading(false);
      }
    };

    fetchHouseholdData();
  }, [householdId]);

  return { household, members, loading, error };
}

// Main HouseholdSidebar component
const HouseholdSidebar = memo(
  ({ memberId, currentHouseholdId, className = '' }: HouseholdSidebarProps) => {
    const { member: currentUser } = useAuth();
    const { household, members, loading, error } =
      useHouseholdData(currentHouseholdId);

    const canManageHousehold =
      currentUser?.role === 'admin' || currentUser?.role === 'pastor';

    if (!currentHouseholdId) {
      return <NoHouseholdState canManage={canManageHousehold} />;
    }

    if (loading) {
      return <HouseholdLoadingState />;
    }

    if (error) {
      return <HouseholdErrorState error={error} />;
    }

    if (!household) {
      return <HouseholdErrorState error="Household not found" />;
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Household Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <HouseholdHeader
            household={household}
            canManage={canManageHousehold}
          />
          <div className="mt-6">
            <HouseholdMemberList members={members} currentMemberId={memberId} />
          </div>
          {canManageHousehold && <HouseholdActions />}
        </div>

        {/* Giving Summary */}
        <GivingSummary memberId={memberId} />
      </div>
    );
  }
);

HouseholdSidebar.displayName = 'HouseholdSidebar';

export default HouseholdSidebar;
