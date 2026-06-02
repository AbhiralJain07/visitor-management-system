import React from 'react';
import { type Visit, type Visitor, type Employee, type Office } from '@/types/api.types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LogOut, User, Building, Clock, Briefcase } from 'lucide-react';

interface VisitorCardProps {
  visit: Visit;
  onCheckout: (visit: Visit) => void;
  onViewDetails?: (visit: Visit) => void;
  isLoading?: boolean;
}

export const VisitorCard: React.FC<VisitorCardProps> = ({
  visit,
  onCheckout,
  onViewDetails,
  isLoading = false,
}) => {
  const visitor = visit.visitor_id as Visitor;
  const host = visit.host_id as Employee;
  const office = visit.office_id as Office;

  const getVisitorName = () => {
    return visitor && typeof visitor === 'object' ? visitor.name : 'Unknown Visitor';
  };

  const getVisitorCompany = () => {
    return visitor && typeof visitor === 'object' ? visitor.company_name || 'Individual' : 'Individual';
  };

  const getVisitorPhoto = () => {
    return visitor && typeof visitor === 'object' ? visitor.photo_url : undefined;
  };

  const getHostName = () => {
    return host && typeof host === 'object' ? host.name : 'Unknown Employee';
  };

  const getOfficeName = () => {
    return office && typeof office === 'object' ? office.name : 'Unknown Office';
  };

  const formatCheckInTime = (isoString: string) => {
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

  const timeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ${diffMins % 60}m ago`;
    } catch {
      return '';
    }
  };

  const isActive = visit.status === 'approved' && !visit.check_out;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow animate-fadeIn duration-200">
      {/* Upper Info Row */}
      <div className="flex items-start space-x-3">
        {/* Photo Thumbnail */}
        <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          {getVisitorPhoto() ? (
            <img src={getVisitorPhoto()} alt={getVisitorName()} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
              <User size={20} />
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-bold text-slate-800 truncate" title={getVisitorName()}>
              {getVisitorName()}
            </h4>
            <StatusBadge status={visit.status} className="shrink-0" />
          </div>
          
          <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
            <Briefcase size={10} className="text-slate-400 shrink-0" />
            {getVisitorCompany()}
          </p>

          <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
            <User size={10} className="text-slate-400 shrink-0" />
            Host: <span className="font-semibold text-slate-700">{getHostName()}</span>
          </p>

          <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
            <Building size={10} className="text-slate-400 shrink-0" />
            Office: {getOfficeName()}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-3"></div>

      {/* Footer controls */}
      <div className="flex items-center justify-between">
        {/* Timestamps */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <Clock size={11} className="text-slate-400" />
          <span>IN: {formatCheckInTime(visit.check_in)}</span>
          <span className="text-slate-300">•</span>
          <span className="text-blue-500 font-bold">{timeAgo(visit.check_in)}</span>
        </div>

        {/* Action Toggles */}
        <div className="flex gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(visit)}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg transition-colors border border-blue-100"
            >
              Profile
            </button>
          )}

          {isActive && (
            <button
              onClick={() => onCheckout(visit)}
              disabled={isLoading}
              className="text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm hover:shadow active:scale-[0.97]"
            >
              <LogOut size={10} />
              Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorCard;
