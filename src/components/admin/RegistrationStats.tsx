import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface RegistrationStatsProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function RegistrationStats({ stats }: RegistrationStatsProps) {
  const statItems = [
    {
      label: 'Total',
      value: stats.total,
      icon: Users,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-600',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`${item.bgColor} rounded-lg p-4`}>
            <div className="flex items-center">
              <Icon className={`w-8 h-8 ${item.iconColor}`} />
              <div className="ml-3">
                <p className={`text-2xl font-semibold ${item.textColor}`}>
                  {item.value}
                </p>
                <p className={`text-sm ${item.textColor}`}>{item.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}