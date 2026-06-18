import React from 'react';
import { type Visitor } from '@/types/api.types';
import { User, Phone, Briefcase, Calendar, ShieldAlert, Award } from 'lucide-react';

interface VisitorProfileProps {
  visitor: Partial<Visitor> | null;
  lastVisitDate?: string | null;
  visitCount?: number;
}

export const VisitorProfile: React.FC<VisitorProfileProps> = ({
  visitor,
  lastVisitDate = null,
  visitCount = 1,
}) => {
  if (!visitor) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm animate-fadeIn">
      <div className="flex items-center space-x-4">
        {/* Photo Container */}
        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-inner">
          {visitor.photo_url ? (
            <img
              src={visitor.photo_url}
              alt={visitor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400">
              <User size={32} />
            </div>
          )}
          {visitor.is_blacklisted && (
            <div className="absolute inset-0 bg-red-600/40 backdrop-blur-[1px] flex items-center justify-center">
              <ShieldAlert className="text-white drop-shadow-md animate-bounce" size={24} />
            </div>
          )}
        </div>

        {/* Basic Header Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-slate-800 truncate flex items-center gap-1.5">
            {visitor.name}
            {visitCount > 3 && (
              <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <Award size={10} /> Frequent
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
            <Phone size={12} className="text-slate-400" />
            {visitor.phone}
          </p>
          <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
            <Briefcase size={12} className="text-slate-400" />
            {visitor.company_name || 'Individual Visitor'}
          </p>
        </div>
      </div>

      {/* Grid of extra metadata */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
        <div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Govt. ID Verification</span>
          <p className="font-bold text-slate-700 mt-0.5">
            {visitor.id_type || 'Aadhar'}: {visitor.id_number}
          </p>
        </div>
        <div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Last Facility Visit</span>
          <p className="font-bold text-slate-700 mt-0.5 flex items-center gap-1">
            <Calendar size={12} className="text-slate-400" />
            {lastVisitDate ? formatDate(lastVisitDate) : 'Today is first visit'}
          </p>
        </div>
      </div>

      {visitor.is_blacklisted && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3 text-xs font-semibold flex items-start space-x-2">
          <ShieldAlert size={16} className="shrink-0 text-red-600 mt-0.5 animate-pulse" />
          <div>
            <p className="text-red-900 font-bold uppercase tracking-wider text-[10px]">⚠️ Security Alert: Blacklisted Guest</p>
            <p className="text-[11px] font-medium text-red-700 mt-0.5">
              Reason: {visitor.blacklist_reason || 'Flagged by office administration.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorProfile;
