import React from 'react';
import { type Visit, type Visitor, type Employee } from '@/types/api.types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Clock, User, Briefcase, HelpCircle } from 'lucide-react';

interface ApprovalCardProps {
  visit: Visit;
  onViewDetails?: (visit: Visit) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ visit, onViewDetails }) => {
  const visitor = visit.visitor_id as Visitor;
  const host = visit.host_id as Employee;

  const getVisitorName = () => {
    return visitor && typeof visitor === 'object' ? visitor.name : 'Unknown Visitor';
  };

  const getVisitorCompany = () => {
    return visitor && typeof visitor === 'object' ? visitor.company_name || 'Individual' : 'Individual';
  };

  const getHostName = () => {
    return host && typeof host === 'object' ? host.name : 'Unknown Employee';
  };

  const formatRequestedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  const timeElapsedStr = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins === 0) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ${diffMins % 60}m ago`;
    } catch {
      return '';
    }
  };

  const getBorderColor = () => {
    switch (visit.status) {
      case 'approved':
        return 'border-l-4 border-l-emerald-500';
      case 'rejected':
        return 'border-l-4 border-l-red-500';
      case 'pending':
      default:
        return 'border-l-4 border-l-amber-500';
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between ${getBorderColor()} hover:shadow-md transition-shadow animate-fadeIn duration-200`}>
      <div className="space-y-2.5">
        {/* Visitor name & Status Row */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h4
              onClick={() => onViewDetails && onViewDetails(visit)}
              className={`text-sm font-extrabold text-slate-800 truncate ${onViewDetails ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
            >
              {getVisitorName()}
            </h4>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
              {getVisitorCompany()}
            </span>
          </div>
          <StatusBadge status={visit.status} className="shrink-0" />
        </div>

        {/* Details list */}
        <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <User size={12} className="text-slate-400 shrink-0" />
            <span>Host: <span className="font-semibold text-slate-800">{getHostName()}</span></span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <HelpCircle size={12} className="text-slate-400 shrink-0" />
            <span>Purpose: <span className="font-semibold text-slate-800">{visit.purpose}</span></span>
          </div>
          {visit.notes && (
            <div className="text-[11px] text-slate-500 italic mt-1 pl-4.5 border-l border-slate-200">
              "{visit.notes}"
            </div>
          )}
        </div>
      </div>

      {/* Footer elapsed time row */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Clock size={11} className="text-slate-400" />
          Req: {formatRequestedTime(visit.check_in)}
        </span>
        <span className={`text-[10px] font-extrabold ${visit.status === 'pending' ? 'text-amber-600' : 'text-slate-500'}`}>
          {timeElapsedStr(visit.check_in)}
        </span>
      </div>
    </div>
  );
};

export default ApprovalCard;
