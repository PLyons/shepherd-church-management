import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export default function InfoCard({
  title,
  icon: Icon,
  children,
  className = '',
}: InfoCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-gray-600" />
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
