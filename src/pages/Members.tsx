// src/pages/Members.tsx
// Member directory page displaying a searchable and paginated list of all church members
// This file exists to provide the main member management interface with role-based access controls
// RELEVANT FILES: src/components/members/MemberDirectoryTable.tsx, src/services/firebase/members.service.ts

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { membersService } from '../services/firebase/members.service';
import { useAuth } from '../hooks/useUnifiedAuth';
import { MemberDirectoryTable } from '../components/members/MemberDirectoryTable';
import { Search, Users, Plus, X } from 'lucide-react';

export default function Members() {
  const { member } = useAuth();
  const [members, setMembers] = useState<Awaited<
    ReturnType<typeof membersService.getMemberDirectoryPaginated>
  >['data']>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    void fetchMembers();
  }, [currentPage, activeSearchTerm]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const result = await membersService.getMemberDirectoryPaginated({
        page: currentPage,
        limit: itemsPerPage,
        search: activeSearchTerm || undefined,
        orderBy: 'lastName',
        orderDirection: 'asc',
      });
      setMembers(result?.data || []);
      setTotalCount(result?.totalCount || 0);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const canAddMembers = member?.role === 'admin' || member?.role === 'pastor';
  const canDeleteMembers =
    member?.role === 'admin' || member?.role === 'pastor';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setCurrentPage(1);
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${memberName}? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await membersService.delete(memberId);
      await fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete member');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
                onClick={() => void fetchMembers()}
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

      <MemberDirectoryTable
        members={members}
        activeSearchTerm={activeSearchTerm}
        canDeleteMembers={canDeleteMembers}
        onDeleteMember={handleDeleteMember}
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
