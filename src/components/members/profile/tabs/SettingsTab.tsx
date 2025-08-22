import { Settings } from 'lucide-react';

export default function SettingsTab() {
  return (
    <div className="py-6">
      <div className="text-center">
        <Settings className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Member Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Permissions and preferences management.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Coming in future PRPs
        </p>
      </div>
    </div>
  );
}