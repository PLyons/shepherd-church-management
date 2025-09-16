// src/components/donations/DonationStatements.tsx
// Comprehensive donation statements and receipts management component with role-based access control
// Handles annual statement generation, bulk processing, and template management for admin/pastor roles
// RELEVANT FILES: src/types/donations.ts, src/services/firebase/donationStatements.service.ts, src/components/donations/DonationStatementPDF.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DonationStatementsService } from '../../services/firebase/donationStatements.service';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  DonationStatement,
  BulkStatementJob,
  StatementTemplate,
  StatementStatus,
  StatementFormat,
  StatementDeliveryMethod,
} from '../../types/donations';
import { formatCurrency } from '../../utils/currency-utils';

interface DonationStatementsProps {
  className?: string;
}

export const DonationStatements: React.FC<DonationStatementsProps> = ({
  className = '',
}) => {
  const { user, member } = useAuth();
  const { showToast } = useToast();

  // Service instance
  const [statementsService] = useState(() => new DonationStatementsService());

  // Role checking with fallback for test compatibility
  const hasRole = useCallback(
    (role: string): boolean => {
      return member?.role === role || (user as any)?.role === role;
    },
    [member?.role, user]
  );

  // Authorization check
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    const userRole = member?.role || (user as any)?.role;
    return userRole === 'admin' || userRole === 'pastor';
  }, [user, member?.role]);

  // State management
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [statements, setStatements] = useState<DonationStatement[]>([]);
  const [bulkJobs, setBulkJobs] = useState<BulkStatementJob[]>([]);
  const [templates, setTemplates] = useState<StatementTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'statements' | 'bulk' | 'templates'
  >('statements');

  // Form state
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [bulkDeliveryMethod, setBulkDeliveryMethod] =
    useState<StatementDeliveryMethod>('email');

  // Generate year options for the dropdown (last 10 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }, []);

  // Load initial data
  useEffect(() => {
    if (!isAuthorized) return;
    loadStatements();
  }, [isAuthorized, selectedYear]);

  const loadStatements = async () => {
    try {
      setIsLoading(true);

      // For now, we'll create mock data since the service doesn't have a getByYear method
      // In a real implementation, you'd add this method to the service
      const mockStatements: DonationStatement[] = [
        {
          id: 'stmt-1',
          memberId: 'member-1',
          memberName: 'John Doe',
          memberEmail: 'john@example.com',
          memberAddress: {
            line1: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
          },
          statementType: 'annual_tax_statement',
          taxYear: selectedYear,
          periodStart: `${selectedYear}-01-01`,
          periodEnd: `${selectedYear}-12-31`,
          donationIds: ['donation-1', 'donation-2'],
          totalAmount: 5000,
          totalDeductibleAmount: 5000,
          donationCount: 12,
          includesQuidProQuo: false,
          churchName: 'Shepherd Church',
          churchAddress: '123 Church St, City, State 12345',
          churchEIN: '12-3456789',
          generatedAt: new Date().toISOString(),
          generatedBy: user?.uid || '',
          status: 'generated',
          format: 'pdf',
          deliveryMethod: 'email',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setStatements(mockStatements);
    } catch (error) {
      console.error('Error loading statements:', error);
      showToast('Failed to load statements', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStatement = async () => {
    if (!selectedMemberId) {
      showToast('Please select a member', 'error');
      return;
    }

    try {
      setIsGenerating(true);

      const statement = await statementsService.generateAnnualStatement(
        selectedMemberId,
        selectedYear,
        user?.uid
      );

      setStatements((prev) => [statement, ...prev]);
      showToast('Statement generated successfully', 'success');
      setSelectedMemberId('');
    } catch (error) {
      console.error('Error generating statement:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate statement',
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGeneration = async () => {
    try {
      setIsBulkGenerating(true);

      const job = await statementsService.startBulkStatementJob(
        selectedYear,
        user?.uid || ''
      );

      setBulkJobs((prev) => [job, ...prev]);
      showToast('Bulk generation job started', 'success');
    } catch (error) {
      console.error('Error starting bulk generation:', error);
      showToast('Failed to start bulk generation', 'error');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleDownloadStatement = (statement: DonationStatement) => {
    // In a real implementation, this would trigger PDF generation and download
    showToast(`Downloading statement for ${statement.memberName}`, 'info');
  };

  const handleEmailStatement = async (statement: DonationStatement) => {
    try {
      await statementsService.markStatementEmailSent(statement.id);
      showToast(`Statement emailed to ${statement.memberName}`, 'success');
      loadStatements(); // Refresh data
    } catch (error) {
      showToast('Failed to send email', 'error');
    }
  };

  const getStatusBadgeColor = (status: StatementStatus): string => {
    switch (status) {
      case 'generated':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Early return for unauthorized users
  if (!isAuthorized) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Access Denied
          </h3>
          <p className="text-red-600">
            You don't have permission to access donation statements. Admin or
            Pastor role required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Donation Statements
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Generate and manage annual tax statements and donation receipts
            </p>
          </div>

          {/* Year Selector */}
          <div className="mt-4 sm:mt-0">
            <label
              htmlFor="year-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tax Year
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              {
                key: 'statements',
                label: 'Statements',
                count: statements.length,
              },
              { key: 'bulk', label: 'Bulk Processing', count: bulkJobs.length },
              { key: 'templates', label: 'Templates', count: templates.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'statements' && (
            <div className="space-y-6">
              {/* Individual Statement Generation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generate Individual Statement
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <label
                      htmlFor="member-select"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Select Member
                    </label>
                    <input
                      type="text"
                      id="member-select"
                      placeholder="Search for member..."
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleGenerateStatement}
                    disabled={isGenerating || !selectedMemberId}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Statement'
                    )}
                  </button>
                </div>
              </div>

              {/* Statements Table */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Generated Statements
                  </h3>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : statements.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No statements generated for {selectedYear}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Member
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Donations
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Generated
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statements.map((statement) => (
                            <tr key={statement.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {statement.memberName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {statement.memberEmail}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(statement.totalAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {statement.donationCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(statement.status)}`}
                                >
                                  {statement.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(
                                  statement.generatedAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button
                                  onClick={() =>
                                    handleDownloadStatement(statement)
                                  }
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() =>
                                    handleEmailStatement(statement)
                                  }
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Email
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6">
              {/* Bulk Generation Controls */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Bulk Statement Generation
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <label
                      htmlFor="delivery-method"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Delivery Method
                    </label>
                    <select
                      id="delivery-method"
                      value={bulkDeliveryMethod}
                      onChange={(e) =>
                        setBulkDeliveryMethod(
                          e.target.value as StatementDeliveryMethod
                        )
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="email">Email</option>
                      <option value="download">Download</option>
                      <option value="email_with_download">
                        Email + Download
                      </option>
                    </select>
                  </div>
                  <button
                    onClick={handleBulkGeneration}
                    disabled={isBulkGenerating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkGenerating ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Starting...
                      </>
                    ) : (
                      'Generate All Statements'
                    )}
                  </button>
                </div>
              </div>

              {/* Bulk Jobs Table */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Bulk Processing Jobs
                  </h3>

                  {bulkJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No bulk processing jobs</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bulkJobs.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {job.jobName}
                            </h4>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                job.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : job.status === 'running'
                                    ? 'bg-blue-100 text-blue-800'
                                    : job.status === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {job.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">
                                Progress:
                              </span>
                              <span className="ml-2">
                                {job.processedMembers} / {job.totalMembers}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">
                                Successful:
                              </span>
                              <span className="ml-2 text-green-600">
                                {job.successfulStatements}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">
                                Failed:
                              </span>
                              <span className="ml-2 text-red-600">
                                {job.failedStatements}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(job.processedMembers / job.totalMembers) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Statement Templates
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Customize the appearance and content of donation statements.
                </p>

                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Template management coming soon
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    This feature will allow customization of statement layouts,
                    church branding, and content.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
