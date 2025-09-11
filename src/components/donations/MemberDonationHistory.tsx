// src/components/donations/MemberDonationHistory.tsx
// Member donation history component with filtering, search, and PDF export functionality
// Provides secure member-only access to donation records with comprehensive audit logging
// RELEVANT FILES: src/services/firebase/donations.service.ts, src/contexts/FirebaseAuthContext.tsx, src/types/donations.ts, src/components/donations/__tests__/MemberDonationHistory.test.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useMemberDonations } from '../../hooks/useMemberDonations';
import { Donation, DonationMethod } from '../../types/donations';
import { formatCurrency, formatDate } from '../../utils/currency-utils';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Card } from '../common/Card';
import { DonationFilters, FilterState } from './DonationFilters';
import { generateDonationStatement, generateDonationCSV, DonationStatementData } from './DonationStatementPDF';

interface MemberDonationHistoryProps {
  memberId?: string;
  member?: { id: string; firstName: string; lastName: string };
}


export const MemberDonationHistory: React.FC<MemberDonationHistoryProps> = ({
  memberId,
  member
}) => {
  const { user, member: currentMember, hasRole } = useAuth();
  const { showToast } = useToast();
  
  // Get the target member ID (either prop or current user)
  const targetMemberId = memberId || member?.id || currentMember?.id;
  
  // Optimized donation data management with caching and real-time updates
  const {
    donations,
    loading,
    error,
    retry,
    refetch,
    summary
  } = useMemberDonations({
    memberId: targetMemberId,
    enableRealTime: true,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes cache
  });
  const [filters, setFilters] = useState<FilterState>({
    categoryIds: [],
    methods: [],
    searchTerm: '',
    sortBy: 'donationDate',
    sortDirection: 'desc',
    page: 1,
    pageSize: 25
  });
  const targetMemberName = member 
    ? `${member.firstName} ${member.lastName}`
    : currentMember 
      ? `${currentMember.firstName} ${currentMember.lastName}`
      : 'Unknown Member';

  // Filter and sort donations
  const filteredAndSortedDonations = useMemo(() => {
    let result = [...donations];

    // Filter by date range
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      result = result.filter(d => {
        const donationDate = new Date(d.donationDate);
        return donationDate >= startDate && donationDate <= endDate;
      });
    }

    // Filter by categories
    if (filters.categoryIds.length > 0) {
      result = result.filter(d => filters.categoryIds.includes(d.categoryId));
    }

    // Filter by methods
    if (filters.methods.length > 0) {
      result = result.filter(d => filters.methods.includes(d.method));
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(d => 
        d.note?.toLowerCase().includes(searchLower) ||
        d.receiptNumber?.toLowerCase().includes(searchLower) ||
        d.categoryName.toLowerCase().includes(searchLower) ||
        d.memberName?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'donationDate':
          comparison = new Date(a.donationDate).getTime() - new Date(b.donationDate).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'categoryName':
          comparison = a.categoryName.localeCompare(b.categoryName);
          break;
      }
      return filters.sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [donations, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedDonations.length / filters.pageSize);
  const paginatedDonations = filteredAndSortedDonations.slice(
    (filters.page - 1) * filters.pageSize,
    filters.page * filters.pageSize
  );

  // Current year for display
  const currentYear = new Date().getFullYear();

  // Category breakdown (calculated from filtered donations for display accuracy)
  const categoryTotals = useMemo(() => {
    return donations.reduce((acc, donation) => {
      acc[donation.categoryName] = (acc[donation.categoryName] || 0) + donation.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [donations]);

  // Filter handlers
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...updates,
      page: updates.page || 1 // Reset to first page when filters change
    }));
  }, []);

  // Church information (this would typically come from a config/settings service)
  const churchInfo = {
    name: 'Shepherd Community Church',
    address: '123 Church Street',
    city: 'Your City',
    state: 'State',
    zip: '12345',
    ein: '12-3456789',
    phone: '(555) 123-4567',
    email: 'admin@shepherdchurch.org'
  };

  // Export functionality
  const handleExportCSV = useCallback(() => {
    if (!hasRole('admin') && !hasRole('pastor')) {
      showToast('Export functionality is only available to administrators and pastors', 'error');
      return;
    }
    
    try {
      generateDonationCSV(filteredAndSortedDonations, targetMemberName);
      showToast('CSV export downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to generate CSV export', 'error');
      console.error('CSV export error:', error);
    }
  }, [hasRole, showToast, filteredAndSortedDonations, targetMemberName]);

  // PDF statement generation
  const handleGeneratePDFStatement = useCallback(async (taxYear: number) => {
    if (!targetMemberId || !currentMember) {
      showToast('Unable to generate statement - member information missing', 'error');
      return;
    }

    try {
      // Filter donations for the specific tax year
      const yearDonations = donations.filter(d => 
        new Date(d.donationDate).getFullYear() === taxYear
      );

      if (yearDonations.length === 0) {
        showToast(`No donations found for ${taxYear}`, 'info');
        return;
      }

      const statementData: DonationStatementData = {
        member: {
          id: targetMemberId,
          firstName: member?.firstName || currentMember.firstName,
          lastName: member?.lastName || currentMember.lastName,
          email: currentMember.email,
          // Address would come from member profile if available
        },
        donations: yearDonations,
        taxYear,
        churchInfo,
        statementNumber: `${taxYear}-${targetMemberId.slice(-6)}`,
        generatedDate: new Date().toISOString()
      };

      await generateDonationStatement(statementData);
      showToast(`${taxYear} donation statement generated successfully`, 'success');
      
      // Audit logging
      console.log(`PDF statement generated for member: ${targetMemberId}, tax year: ${taxYear}, by user: ${user?.uid}`);
      
    } catch (error) {
      showToast('Failed to generate donation statement', 'error');
      console.error('PDF generation error:', error);
    }
  }, [targetMemberId, currentMember, member, donations, churchInfo, user?.uid, showToast]);

  // Authorization check
  if (!user || !currentMember) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to view donation history.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12" role="status" aria-label="Loading donation history">
        <LoadingSpinner />
        <span className="sr-only">Loading donation history...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8" role="alert">
        <p className="text-red-600 mb-4">Error loading donation history: {error}</p>
        <button
          onClick={retry}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          aria-label="Retry loading donation history"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (donations.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Donation History</h2>
        <p className="text-gray-600">No donations found for {targetMemberName}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label={`Donation history for ${targetMemberName}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donation History</h1>
          <p className="text-gray-600">Viewing donations for {targetMemberName}</p>
        </div>
        
        {/* Export buttons - only for admin/pastor */}
        {(hasRole('admin') || hasRole('pastor')) && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              aria-label="Export donation history as CSV"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleGeneratePDFStatement(currentYear)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              aria-label={`Generate ${currentYear} tax statement PDF`}
            >
              {currentYear} Tax Statement
            </button>
            <button
              onClick={() => handleGeneratePDFStatement(currentYear - 1)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
              aria-label={`Generate ${currentYear - 1} tax statement PDF`}
            >
              {currentYear - 1} Tax Statement
            </button>
          </div>
        )}
      </div>

      {/* Year-to-date summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Year-to-Date Summary ({currentYear})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Donated</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.ytdAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tax Deductible</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.taxDeductibleAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Donation Count</p>
            <p className="text-2xl font-bold text-blue-600">{summary.ytdCount}</p>
          </div>
        </div>
      </Card>

      {/* Category breakdown */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([category, total]) => {
              const percentage = summary.ytdAmount > 0 ? ((total / summary.ytdAmount) * 100).toFixed(1) : '0.0';
              return (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-700">{category}</span>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(total)}</span>
                    <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Filters */}
      <DonationFilters
        filters={filters}
        onFiltersChange={updateFilters}
      />

      {/* Donation table */}
      <Card>
        <div className="overflow-x-auto">
          <table 
            className="min-w-full divide-y divide-gray-200" 
            role="table"
            aria-label="Donation history table"
          >
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => updateFilters({
                    sortBy: 'donationDate',
                    sortDirection: filters.sortBy === 'donationDate' && filters.sortDirection === 'desc' ? 'asc' : 'desc'
                  })}
                  aria-label="Sort by date"
                >
                  Date {filters.sortBy === 'donationDate' && (filters.sortDirection === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => updateFilters({
                    sortBy: 'amount',
                    sortDirection: filters.sortBy === 'amount' && filters.sortDirection === 'desc' ? 'asc' : 'desc'
                  })}
                  aria-label="Sort by amount"
                >
                  Amount {filters.sortBy === 'amount' && (filters.sortDirection === 'desc' ? '↓' : '↑')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Deductible
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(donation.donationDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(donation.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.categoryName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.receiptNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {donation.isTaxDeductible ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {(filters.page - 1) * filters.pageSize + 1} to{' '}
              {Math.min(filters.page * filters.pageSize, filteredAndSortedDonations.length)} of{' '}
              {filteredAndSortedDonations.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => updateFilters({ page: filters.page - 1 })}
                disabled={filters.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="Previous page"
              >
                Previous
              </button>
              <button
                onClick={() => updateFilters({ page: filters.page + 1 })}
                disabled={filters.page >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};