import { useState, useEffect } from 'react';
import { X, Clock, User } from 'lucide-react';
import { MEMBERSHIP_TYPES } from '../../../constants/membershipTypes';
import { membershipHistoryService } from '../../../services/firebase/membershipHistory.service';
import { MembershipStatusChange } from '../../../types';

interface MembershipHistoryModalProps {
  memberId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MembershipHistoryModal({
  memberId,
  isOpen,
  onClose,
}: MembershipHistoryModalProps) {
  const [history, setHistory] = useState<MembershipStatusChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadHistory = async () => {
      try {
        setLoading(true);
        const historyData =
          await membershipHistoryService.getStatusHistory(memberId);
        setHistory(historyData);
        setError(null);
      } catch (err) {
        setError('Failed to load status history');
        console.error('Error loading membership history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [isOpen, memberId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Membership Status History
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-80">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-sm text-gray-600">Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                No status changes recorded
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((change, index) => (
                <StatusChangeItem
                  key={change.id}
                  change={change}
                  isLatest={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChangeItem({
  change,
  isLatest,
}: {
  change: MembershipStatusChange;
  isLatest: boolean;
}) {
  const fromType = MEMBERSHIP_TYPES[change.previousStatus];
  const toType = MEMBERSHIP_TYPES[change.newStatus];

  // Fallback for unknown status types
  const fromTypeDisplay = fromType || {
    icon: '❓',
    label: change.previousStatus,
    color: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };
  const toTypeDisplay = toType || {
    icon: '❓',
    label: change.newStatus,
    color: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg ${isLatest ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
    >
      <div className="flex-shrink-0">
        <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center border">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${fromTypeDisplay.color.bg} ${fromTypeDisplay.color.text}`}
          >
            {fromTypeDisplay.icon} {fromTypeDisplay.label}
          </span>
          <span className="text-gray-400">→</span>
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${toTypeDisplay.color.bg} ${toTypeDisplay.color.text}`}
          >
            {toTypeDisplay.icon} {toTypeDisplay.label}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Changed by <span className="font-medium">{change.changedByName}</span>
        </div>
        <div className="text-xs text-gray-500">
          {change.changedAt.toLocaleString()}
        </div>
        {change.reason && (
          <div className="mt-2 text-sm text-gray-700 italic">
            "{change.reason}"
          </div>
        )}
      </div>
    </div>
  );
}
