import { MessageSquare } from 'lucide-react';

export default function CommunicationsTab() {
  return (
    <div className="py-6">
      <div className="text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Communications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Email and message history will appear here.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Coming in PRP-008
        </p>
      </div>
    </div>
  );
}