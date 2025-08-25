import { format } from 'date-fns';
import { Phone, Mail, MessageSquare, Video, Users, AlertCircle, Clock } from 'lucide-react';
import { Communication } from '../../../../types/notes';

interface CommunicationsListProps {
  communications: Communication[];
  memberId: string;
}

export function CommunicationsList({ communications }: CommunicationsListProps) {
  const getMethodIcon = (method: Communication['method']) => {
    switch (method) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'video_call':
        return <Video className="h-4 w-4" />;
      case 'in_person':
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: Communication['method']) => {
    switch (method) {
      case 'phone':
        return 'text-green-600 bg-green-100';
      case 'email':
        return 'text-blue-600 bg-blue-100';
      case 'text':
        return 'text-purple-600 bg-purple-100';
      case 'video_call':
        return 'text-indigo-600 bg-indigo-100';
      case 'in_person':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type: Communication['type']) => {
    switch (type) {
      case 'pastoral_call':
        return 'Pastoral Call';
      case 'counseling_session':
        return 'Counseling Session';
      case 'prayer_support':
        return 'Prayer Support';
      case 'administrative':
        return 'Administrative';
      case 'emergency':
        return 'Emergency';
      case 'routine_check_in':
        return 'Routine Check-in';
      case 'event_coordination':
        return 'Event Coordination';
      case 'volunteer_coordination':
        return 'Volunteer Coordination';
      default:
        return type;
    }
  };

  const getTypeColor = (type: Communication['type']) => {
    switch (type) {
      case 'pastoral_call':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'counseling_session':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'prayer_support':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'emergency':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'administrative':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (communications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">💬</div>
        <h3 className="text-sm font-medium text-gray-900">No Communications Yet</h3>
        <p className="text-sm text-gray-500">
          Log your first communication to start tracking member interactions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {communications.map(comm => (
        <div key={comm.id} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                {/* Method Badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(comm.method)}`}>
                  {getMethodIcon(comm.method)}
                  {comm.method.replace('_', ' ')}
                </span>

                {/* Type Badge */}
                <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${getTypeColor(comm.type)}`}>
                  {getTypeLabel(comm.type)}
                </span>

                {/* Direction */}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  comm.direction === 'incoming' 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-blue-600 bg-blue-100'
                }`}>
                  {comm.direction === 'incoming' ? '← Incoming' : '→ Outgoing'}
                </span>

                {/* Follow-up indicator */}
                {comm.requiresFollowUp && !comm.followUpCompleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                    <Clock className="h-3 w-3" />
                    Follow-up needed
                  </span>
                )}
              </div>

              {/* Subject/Summary */}
              {comm.subject && (
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {comm.subject}
                </h4>
              )}
              
              <p className="text-sm text-gray-700 mb-2">
                {comm.summary}
              </p>

              {/* Full Content */}
              {comm.fullContent && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded p-3 mb-2">
                  {comm.fullContent}
                </div>
              )}

              {/* Contact Info */}
              {comm.contactInfo && (
                <div className="text-xs text-gray-500 mb-2">
                  Contact: {comm.contactInfo}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{format(comm.timestamp, 'PPp')}</span>
                {comm.duration && (
                  <span>{comm.duration} minutes</span>
                )}
                <span>Recorded by {comm.recordedByName}</span>
              </div>

              {/* Follow-up Date */}
              {comm.followUpDate && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className={`font-medium ${comm.followUpCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                    Follow-up: {format(comm.followUpDate, 'PP')}
                  </span>
                  {comm.followUpCompleted && (
                    <span className="text-green-600">✓ Completed</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}