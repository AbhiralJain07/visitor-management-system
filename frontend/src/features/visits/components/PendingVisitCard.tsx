import React from 'react';
import { type Visit, type Visitor, type Office } from '@/types/api.types';
import { Clock, Phone, Briefcase, Building, HelpCircle, FileText, Check, X, Eye } from 'lucide-react';

interface PendingVisitCardProps {
  visit: Visit;
  onApprove: (visit: Visit) => void;
  onReject: (visit: Visit) => void;
  onViewDetails?: (visit: Visit) => void;
  isLoading?: boolean;
}

export const PendingVisitCard: React.FC<PendingVisitCardProps> = ({
  visit,
  onApprove,
  onReject,
  onViewDetails,
  isLoading = false,
}) => {
  const visitor = visit.visitor_id as Visitor;
  const office = visit.office_id as Office;

  const getVisitorName = () => {
    return visitor && typeof visitor === 'object' ? visitor.name : 'Unknown Visitor';
  };

  const getVisitorPhone = () => {
    return visitor && typeof visitor === 'object' ? visitor.phone : 'N/A';
  };

  const getVisitorCompany = () => {
    return visitor && typeof visitor === 'object' ? visitor.company_name || 'Individual' : 'Individual';
  };

  const getVisitorPhoto = () => {
    return visitor && typeof visitor === 'object' ? visitor.photo_url : undefined;
  };

  const getOfficeName = () => {
    return office && typeof office === 'object' ? office.name : 'General Office';
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

  const timeElapsed = (isoString: string) => {
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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow animate-fadeIn duration-200 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header Photo & Name info */}
        <div className="flex items-start space-x-3.5">
          <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-inner flex items-center justify-center text-slate-400">
            {getVisitorPhoto() ? (
              <img src={getVisitorPhoto()} alt={getVisitorName()} className="h-full w-full object-cover" />
            ) : (
              <User size={24} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-slate-800 truncate" title={getVisitorName()}>
              {getVisitorName()}
            </h4>
            <p className="text-[11px] text-slate-500 font-bold truncate flex items-center gap-1 mt-0.5">
              <Briefcase size={10} className="text-slate-400 shrink-0" />
              {getVisitorCompany()}
            </p>
            <p className="text-[11px] text-slate-500 font-bold truncate flex items-center gap-1 mt-0.5">
              <Phone size={10} className="text-slate-400 shrink-0" />
              {getVisitorPhone()}
            </p>
          </div>
        </div>

        {/* Visit Details Grid */}
        <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <HelpCircle size={12} className="text-slate-400 shrink-0" />
            <span>Purpose: <span className="font-bold text-slate-700">{visit.purpose}</span></span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <Building size={12} className="text-slate-400 shrink-0" />
            <span>Office: <span className="font-bold text-slate-700">{getOfficeName()}</span></span>
          </div>

          {visit.notes && (
            <div className="flex items-start gap-2 pt-1 border-t border-slate-200/50 mt-1">
              <FileText size={12} className="text-slate-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                Notes: "{visit.notes}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls & time info */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3">
        {/* Time Stamp */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-slate-400" />
            Req: {formatRequestedTime(visit.check_in)}
          </span>
          <span className="text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded">
            {timeElapsed(visit.check_in)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(visit)}
              disabled={isLoading}
              className="px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center justify-center text-slate-600 active:scale-[0.96]"
              title="View Profile Details"
            >
              <Eye size={14} />
            </button>
          )}

          <button
            onClick={() => onReject(visit)}
            disabled={isLoading}
            className="flex-1 min-h-[44px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-[0.96]"
          >
            <X size={13} />
            Reject
          </button>

          <button
            onClick={() => onApprove(visit)}
            disabled={isLoading}
            className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1 active:scale-[0.96]"
          >
            <Check size={13} />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable user icon
const User: React.FC<{ size: number }> = ({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default PendingVisitCard;
