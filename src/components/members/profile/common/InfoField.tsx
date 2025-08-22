import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface InfoFieldProps {
  label: string;
  value: string | ReactNode;
  icon: LucideIcon;
  secondary?: boolean;
}

export default function InfoField({ label, value, icon: Icon, secondary = false }: InfoFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${secondary ? 'text-gray-400' : 'text-gray-600'}`} />
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-gray-700">{label}</dt>
        <dd className={`mt-1 text-sm ${secondary ? 'text-gray-500' : 'text-gray-900'}`}>
          {value}
        </dd>
      </div>
    </div>
  );
}