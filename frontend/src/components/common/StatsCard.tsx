import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'blue',
}) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 border-emerald-100',
          text: 'text-emerald-700',
          iconBg: 'bg-emerald-100/80 text-emerald-600',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 border-amber-100',
          text: 'text-amber-700',
          iconBg: 'bg-amber-100/80 text-amber-600',
        };
      case 'red':
        return {
          bg: 'bg-red-50 border-red-100',
          text: 'text-red-700',
          iconBg: 'bg-red-100/80 text-red-600',
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 border-purple-100',
          text: 'text-purple-700',
          iconBg: 'bg-purple-100/80 text-purple-600',
        };
      case 'slate':
        return {
          bg: 'bg-slate-50 border-slate-200/60',
          text: 'text-slate-700',
          iconBg: 'bg-slate-100 text-slate-500',
        };
      case 'blue':
      default:
        return {
          bg: 'bg-blue-50 border-blue-100',
          text: 'text-blue-700',
          iconBg: 'bg-blue-100/80 text-blue-600',
        };
    }
  };

  const styles = getColorStyles();

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm flex items-start justify-between transition-all hover:shadow-md duration-200 ${styles.bg}`}>
      <div className="space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-[11px] text-slate-500 font-medium pt-0.5">
            {trend && (
              <span className={`font-bold mr-1 ${
                trend.type === 'up' ? 'text-emerald-600' : trend.type === 'down' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {trend.value}
              </span>
            )}
            {description}
          </p>
        )}
      </div>

      <div className={`p-3 rounded-xl ${styles.iconBg} shrink-0`}>
        <Icon size={20} />
      </div>
    </div>
  );
};

export default StatsCard;
