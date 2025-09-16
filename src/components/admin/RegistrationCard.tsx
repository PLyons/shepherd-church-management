import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PendingRegistration } from '../../types/registration';

interface RegistrationCardProps {
  registration: PendingRegistration;
  tokens: { [key: string]: string };
  duplicates: { [key: string]: PendingRegistration[] };
  isSelected: boolean;
  isProcessing: boolean;
  isExpanded: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onToggleExpand: (id: string | null) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function RegistrationCard({
  registration,
  tokens,
  duplicates,
  isSelected,
  isProcessing,
  isExpanded,
  onSelect,
  onToggleExpand,
  onApprove,
  onReject,
}: RegistrationCardProps) {
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

  const isDuplicate = duplicates[registration.id];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Checkbox */}
          {registration.approvalStatus === 'pending' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(registration.id, e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}

          {/* Registration Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {registration.firstName} {registration.lastName}
              </h3>
              {getStatusIcon(registration.approvalStatus)}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  registration.approvalStatus
                )}`}
              >
                {registration.approvalStatus.charAt(0).toUpperCase() +
                  registration.approvalStatus.slice(1)}
              </span>
              {isDuplicate && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Duplicate
                </span>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Submitted {formatDate(registration.submittedAt)}
              </div>
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
              {registration.address && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {registration.address.street}, {registration.address.city},{' '}
                  {registration.address.state} {registration.address.zipCode}
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center space-x-4 text-sm">
              <span className="text-gray-500">
                Event: {tokens[registration.tokenId] || 'Unknown'}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  registration.memberStatus === 'member'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {registration.memberStatus === 'member' ? 'Member' : 'Visitor'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {registration.approvalStatus === 'pending' && (
            <>
              <button
                onClick={() => onApprove(registration.id)}
                disabled={isProcessing}
                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => onReject(registration.id)}
                disabled={isProcessing}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => onToggleExpand(isExpanded ? null : registration.id)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {registration.birthdate && (
              <div>
                <span className="font-medium text-gray-900">Birthdate:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(registration.birthdate).toLocaleDateString()}
                </span>
              </div>
            )}
            {registration.gender && (
              <div>
                <span className="font-medium text-gray-900">Gender:</span>
                <span className="ml-2 text-gray-600">
                  {registration.gender}
                </span>
              </div>
            )}
            {registration.maritalStatus && (
              <div>
                <span className="font-medium text-gray-900">
                  Marital Status:
                </span>
                <span className="ml-2 text-gray-600">
                  {registration.maritalStatus}
                </span>
              </div>
            )}
            {registration.occupation && (
              <div>
                <span className="font-medium text-gray-900">Occupation:</span>
                <span className="ml-2 text-gray-600">
                  {registration.occupation}
                </span>
              </div>
            )}
          </div>

          {registration.emergencyContact && (
            <div className="mt-3">
              <span className="font-medium text-gray-900">
                Emergency Contact:
              </span>
              <div className="ml-2 text-gray-600">
                {registration.emergencyContact.name} -{' '}
                {registration.emergencyContact.phone} (
                {registration.emergencyContact.relationship})
              </div>
            </div>
          )}

          {registration.notes && (
            <div className="mt-3">
              <span className="font-medium text-gray-900">Notes:</span>
              <p className="ml-2 text-gray-600">{registration.notes}</p>
            </div>
          )}

          {isDuplicate && (
            <div className="mt-3 p-3 bg-orange-50 rounded-md">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                <span className="font-medium text-orange-900">
                  Possible Duplicates Found
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {isDuplicate.map((dup) => (
                  <div key={dup.id} className="text-orange-800">
                    {dup.firstName} {dup.lastName} - {dup.email || dup.phone} (
                    {dup.approvalStatus})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
