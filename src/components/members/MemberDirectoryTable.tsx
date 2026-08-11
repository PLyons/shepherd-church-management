// src/components/members/MemberDirectoryTable.tsx
// Paginated member directory table with role/status badges and delete actions
// Extracted from Members page to keep the page coordinator under 300 LOC
// RELEVANT FILES: src/pages/Members.tsx, src/types/index.ts, src/utils/member-form-utils.ts

import { Link } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import { formatPhoneForDisplay } from '../../utils/member-form-utils';
import type { Member } from '../../types';

interface MemberDirectoryTableProps {
  members: Member[];
  activeSearchTerm: string;
  canDeleteMembers: boolean;
  onDeleteMember: (memberId: string, memberName: string) => void;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getRoleColor(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'pastor':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status: string) {
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
}

function getPrimaryEmail(member: Member) {
  if (member.emails && member.emails.length > 0) {
    const primary = member.emails.find((e) => e.primary);
    return primary?.address || member.emails[0].address;
  }
  return member.email || 'N/A';
}

function getPrimaryPhone(member: Member) {
  let phoneNumber = '';
  if (member.phones && member.phones.length > 0) {
    const primary = member.phones.find((p) => p.primary);
    phoneNumber = primary?.number || member.phones[0].number;
  } else {
    phoneNumber = member.phone || '';
  }
  return phoneNumber ? formatPhoneForDisplay(phoneNumber) : 'N/A';
}

export function MemberDirectoryTable({
  members,
  activeSearchTerm,
  canDeleteMembers,
  onDeleteMember,
  currentPage,
  totalCount,
  itemsPerPage,
  totalPages,
  onPageChange,
}: MemberDirectoryTableProps) {
  const showPagination = totalPages > 1;

  return (
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
            {members.length > 0 ? (
              members.map((memberItem) => (
                <tr key={memberItem.id} className="hover:bg-gray-50">
                  <td className="w-16 px-4 py-4 whitespace-nowrap">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/members/${memberItem.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {memberItem.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/members/${memberItem.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {memberItem.firstName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getPrimaryEmail(memberItem)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getPrimaryPhone(memberItem)}
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
                          onDeleteMember(
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

      {showPagination && (
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
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
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                onPageChange(Math.min(totalPages, currentPage + 1))
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
      )}
    </div>
  );
}
