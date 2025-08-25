import { Users } from 'lucide-react';
import { PendingRegistration } from '../../types/registration';
import { RegistrationCard } from './RegistrationCard';

interface RegistrationListProps {
  registrations: PendingRegistration[];
  tokens: { [key: string]: string };
  duplicates: { [key: string]: PendingRegistration[] };
  selectedRegistrations: string[];
  expandedRegistration: string | null;
  processing: string[];
  onSelectRegistration: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onToggleExpand: (id: string | null) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function RegistrationList({
  registrations,
  tokens,
  duplicates,
  selectedRegistrations,
  expandedRegistration,
  processing,
  onSelectRegistration,
  onSelectAll,
  onToggleExpand,
  onApprove,
  onReject,
}: RegistrationListProps) {
  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No registrations found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  const pendingRegistrations = registrations.filter(
    (reg) => reg.approvalStatus === 'pending'
  );
  const hasPendingRegistrations = pendingRegistrations.length > 0;

  return (
    <div className="space-y-4">
      {/* Select All */}
      {hasPendingRegistrations && (
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              onChange={onSelectAll}
              checked={
                selectedRegistrations.length > 0 &&
                selectedRegistrations.length === pendingRegistrations.length
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Select all pending registrations ({pendingRegistrations.length})
            </span>
          </label>
        </div>
      )}

      {/* Registration Cards */}
      {registrations.map((registration) => (
        <RegistrationCard
          key={registration.id}
          registration={registration}
          tokens={tokens}
          duplicates={duplicates}
          isSelected={selectedRegistrations.includes(registration.id)}
          isProcessing={processing.includes(registration.id)}
          isExpanded={expandedRegistration === registration.id}
          onSelect={onSelectRegistration}
          onToggleExpand={onToggleExpand}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}