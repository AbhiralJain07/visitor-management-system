import React from 'react';
import { CheckCircle2, Clock, XCircle, LogOut } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'exited' | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm ${className}`}>
          <CheckCircle2 size={13} className="text-emerald-600 animate-pulse" />
          Approved
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm ${className}`}>
          <Clock size={13} className="text-amber-500 animate-spin-slow" />
          Pending Approval
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 shadow-sm ${className}`}>
          <XCircle size={13} className="text-red-500" />
          Rejected
        </span>
      );
    case 'exited':
    case 'checked-out':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60 shadow-sm ${className}`}>
          <LogOut size={13} className="text-slate-500" />
          Checked Out
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm ${className}`}>
          {status}
        </span>
      );
  }
};

export default StatusBadge;
