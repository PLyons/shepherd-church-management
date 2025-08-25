import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Communication, CommunicationType } from '../../../../types/notes';
import { notesService } from '../../../../services/firebase/notes.service';
import { useAuth } from '../../../../hooks/useUnifiedAuth';
import { useToast } from '../../../../contexts/ToastContext';

interface CommunicationLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  onSave: (communication: Communication) => void;
}

const COMMUNICATION_TYPES: { value: CommunicationType; label: string }[] = [
  { value: 'pastoral_call', label: 'Pastoral Call' },
  { value: 'counseling_session', label: 'Counseling Session' },
  { value: 'prayer_support', label: 'Prayer Support' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'routine_check_in', label: 'Routine Check-in' },
  { value: 'event_coordination', label: 'Event Coordination' },
  { value: 'volunteer_coordination', label: 'Volunteer Coordination' }
];

const COMMUNICATION_METHODS: { value: Communication['method']; label: string }[] = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text/SMS' },
  { value: 'video_call', label: 'Video Call' },
  { value: 'in_person', label: 'In Person' }
];

export function CommunicationLogger({ isOpen, onClose, memberId, onSave }: CommunicationLoggerProps) {
  const [type, setType] = useState<CommunicationType>('pastoral_call');
  const [direction, setDirection] = useState<Communication['direction']>('outgoing');
  const [method, setMethod] = useState<Communication['method']>('phone');
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [duration, setDuration] = useState<number | undefined>();
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { member: currentUser } = useAuth();
  const { showToast } = useToast();

  const resetForm = () => {
    setType('pastoral_call');
    setDirection('outgoing');
    setMethod('phone');
    setSubject('');
    setSummary('');
    setFullContent('');
    setContactInfo('');
    setDuration(undefined);
    setRequiresFollowUp(false);
    setFollowUpDate('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!summary.trim() || !currentUser) {
      setError('Summary is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const communication: Omit<Communication, 'id' | 'timestamp'> = {
        memberId,
        type,
        direction,
        method,
        subject: subject.trim() || undefined,
        summary: summary.trim(),
        fullContent: fullContent.trim() || undefined,
        contactInfo: contactInfo.trim() || undefined,
        duration,
        recordedBy: currentUser.id,
        recordedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        requiresFollowUp,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        followUpCompleted: false
      };

      const communicationId = await notesService.logCommunication(memberId, communication);

      // Create communication object for UI update with real ID
      const savedCommunication: Communication = {
        ...communication,
        id: communicationId,
        timestamp: new Date()
      };

      onSave(savedCommunication);
      showToast('Communication logged successfully', 'success');
      handleClose();
    } catch (error) {
      console.error('Error logging communication:', error);
      setError('Failed to log communication. Please try again.');
      showToast('Failed to log communication', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Log Communication
          </h3>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Type, Direction, Method */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CommunicationType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COMMUNICATION_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direction
                </label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as Communication['direction'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="outgoing">Outgoing</option>
                  <option value="incoming">Incoming</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Communication['method'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COMMUNICATION_METHODS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject (Optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief subject line..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary *
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of the communication..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Full Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Notes (Optional)
              </label>
              <textarea
                value={fullContent}
                onChange={(e) => setFullContent(e.target.value)}
                placeholder="Detailed notes about the communication..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contact Info and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Info (Optional)
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone number or email used..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={duration || ''}
                  onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                  min="1"
                  placeholder="Duration in minutes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Follow-up */}
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={requiresFollowUp}
                  onChange={(e) => setRequiresFollowUp(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Requires follow-up
                </span>
              </label>

              {requiresFollowUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !summary.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
            )}
            <Save className="h-4 w-4" />
            Log Communication
          </button>
        </div>
      </div>
    </div>
  );
}