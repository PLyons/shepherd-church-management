import React, { useState, useEffect } from 'react';
import { rolesService, type RoleSummary } from '../../services/firebase/roles.service';
import { useAuth } from '../../hooks/useUnifiedAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  UserCheck,
  Eye,
  Edit3,
  Crown,
  Heart,
  User
} from 'lucide-react';

export function RoleManagement() {
  const { user, member } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roleSummary, setRoleSummary] = useState<RoleSummary | null>(null);
  const [unassignedMembers, setUnassignedMembers] = useState<any[]>([]);
  const [adminMembers, setAdminMembers] = useState<any[]>([]);
  const [pastorMembers, setPastorMembers] = useState<any[]>([]);
  const [regularMembers, setRegularMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'pastor' | 'member'>('member');
  const [reason, setReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Security check - only admins can access this component
  if (!member || member.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only administrators can access role management.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadRoleData();
  }, []);

  const loadRoleData = async () => {
    try {
      setLoading(true);
      const [summary, unassigned, admins, pastors, members] = await Promise.all([
        rolesService.getRoleSummary(),
        rolesService.getUnassignedMembers(),
        rolesService.getMembersByRole('admin'),
        rolesService.getMembersByRole('pastor'),
        rolesService.getMembersByRole('member')
      ]);

      setRoleSummary(summary);
      setUnassignedMembers(unassigned);
      setAdminMembers(admins);
      setPastorMembers(pastors);
      setRegularMembers(members);
    } catch (error) {
      console.error('Error loading role data:', error);
      setNotification({ type: 'error', message: 'Failed to load role data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = (memberToAssign: any) => {
    setSelectedMember(memberToAssign);
    setNewRole(memberToAssign.role || 'member');
    setReason('');
    setShowAssignModal(true);
  };

  const submitRoleAssignment = async () => {
    if (!selectedMember || !user?.id) return;
    
    if (!reason.trim() || reason.trim().length < 10) {
      setNotification({ type: 'error', message: 'Please provide a detailed reason (minimum 10 characters)' });
      return;
    }

    try {
      setAssignmentLoading(true);
      
      await rolesService.assignRole(
        selectedMember.id,
        newRole,
        reason.trim(),
        user.id,
        'admin'
      );

      setNotification({ 
        type: 'success', 
        message: `Successfully assigned ${newRole} role to ${selectedMember.firstName} ${selectedMember.lastName}` 
      });
      
      setShowAssignModal(false);
      await loadRoleData(); // Reload data to reflect changes
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to assign role' 
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-red-600" />;
      case 'pastor': return <Heart className="w-4 h-4 text-purple-600" />;
      case 'member': return <User className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'pastor': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'member': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? 
              <CheckCircle className="w-5 h-5 mr-2" /> : 
              <XCircle className="w-5 h-5 mr-2" />
            }
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-2">Assign and manage user roles and permissions</p>
        </div>
        <div className="flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
          <Shield className="w-4 h-4 mr-1" />
          Admin Only
        </div>
      </div>

      {/* Role Summary */}
      {roleSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Administrators</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{roleSummary.adminCount}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pastors</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{roleSummary.pastorCount}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Members</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{roleSummary.memberCount}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unassigned</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{roleSummary.unassignedCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Warning */}
      {roleSummary && roleSummary.adminCount <= 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <div className="text-sm text-yellow-700">
              <strong>Security Warning:</strong> You are the only administrator. Be careful not to remove your own admin role, 
              as this would lock everyone out of administrative functions.
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Members */}
      {unassignedMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              Members Without Roles ({unassignedMembers.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">These members need role assignments to access the system properly.</p>
          </div>
          <div className="divide-y divide-gray-200">
            {unassignedMembers.map((member) => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAssignRole(member)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Assign Role
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showAssignModal && selectedMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Assign Role to {selectedMember.firstName} {selectedMember.lastName}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Role
                        </label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as any)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="member">Member - Basic access to personal data and public events</option>
                          <option value="pastor">Pastor - Ministry oversight and member care access</option>
                          <option value="admin">Administrator - Full system access and management</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Role Assignment *
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={3}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Explain why this role is being assigned (minimum 10 characters)..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This reason will be logged for audit purposes. {reason.length}/10 minimum
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={submitRoleAssignment}
                  disabled={assignmentLoading || reason.trim().length < 10}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignmentLoading ? 'Assigning...' : 'Assign Role'}
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  disabled={assignmentLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}