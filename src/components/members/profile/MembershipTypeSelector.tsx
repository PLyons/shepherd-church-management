import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Clock, AlertCircle } from 'lucide-react';
import { Member } from '../../../types';
import {
  MEMBERSHIP_TYPES,
  getAvailableStatusOptions,
} from '../../../constants/membershipTypes';
import { useAuth } from '../../../contexts/FirebaseAuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { membersService } from '../../../services/firebase/members.service';
import { membershipHistoryService } from '../../../services/firebase/membershipHistory.service';
import { MembershipHistoryModal } from './MembershipHistoryModal';

interface MembershipTypeSelectorProps {
  member: Member;
  onStatusChange?: (newStatus: string) => void;
}

export function MembershipTypeSelector({
  member,
  onStatusChange,
}: MembershipTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { member: currentUser } = useAuth();
  const { showToast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStatus = member.memberStatus || 'not_set';
  const currentType = MEMBERSHIP_TYPES[currentStatus];
  const canChangeStatus =
    currentUser?.role === 'admin' || currentUser?.role === 'pastor';
  const availableOptions = getAvailableStatusOptions(
    currentUser?.role || '',
    currentStatus
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusSelect = (newStatus: string) => {
    setIsOpen(false);
    setPendingStatus(newStatus);
    setShowConfirmDialog(true);
    setReason('');
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !currentUser) return;

    setIsChanging(true);
    try {
      // Optimistic update
      if (onStatusChange) {
        onStatusChange(pendingStatus);
      }

      // Update member status
      await membersService.update(member.id, {
        memberStatus: pendingStatus as typeof member.memberStatus,
      });

      // Record history (non-blocking - don't fail if history can't be saved)
      try {
        await membershipHistoryService.addStatusChange({
          memberId: member.id,
          previousStatus: currentStatus,
          newStatus: pendingStatus,
          reason: reason.trim() || undefined,
          changedBy: currentUser.id,
          changedByName: `${currentUser.firstName} ${currentUser.lastName}`,
          metadata: {
            source: 'profile',
            userAgent: navigator.userAgent,
          },
        });
      } catch (historyError) {
        console.warn(
          'Failed to save status history, but member update was successful:',
          historyError
        );
      }

      showToast('Membership status updated successfully', 'success');
      setShowConfirmDialog(false);
      setPendingStatus(null);
      setReason('');
    } catch (error) {
      // Rollback optimistic update
      if (onStatusChange) {
        onStatusChange(currentStatus);
      }

      console.error('Error updating membership status:', error);
      showToast('Failed to update membership status', 'error');
    } finally {
      setIsChanging(false);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
    setReason('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current status button */}
      <button
        onClick={() => canChangeStatus && setIsOpen(!isOpen)}
        disabled={!canChangeStatus}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
          ${currentType.color.bg} ${currentType.color.text} ${currentType.color.border}
          ${
            canChangeStatus
              ? 'hover:opacity-80 cursor-pointer'
              : 'cursor-not-allowed opacity-75'
          }
        `}
      >
        <span>{currentType.icon}</span>
        <span>{currentType.label}</span>
        {canChangeStatus && (
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && canChangeStatus && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
              Change Membership Status
            </div>
            {availableOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className="w-full flex items-center gap-3 px-2 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
              >
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowHistory(true);
              }}
              className="w-full flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <Clock className="h-4 w-4" />
              View Status History
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Confirm Status Change
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Change membership status from{' '}
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${currentType.color.bg} ${currentType.color.text}`}
                >
                  {currentType.icon} {currentType.label}
                </span>{' '}
                to{' '}
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${MEMBERSHIP_TYPES[pendingStatus].color.bg} ${MEMBERSHIP_TYPES[pendingStatus].color.text}`}
                >
                  {MEMBERSHIP_TYPES[pendingStatus].icon}{' '}
                  {MEMBERSHIP_TYPES[pendingStatus].label}
                </span>
                ?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for change (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Completed membership class, Moved away, etc."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelStatusChange}
                disabled={isChanging}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={isChanging}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
              >
                {isChanging && (
                  <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                )}
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status History Modal */}
      <MembershipHistoryModal
        memberId={member.id}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
