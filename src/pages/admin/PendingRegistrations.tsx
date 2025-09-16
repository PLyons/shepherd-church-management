import { useState } from 'react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RegistrationStats } from '../../components/admin/RegistrationStats';
import { RegistrationFilters } from '../../components/admin/RegistrationFilters';
import { RegistrationList } from '../../components/admin/RegistrationList';
import { RejectModal } from '../../components/admin/RejectModal';
import { useRegistrationManagement } from '../../hooks/useRegistrationManagement';

export default function PendingRegistrations() {
  const {
    loading,
    processing,
    filteredRegistrations,
    tokens,
    stats,
    selectedRegistrations,
    expandedRegistration,
    duplicates,
    filters,
    setFilters,
    setExpandedRegistration,
    handleApprove,
    handleReject,
    handleBulkApprove,
    handleSelectAll,
    handleSelectRegistration,
  } = useRegistrationManagement();

  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleRejectWithReason = (reason: string) => {
    if (showRejectModal) {
      handleReject(showRejectModal, reason);
      setShowRejectModal(null);
      setRejectionReason('');
    }
  };

  const handleRejectModalClose = () => {
    setShowRejectModal(null);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Registration Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review and approve pending member registrations
              </p>
            </div>
          </div>

          <RegistrationStats stats={stats} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RegistrationFilters
          filters={filters}
          setFilters={setFilters}
          tokens={tokens}
          selectedCount={selectedRegistrations.length}
          onBulkApprove={handleBulkApprove}
        />

        <RegistrationList
          registrations={filteredRegistrations}
          tokens={tokens}
          duplicates={duplicates}
          selectedRegistrations={selectedRegistrations}
          expandedRegistration={expandedRegistration}
          processing={processing}
          onSelectRegistration={handleSelectRegistration}
          onSelectAll={handleSelectAll}
          onToggleExpand={setExpandedRegistration}
          onApprove={handleApprove}
          onReject={setShowRejectModal}
        />
      </div>

      <RejectModal
        isOpen={!!showRejectModal}
        onClose={handleRejectModalClose}
        onReject={handleRejectWithReason}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
      />
    </div>
  );
}
