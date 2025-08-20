import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Calendar,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { publicRegistrationService } from '../../services/firebase/public-registration.service';
import { registrationApprovalService } from '../../services/firebase/registration-approval.service';
import { registrationTokensService } from '../../services/firebase/registration-tokens.service';
import { PendingRegistration } from '../../types/registration';

interface FilterState {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  tokenId: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  memberStatus: 'all' | 'member' | 'visitor';
  searchTerm: string;
}

interface RegistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function PendingRegistrations() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    PendingRegistration[]
  >([]);
  const [tokens, setTokens] = useState<{ [key: string]: string }>({});
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>(
    []
  );
  const [expandedRegistration, setExpandedRegistration] = useState<
    string | null
  >(null);
  const [duplicates, setDuplicates] = useState<{
    [key: string]: PendingRegistration[];
  }>({});

  const [filters, setFilters] = useState<FilterState>({
    status: 'pending',
    tokenId: '',
    dateRange: 'all',
    memberStatus: 'all',
    searchTerm: '',
  });

  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [registrations, filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load registrations and tokens in parallel
      const [regsData, tokensData, statsData] = await Promise.all([
        publicRegistrationService.getAll(),
        registrationTokensService.getAll(),
        publicRegistrationService.getRegistrationStatistics(),
      ]);

      // Create token lookup map
      const tokenMap: { [key: string]: string } = {};
      tokensData.forEach((token) => {
        tokenMap[token.id] = token.metadata.purpose || 'Unknown Event';
      });

      // Sort registrations by newest first
      const sortedRegs = regsData.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      // Check for duplicates
      const duplicateMap: { [key: string]: PendingRegistration[] } = {};
      for (const reg of sortedRegs) {
        if (reg.email || reg.phone) {
          const dups = await publicRegistrationService.detectDuplicates(
            reg.email,
            reg.phone
          );
          if (dups.length > 1) {
            duplicateMap[reg.id] = dups;
          }
        }
      }

      setRegistrations(sortedRegs);
      setTokens(tokenMap);
      setStats(statsData);
      setDuplicates(duplicateMap);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showToast('Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(
        (reg) => reg.approvalStatus === filters.status
      );
    }

    // Filter by token
    if (filters.tokenId) {
      filtered = filtered.filter((reg) => reg.tokenId === filters.tokenId);
    }

    // Filter by member status
    if (filters.memberStatus !== 'all') {
      filtered = filtered.filter(
        (reg) => reg.memberStatus === filters.memberStatus
      );
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (reg) => new Date(reg.submittedAt) >= startDate
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (reg) =>
          reg.firstName.toLowerCase().includes(term) ||
          reg.lastName.toLowerCase().includes(term) ||
          (reg.email && reg.email.toLowerCase().includes(term)) ||
          (reg.phone && reg.phone.includes(term))
      );
    }

    setFilteredRegistrations(filtered);
  };

  const handleApprove = async (registrationId: string) => {
    if (!user) return;

    try {
      setProcessing((prev) => [...prev, registrationId]);

      const result = await registrationApprovalService.approveRegistration(
        registrationId,
        user.uid
      );

      if (result.success) {
        showToast('Registration approved successfully!', 'success');
        await loadData(); // Reload data
      } else {
        showToast(result.error || 'Failed to approve registration', 'error');
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      showToast('Failed to approve registration', 'error');
    } finally {
      setProcessing((prev) => prev.filter((id) => id !== registrationId));
    }
  };

  const handleReject = async (registrationId: string, reason: string) => {
    if (!user) return;

    try {
      setProcessing((prev) => [...prev, registrationId]);

      await publicRegistrationService.updateApprovalStatus(
        registrationId,
        'rejected',
        user.uid,
        reason
      );

      showToast('Registration rejected', 'success');
      setShowRejectModal(null);
      setRejectionReason('');
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error rejecting registration:', error);
      showToast('Failed to reject registration', 'error');
    } finally {
      setProcessing((prev) => prev.filter((id) => id !== registrationId));
    }
  };

  const handleBulkApprove = async () => {
    if (!user || selectedRegistrations.length === 0) return;

    try {
      setLoading(true);

      const promises = selectedRegistrations.map((id) =>
        registrationApprovalService.approveRegistration(id, user.uid)
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        showToast(
          `${successCount} registration(s) approved successfully!`,
          'success'
        );
      }
      if (failCount > 0) {
        showToast(`${failCount} registration(s) failed to approve`, 'error');
      }

      setSelectedRegistrations([]);
      await loadData();
    } catch (error) {
      console.error('Error bulk approving:', error);
      showToast('Failed to bulk approve registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const pendingIds = filteredRegistrations
      .filter((reg) => reg.approvalStatus === 'pending')
      .map((reg) => reg.id);

    if (selectedRegistrations.length === pendingIds.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(pendingIds);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                Pending Registrations
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve new member registrations
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-sm text-blue-800">Total</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
                <div className="text-sm text-yellow-800">Pending</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </div>
                <div className="text-sm text-green-800">Approved</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </div>
                <div className="text-sm text-red-800">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      searchTerm: e.target.value,
                    }))
                  }
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value as
                      | 'all'
                      | 'pending'
                      | 'approved'
                      | 'rejected',
                  }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Member Status Filter */}
            <div>
              <select
                value={filters.memberStatus}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    memberStatus: e.target.value as
                      | 'all'
                      | 'visitor'
                      | 'member',
                  }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="visitor">Visitors</option>
                <option value="member">Members</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: e.target.value as
                      | 'all'
                      | 'today'
                      | 'week'
                      | 'month',
                  }))
                }
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Bulk Actions */}
            <div>
              {selectedRegistrations.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve {selectedRegistrations.length}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No registrations found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            {filteredRegistrations.some(
              (reg) => reg.approvalStatus === 'pending'
            ) && (
              <div className="bg-white rounded-lg border p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedRegistrations.length ===
                      filteredRegistrations.filter(
                        (reg) => reg.approvalStatus === 'pending'
                      ).length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Select all pending registrations (
                    {
                      filteredRegistrations.filter(
                        (reg) => reg.approvalStatus === 'pending'
                      ).length
                    }
                    )
                  </span>
                </label>
              </div>
            )}

            {/* Registration Cards */}
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white rounded-lg border shadow-sm"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Checkbox for pending registrations */}
                      {registration.approvalStatus === 'pending' && (
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={selectedRegistrations.includes(
                              registration.id
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRegistrations((prev) => [
                                  ...prev,
                                  registration.id,
                                ]);
                              } else {
                                setSelectedRegistrations((prev) =>
                                  prev.filter((id) => id !== registration.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* Registration Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {registration.firstName} {registration.lastName}
                          </h3>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(registration.approvalStatus)}`}
                          >
                            {getStatusIcon(registration.approvalStatus)}
                            <span className="ml-1 capitalize">
                              {registration.approvalStatus}
                            </span>
                          </span>

                          {/* Member Status Badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              registration.memberStatus === 'member'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {registration.memberStatus === 'member'
                              ? 'Member'
                              : 'Visitor'}
                          </span>

                          {/* Duplicate Warning */}
                          {duplicates[registration.id] && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Potential Duplicate
                            </span>
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          {registration.email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {registration.email}
                            </div>
                          )}
                          {registration.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {registration.phone}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(registration.submittedAt)}
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Event:</span>{' '}
                          {tokens[registration.tokenId] || 'Unknown Event'}
                        </div>

                        {registration.address?.line1 && (
                          <div className="mt-2 flex items-start text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                            <div>
                              {registration.address.line1}
                              {registration.address.line2 && (
                                <>, {registration.address.line2}</>
                              )}
                              <br />
                              {registration.address.city},{' '}
                              {registration.address.state}{' '}
                              {registration.address.postalCode}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {registration.approvalStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(registration.id)}
                            disabled={processing.includes(registration.id)}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {processing.includes(registration.id) ? (
                              <LoadingSpinner className="w-4 h-4 mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </button>

                          <button
                            onClick={() => setShowRejectModal(registration.id)}
                            disabled={processing.includes(registration.id)}
                            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </button>
                        </>
                      )}

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() =>
                          setExpandedRegistration(
                            expandedRegistration === registration.id
                              ? null
                              : registration.id
                          )
                        }
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedRegistration === registration.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRegistration === registration.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            Personal Information
                          </h4>
                          <dl className="space-y-2 text-sm">
                            {registration.birthdate && (
                              <div>
                                <dt className="text-gray-600">Birth Date:</dt>
                                <dd className="text-gray-900">
                                  {new Date(
                                    registration.birthdate
                                  ).toLocaleDateString()}
                                </dd>
                              </div>
                            )}
                            {registration.gender && (
                              <div>
                                <dt className="text-gray-600">Gender:</dt>
                                <dd className="text-gray-900">
                                  {registration.gender}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        {/* Technical Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">
                            Submission Details
                          </h4>
                          <dl className="space-y-2 text-sm">
                            <div>
                              <dt className="text-gray-600">User Agent:</dt>
                              <dd className="text-gray-900 break-all">
                                {registration.userAgent}
                              </dd>
                            </div>
                            {registration.ipAddress && (
                              <div>
                                <dt className="text-gray-600">IP Address:</dt>
                                <dd className="text-gray-900">
                                  {registration.ipAddress}
                                </dd>
                              </div>
                            )}
                            {registration.approvedBy && (
                              <div>
                                <dt className="text-gray-600">Processed By:</dt>
                                <dd className="text-gray-900">
                                  {registration.approvedBy}
                                </dd>
                              </div>
                            )}
                            {registration.approvedAt && (
                              <div>
                                <dt className="text-gray-600">Processed At:</dt>
                                <dd className="text-gray-900">
                                  {formatDate(registration.approvedAt)}
                                </dd>
                              </div>
                            )}
                            {registration.rejectionReason && (
                              <div>
                                <dt className="text-gray-600">
                                  Rejection Reason:
                                </dt>
                                <dd className="text-red-600">
                                  {registration.rejectionReason}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      </div>

                      {/* Duplicate Alerts */}
                      {duplicates[registration.id] && (
                        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-orange-800">
                                Potential Duplicates Detected
                              </h4>
                              <p className="mt-1 text-sm text-orange-700">
                                Found {duplicates[registration.id].length}{' '}
                                registration(s) with matching email or phone
                                number.
                              </p>
                              <div className="mt-2 space-y-1">
                                {duplicates[registration.id].map((dup) => (
                                  <div
                                    key={dup.id}
                                    className="text-sm text-orange-700"
                                  >
                                    • {dup.firstName} {dup.lastName} -{' '}
                                    {dup.email || dup.phone} (
                                    {dup.approvalStatus})
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reject Registration
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this registration. This will
              help with future processing.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Reject Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
