import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Phone,
  Mail,
  User,
  VideoIcon,
  Clock,
  Calendar,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Communication } from '../../../../types/notes';
import { notesService } from '../../../../services/firebase/notes.service';
import { CommunicationLogger } from '../components/CommunicationLogger';
import { LoadingSpinner } from '../../../common/LoadingSpinner';

export default function CommunicationsTab() {
  const { id: memberId } = useParams<{ id: string }>();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogger, setShowLogger] = useState(false);

  useEffect(() => {
    if (memberId) {
      loadCommunications();
    }
  }, [memberId]);

  const loadCommunications = async () => {
    if (!memberId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await notesService.getCommunications(memberId);
      setCommunications(data);
    } catch (error) {
      console.error('Error loading communications:', error);
      setError('Failed to load communications');
    } finally {
      setLoading(false);
    }
  };

  const handleCommunicationSaved = (communication: Communication) => {
    setCommunications((prev) => [communication, ...prev]);
  };

  const getMethodIcon = (method: Communication['method']) => {
    switch (method) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'video_call':
        return <VideoIcon className="h-4 w-4" />;
      case 'in_person':
        return <User className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: Communication['type']) => {
    const labels = {
      pastoral_call: 'Pastoral Call',
      counseling_session: 'Counseling Session',
      prayer_support: 'Prayer Support',
      administrative: 'Administrative',
      emergency: 'Emergency',
      routine_check_in: 'Routine Check-in',
      event_coordination: 'Event Coordination',
      volunteer_coordination: 'Volunteer Coordination',
    };
    return labels[type] || type;
  };

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!memberId) {
    return <div>Member ID not found</div>;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Communications</h3>
          <span className="text-sm text-gray-500">
            ({communications.length})
          </span>
        </div>
        <button
          onClick={() => setShowLogger(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Communication
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-600 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Communications List */}
      <div className="space-y-4">
        {communications.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No communications recorded
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by logging your first communication.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowLogger(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Log Communication
              </button>
            </div>
          </div>
        ) : (
          communications.map((communication) => (
            <div
              key={communication.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                    {getMethodIcon(communication.method)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeLabel(communication.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {communication.direction === 'outgoing' ? '→' : '←'}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {communication.method.replace('_', ' ')}
                      </span>
                      {communication.duration && (
                        <span className="text-xs text-gray-500">
                          • {formatDuration(communication.duration)}
                        </span>
                      )}
                    </div>

                    {communication.subject && (
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {communication.subject}
                      </p>
                    )}

                    <p className="text-sm text-gray-700 mb-2">
                      {communication.summary}
                    </p>

                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(communication.timestamp).toLocaleString()}
                      </span>
                      <span>by {communication.recordedByName}</span>
                      {communication.requiresFollowUp && (
                        <span className="flex items-center text-orange-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Follow-up needed
                          {communication.followUpDate && (
                            <span className="ml-1">
                              (
                              {new Date(
                                communication.followUpDate
                              ).toLocaleDateString()}
                              )
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {communication.fullContent && (
                  <button className="flex items-center text-gray-400 hover:text-gray-600 p-1">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Communication Logger Dialog */}
      <CommunicationLogger
        isOpen={showLogger}
        onClose={() => setShowLogger(false)}
        memberId={memberId}
        onSave={handleCommunicationSaved}
      />
    </div>
  );
}
