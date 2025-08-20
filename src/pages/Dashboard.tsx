import { useAuth } from '../hooks/useUnifiedAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  MemberDashboard,
  PastorDashboard,
  AdminDashboard,
} from '../components/dashboard';
import { AlertCircle, Shield } from 'lucide-react';

export default function Dashboard() {
  const { member, user, loading } = useAuth();

  console.log('Dashboard: Rendering with state:', {
    loading,
    user: user ? user.uid : 'null',
    member: member
      ? `${member.firstName} ${member.lastName} (${member.role})`
      : 'null',
  });

  if (loading) {
    console.log('Dashboard: Showing loading spinner');
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !member) {
    console.log('Dashboard: No user or member, showing access required');
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            Access Required
          </h2>
          <p className="text-gray-600 mt-2">
            Please ensure you are properly authenticated and have member access.
          </p>
        </div>
      </div>
    );
  }

  const userRole = member.role;
  console.log('Dashboard: User role determined:', userRole);

  // Role-based dashboard rendering
  switch (userRole) {
    case 'admin':
      console.log('Dashboard: Rendering AdminDashboard');
      return <AdminDashboard member={member} />;
    case 'pastor':
      console.log('Dashboard: Rendering PastorDashboard');
      return <PastorDashboard member={member} />;
    case 'member':
      console.log('Dashboard: Rendering MemberDashboard');
      return <MemberDashboard member={member} />;
    default:
      console.log('Dashboard: No valid role, showing role assignment required');
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">
              Role Assignment Required
            </h2>
            <p className="text-gray-600 mt-2">
              Your account needs a role assignment. Please contact your church
              administrator.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Current role: {userRole || 'None assigned'}
            </div>
          </div>
        </div>
      );
  }
}
