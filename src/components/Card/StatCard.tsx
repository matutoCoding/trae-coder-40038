import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  status?: 'normal' | 'warning' | 'danger';
  className?: string;
}

export default function StatCard({ title, value, unit, icon: Icon, trend, status = 'normal', className = '' }: StatCardProps) {
  const statusColors = {
    normal: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  };

  return (
    <div className={`card-industrial p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-steel-400 mb-1">{title}</p>
          <div className="flex items-baseline">
            <span className={`font-mono text-2xl font-bold ${statusColors[status]}`}>
              {value}
            </span>
            {unit && <span className="text-sm text-steel-500 ml-1">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-steel-800 ${statusColors[status]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center text-xs">
          <span className={trend.isUp ? 'text-green-400' : 'text-red-400'}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-steel-500 ml-2">较上一班</span>
        </div>
      )}
    </div>
  );
}
