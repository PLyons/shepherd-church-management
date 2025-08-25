interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
}

export function RejectModal({
  isOpen,
  onClose,
  onReject,
  rejectionReason,
  setRejectionReason,
}: RejectModalProps) {
  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason);
    }
  };

  return (
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
          autoFocus
        />
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rejectionReason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Reject Registration
          </button>
        </div>
      </div>
    </div>
  );
}