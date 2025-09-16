// src/pages/Members.tsx
// Member directory page displaying a searchable and paginated list of all church members
// This file exists to provide the main member management interface with role-based access controls
// RELEVANT FILES: src/components/members/MemberList.tsx, src/services/firebase/members.service.ts, src/hooks/useUnifiedAuth.ts, src/pages/MemberProfile.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseService } from '../services/firebase';
import { Member } from '../types';
import { useAuth } from '../hooks/useUnifiedAuth';
import { formatPhoneForDisplay } from '../utils/member-form-utils';
import { Search, User, Users, Plus, X } from 'lucide-react';

export default function Members() {
  const { member } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMembers();
  }, [currentPage, activeSearchTerm]);

  const fetchMembers = async () => {
    console.log('Fetching members with pagination:', {
      activeSearchTerm,
      currentPage,
      itemsPerPage,
    });
    setLoading(true);
    try {
      // Use Firebase service to get paginated member directory
      const options = {
        page: currentPage,
        limit: itemsPerPage,
        search: activeSearchTerm || undefined,
        orderBy: 'lastName' as const,
        orderDirection: 'asc' as const,
      };

      const result =
        await firebaseService.members.getMemberDirectoryPaginated(options);
      console.log('Fetched paginated members:', result);

      setMembers(result?.data || []);
      setTotalCount(result?.totalCount || 0);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show pagination if there are multiple pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const showPagination = totalPages > 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm.trim());
    setCurrentPage(1);
    // fetchMembers will be called by useEffect when activeSearchTerm or currentPage changes
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${memberName}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await firebaseService.members.delete(memberId);
      // Refresh the member list
      await fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete member');
    }
  };

  const canAddMembers = member?.role === 'admin' || member?.role === 'pastor';
  const canDeleteMembers =
    member?.role === 'admin' || member?.role === 'pastor';

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

  // Helper function to get primary email from arrays or fallback to deprecated field
  const getPrimaryEmail = (member: Member) => {
    if (member.emails && member.emails.length > 0) {
      const primary = member.emails.find((e) => e.primary);
      return primary?.address || member.emails[0].address;
    }
    return member.email || 'N/A';
  };

  // Helper function to get primary phone from arrays or fallback to deprecated field
  const getPrimaryPhone = (member: Member) => {
    let phoneNumber = '';
    if (member.phones && member.phones.length > 0) {
      const primary = member.phones.find((p) => p.primary);
      phoneNumber = primary?.number || member.phones[0].number;
    } else {
      phoneNumber = member.phone || '';
    }
    return phoneNumber ? formatPhoneForDisplay(phoneNumber) : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Member Directory
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {activeSearchTerm
              ? `${totalCount} results`
              : `${totalCount} total members`}
          </div>
          {canAddMembers && (
            <>
              <Link
                to="/members/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mr-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Link>
              <button
                onClick={() => fetchMembers()}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Search
          </button>
          {activeSearchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </form>

        {activeSearchTerm && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing results for:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
              "{activeSearchTerm}"
            </span>
            <button
              onClick={handleClearSearch}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members && members.length > 0 ? (
                members.map((memberItem) => (
                  <tr key={memberItem.id} className="hover:bg-gray-50">
                    <td className="w-16 px-4 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        <Link
                          to={`/members/${memberItem.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {memberItem.lastName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        <Link
                          to={`/members/${memberItem.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {memberItem.firstName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPrimaryEmail(memberItem)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPrimaryPhone(memberItem)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(memberItem.memberStatus || 'active')}`}
                      >
                        {memberItem.memberStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(memberItem.role || 'member')}`}
                      >
                        {memberItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canDeleteMembers ? (
                        <button
                          onClick={() =>
                            handleDeleteMember(
                              memberItem.id,
                              `${memberItem.firstName} ${memberItem.lastName}`
                            )
                          }
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-gray-400">No Actions</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900">
                      No members found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeSearchTerm
                        ? 'Try adjusting your search terms.'
                        : 'No members available.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {showPagination && (
          <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
