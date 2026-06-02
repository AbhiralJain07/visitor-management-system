import React, { useState, useRef, useEffect } from 'react';
import { type Visit, type Visitor } from '@/types/api.types';
import { Bell, Clock, ArrowRight, UserCheck2, RefreshCw } from 'lucide-react';

interface NotificationDropdownProps {
  visits: Visit[];
  onActionClick?: (visit: Visit) => void;
  isLoading?: boolean;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  visits,
  onActionClick,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter only pending requests
  const pendingVisits = visits.filter((v) => v.status === 'pending');

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const getVisitorName = (visit: Visit) => {
    const visitor = visit.visitor_id as Visitor;
    return visitor && typeof visitor === 'object' ? visitor.name : 'Unknown Visitor';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Visitor Request Notifications"
      >
        <Bell size={20} />
        {pendingVisits.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4.5 min-w-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-white animate-pulse">
            {pendingVisits.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-45 animate-fadeIn">
          {/* Header */}
          <div className="bg-slate-50 p-4 border-b border-slate-150 flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bell size={13} className="text-blue-600" />
              Visitor Requests
            </h4>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              {pendingVisits.length} awaiting
            </span>
          </div>

          {/* List Content */}
          <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5 text-xs">
                <RefreshCw size={16} className="animate-spin text-blue-500" />
                <span>Checking requests...</span>
              </div>
            ) : pendingVisits.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-1">
                <UserCheck2 size={24} className="mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">All clear!</p>
                <p className="text-[10px] text-slate-400">No pending entry approvals.</p>
              </div>
            ) : (
              pendingVisits.map((visit) => (
                <div
                  key={visit._id}
                  onClick={() => {
                    if (onActionClick) {
                      onActionClick(visit);
                      setIsOpen(false);
                    }
                  }}
                  className="p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start space-x-3 text-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">
                      {getVisitorName(visit)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      wants to meet for: <span className="font-bold text-slate-600">{visit.purpose}</span>
                    </p>
                    <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold uppercase mt-1">
                      <span>Time: {formatTime(visit.check_in)}</span>
                    </div>
                  </div>
                  <span className="text-blue-500 shrink-0 self-center hover:translate-x-0.5 transition-transform">
                    <ArrowRight size={14} />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
