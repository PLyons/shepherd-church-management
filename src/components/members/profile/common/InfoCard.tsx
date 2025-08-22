import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export default function InfoCard({ title, icon: Icon, children, className = '' }: InfoCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}