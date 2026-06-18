import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useVisits, useOffices } from '@/features/tenant-admin/api/queryHooks';
import { type Visit, type Visitor, type Office } from '@/types/api.types';
import { StatsCard } from '@/components/common/StatsCard';
import { PendingVisitCard } from '@/features/visits/components/PendingVisitCard';
import { VisitorCard } from '@/features/visitors/components/VisitorCard';
import { ApprovalDialog } from '@/features/visits/components/ApprovalDialog';
import { RejectionDialog } from '@/features/visits/components/RejectionDialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Users,
  CheckSquare,
  XSquare,
  Calendar,
  Clock,
  Search,
  Eye,
  Building,
  Filter,
  CheckCircle,
  HelpCircle,
  FileText,
  User,
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Active Tab: 'overview' | 'pending' | 'today' | 'history'
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'today' | 'history'>('overview');

  // Dialog management
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | 'details' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Filters for Today's Visits
  const [todaySearch, setTodaySearch] = useState('');
  const [todayOfficeId, setTodayOfficeId] = useState('all');
  const [todayStatus, setTodayStatus] = useState('all');

  // Filters for Visit History
  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 6;

  // React Query hooks for host specific visits (host_id === user.id)
  const { visits, isLoading: isVisitsLoading, refetch: refetchVisits } = useVisits({
    host_id: user?.id,
  });
  const { offices, isLoading: isOfficesLoading } = useOffices();
  const { updateVisit } = useVisits();

  const handleAction = (visit: Visit, mode: 'approve' | 'reject' | 'details') => {
    setSelectedVisit(visit);
    setDialogMode(mode);
  };

  const handleCloseDialog = () => {
    setSelectedVisit(null);
    setDialogMode(null);
  };

  const handleApproveConfirm = async (comment?: string) => {
    if (!selectedVisit) return;
    setIsUpdatingStatus(true);
    try {
      await updateVisit({
        id: selectedVisit._id,
        payload: {
          status: 'approved',
          notes: comment || selectedVisit.notes,
        },
      });
      handleCloseDialog();
      refetchVisits();
    } catch (err) {
      console.error('Failed to approve visitor:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedVisit) return;
    setIsUpdatingStatus(true);
    try {
      await updateVisit({
        id: selectedVisit._id,
        payload: {
          status: 'rejected',
          reason: reason,
        },
      });
      handleCloseDialog();
      refetchVisits();
    } catch (err) {
      console.error('Failed to reject visitor:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Date checkers
  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isThisMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Statistics calculation
  const stats = useMemo(() => {
    if (!visits) return { pending: 0, approvedToday: 0, rejectedToday: 0, totalMonth: 0 };

    const pending = visits.filter(v => v.status === 'pending').length;
    
    const approvedToday = visits.filter(
      v => (v.status === 'approved' || v.status === 'exited') && isToday(v.check_in)
    ).length;

    const rejectedToday = visits.filter(
      v => v.status === 'rejected' && isToday(v.updatedAt || v.check_in)
    ).length;

    const totalMonth = visits.filter(v => isThisMonth(v.check_in)).length;

    return { pending, approvedToday, rejectedToday, totalMonth };
  }, [visits]);

  // Today's approved & active visitors computation
  const filteredTodayVisits = useMemo(() => {
    if (!visits) return [];

    return visits.filter(v => {
      // Must be checked in today or approved today
      if (!isToday(v.check_in)) return false;

      // Cannot be pending approval or rejected
      if (v.status === 'pending' || v.status === 'rejected') return false;

      const visitorName = typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id.name.toLowerCase() : '';
      const visitorCompany = typeof v.visitor_id === 'object' && v.visitor_id !== null ? (v.visitor_id.company_name || '').toLowerCase() : '';
      const officeIdStr = typeof v.office_id === 'object' && v.office_id !== null ? v.office_id._id : v.office_id;

      // Name search
      if (todaySearch.trim() && !visitorName.includes(todaySearch.toLowerCase()) && !visitorCompany.includes(todaySearch.toLowerCase())) {
        return false;
      }

      // Office filter
      if (todayOfficeId !== 'all' && officeIdStr !== todayOfficeId) {
        return false;
      }

      // Status filter
      if (todayStatus !== 'all' && v.status !== todayStatus) {
        return false;
      }

      return true;
    });
  }, [visits, todaySearch, todayOfficeId, todayStatus]);

  // History logs computation
  const filteredHistoryVisits = useMemo(() => {
    if (!visits) return { data: [], total: 0, totalPages: 0 };

    let items = visits.filter(v => v.status !== 'pending'); // Exclude current queue

    // Search query matches
    if (historySearch.trim()) {
      const query = historySearch.toLowerCase();
      items = items.filter(v => {
        const visitorName = typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id.name.toLowerCase() : '';
        const visitorPhone = typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id.phone : '';
        return visitorName.includes(query) || visitorPhone.includes(query);
      });
    }

    // Date range matches
    if (historyStartDate) {
      items = items.filter(v => new Date(v.check_in) >= new Date(historyStartDate));
    }
    if (historyEndDate) {
      const endLimit = new Date(historyEndDate);
      endLimit.setHours(23, 59, 59, 999);
      items = items.filter(v => new Date(v.check_in) <= endLimit);
    }

    const total = items.length;
    const skip = (historyPage - 1) * historyLimit;
    const paginated = items.slice(skip, skip + historyLimit);

    return {
      data: paginated,
      total,
      totalPages: Math.ceil(total / historyLimit),
    };
  }, [visits, historySearch, historyStartDate, historyEndDate, historyPage]);

  // Decouple names helpers
  const getVisitorName = (visit: Visit) => {
    const visitor = visit.visitor_id as Visitor;
    return visitor && typeof visitor === 'object' ? visitor.name : 'Unknown Visitor';
  };

  const getVisitorCompany = (visit: Visit) => {
    const visitor = visit.visitor_id as Visitor;
    return visitor && typeof visitor === 'object' ? visitor.company_name || 'Individual' : 'Individual';
  };

  const getVisitorPhoto = (visit: Visit) => {
    const visitor = visit.visitor_id as Visitor;
    return visitor && typeof visitor === 'object' ? visitor.photo_url : undefined;
  };

  const formatVisitDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatVisitTime = (isoString?: string | null) => {
    if (!isoString) return '--:--';
    try {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '--:--';
    }
  };

  const pendingQueue = useMemo(() => {
    if (!visits) return [];
    return visits.filter(v => v.status === 'pending');
  }, [visits]);

  return (
    <div className="space-y-6">
      {/* Top Banner Host Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Welcome back, {user?.name || 'Employee'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Role: <span className="font-bold capitalize text-blue-600">{user?.role}</span> | Department: {user?.email.split('@')[0]} Group
          </p>
        </div>

        {/* Tab selection pill */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-250 shrink-0 gap-1 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'
            }`}
          >
            Pending
            {pendingQueue.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-pulse">
                {pendingQueue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-800'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW PANELS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Pending Approvals"
              value={stats.pending}
              icon={Clock}
              color="amber"
              description="Awaiting host response"
            />
            <StatsCard
              title="Approved Today"
              value={stats.approvedToday}
              icon={CheckSquare}
              color="emerald"
              description="Guests allowed entry today"
            />
            <StatsCard
              title="Rejected Today"
              value={stats.rejectedToday}
              icon={XSquare}
              color="red"
              description="Visits denied today"
            />
            <StatsCard
              title="Total Visits (Month)"
              value={stats.totalMonth}
              icon={Calendar}
              color="blue"
              description="Total logs this month"
            />
          </div>

          {/* Quick feeds split panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requests queue */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock size={16} className="text-amber-500" />
                Recent Pending Requests
              </h3>

              {isVisitsLoading ? (
                <LoadingSkeleton type="row" count={2} />
              ) : pendingQueue.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1.5">
                  <CheckCircle size={26} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-semibold">Your verification queue is clear!</p>
                  <p className="text-[10px]">New guest alerts will pop up here.</p>
                </div>
              ) : (
                <div className="grid gap-3.5">
                  {pendingQueue.slice(0, 2).map((visit) => (
                    <PendingVisitCard
                      key={visit._id}
                      visit={visit}
                      onApprove={(v) => handleAction(v, 'approve')}
                      onReject={(v) => handleAction(v, 'reject')}
                      onViewDetails={(v) => handleAction(v, 'details')}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Approvals list */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CheckSquare size={16} className="text-emerald-500" />
                Recent Approved Visitor Log
              </h3>

              {isVisitsLoading ? (
                <LoadingSkeleton type="row" count={2} />
              ) : visits?.filter(v => v.status === 'approved' || v.status === 'exited').length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <Users size={26} className="mx-auto text-slate-355" />
                  <p className="text-xs font-semibold">No recent approvals recorded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits
                    ?.filter(v => v.status === 'approved' || v.status === 'exited')
                    .slice(0, 3)
                    .map((visit) => (
                      <div
                        key={visit._id}
                        onClick={() => handleAction(visit, 'details')}
                        className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-150 cursor-pointer transition-colors"
                      >
                        <div className="h-9 w-9 bg-slate-200 border border-slate-300 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-slate-500">
                          {getVisitorPhoto(visit) ? (
                            <img src={getVisitorPhoto(visit)} alt={getVisitorName(visit)} className="object-cover h-full w-full" />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{getVisitorName(visit)}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                            {getVisitorCompany(visit)} | Purpose: {visit.purpose}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <StatusBadge status={visit.status} />
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">
                            {formatVisitTime(visit.check_in)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS GRID */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Awaiting Decision</h3>

          {isVisitsLoading ? (
            <LoadingSkeleton type="card" count={3} />
          ) : pendingQueue.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 space-y-2.5 max-w-md mx-auto shadow-sm">
              <CheckCircle size={36} className="mx-auto text-emerald-500" />
              <div>
                <p className="text-sm font-extrabold text-slate-700">Verification Queue Cleared</p>
                <p className="text-xs text-slate-400 mt-1">You have no visitor approvals waiting decision.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pendingQueue.map((visit) => (
                <PendingVisitCard
                  key={visit._id}
                  visit={visit}
                  onApprove={(v) => handleAction(v, 'approve')}
                  onReject={(v) => handleAction(v, 'reject')}
                  onViewDetails={(v) => handleAction(v, 'details')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TODAY'S VISITS LOG TABLE */}
      {activeTab === 'today' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Header search controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 shrink-0">Today's Visits Log</h3>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-56">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><Search size={14} /></span>
                <input
                  type="text"
                  placeholder="Filter guest or company..."
                  value={todaySearch}
                  onChange={(e) => setTodaySearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-250 rounded-xl pl-8 pr-4 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Office Selector */}
              <select
                value={todayOfficeId}
                onChange={(e) => setTodayOfficeId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All Offices</option>
                {offices?.map((off) => (
                  <option key={off._id} value={off._id}>{off.name}</option>
                ))}
              </select>

              {/* Status Selector */}
              <select
                value={todayStatus}
                onChange={(e) => setTodayStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-250 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="exited">Checked Out</option>
              </select>
            </div>
          </div>

          {/* Visitor logs content list */}
          {isVisitsLoading ? (
            <LoadingSkeleton type="row" count={3} />
          ) : filteredTodayVisits.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1.5">
              <Users size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No today's logs matched the filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar border border-slate-150 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-bold uppercase tracking-wider">
                    <th className="p-3">Visitor Name</th>
                    <th className="p-3">Company</th>
                    <th className="p-3">Visit Purpose</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTodayVisits.map((visit) => (
                    <tr key={visit._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800 flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center text-slate-400">
                          {getVisitorPhoto(visit) ? (
                            <img src={getVisitorPhoto(visit)} alt={getVisitorName(visit)} className="object-cover h-full w-full" />
                          ) : (
                            <User size={12} />
                          )}
                        </div>
                        <span className="truncate">{getVisitorName(visit)}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-semibold">{getVisitorCompany(visit)}</td>
                      <td className="p-3 text-slate-500 font-semibold">{visit.purpose}</td>
                      <td className="p-3 font-semibold text-slate-600">{formatVisitTime(visit.check_in)}</td>
                      <td className="p-3 font-semibold text-slate-400">{formatVisitTime(visit.check_out)}</td>
                      <td className="p-3"><StatusBadge status={visit.status} /></td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleAction(visit, 'details')}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VISIT HISTORY PANELS */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Header search controls */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 shrink-0">Past Visitor Interactions</h3>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-52">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400"><Search size={14} /></span>
                <input
                  type="text"
                  placeholder="Visitor name or phone..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-250 rounded-xl pl-8 pr-4 py-2 focus:outline-none"
                />
              </div>

              {/* Start Date */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">From:</span>
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => {
                    setHistoryStartDate(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                />
              </div>

              {/* End Date */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">To:</span>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => {
                    setHistoryEndDate(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* History log content table */}
          {isVisitsLoading ? (
            <LoadingSkeleton type="row" count={3} />
          ) : filteredHistoryVisits.data.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Calendar size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No visitor logs found matching the parameters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto custom-scrollbar border border-slate-150 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-bold uppercase tracking-wider">
                      <th className="p-3">Visit Date</th>
                      <th className="p-3">Visitor Name</th>
                      <th className="p-3">Purpose</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">In-Time</th>
                      <th className="p-3">Out-Time</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistoryVisits.data.map((visit) => (
                      <tr key={visit._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-700">{formatVisitDate(visit.check_in)}</td>
                        <td className="p-3 font-bold text-slate-800 flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center text-slate-400">
                            {getVisitorPhoto(visit) ? (
                              <img src={getVisitorPhoto(visit)} alt={getVisitorName(visit)} className="object-cover h-full w-full" />
                            ) : (
                              <User size={12} />
                            )}
                          </div>
                          <span className="truncate">{getVisitorName(visit)}</span>
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{visit.purpose}</td>
                        <td className="p-3"><StatusBadge status={visit.status} /></td>
                        <td className="p-3 font-semibold text-slate-600">{formatVisitTime(visit.check_in)}</td>
                        <td className="p-3 font-semibold text-slate-400">{formatVisitTime(visit.check_out)}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleAction(visit, 'details')}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {filteredHistoryVisits.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">
                    Page {historyPage} of {filteredHistoryVisits.totalPages} ({filteredHistoryVisits.total} logs)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHistoryPage(p => Math.max(p - 1, 1))}
                      disabled={historyPage === 1}
                      className="px-3.5 py-2 text-xs font-bold text-slate-650 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setHistoryPage(p => Math.min(p + 1, filteredHistoryVisits.totalPages))}
                      disabled={historyPage === filteredHistoryVisits.totalPages}
                      className="px-3.5 py-2 text-xs font-bold text-slate-650 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog overlays */}
      <ApprovalDialog
        isOpen={dialogMode === 'approve'}
        onClose={handleCloseDialog}
        onConfirm={handleApproveConfirm}
        visitorName={selectedVisit ? getVisitorName(selectedVisit) : ''}
        isLoading={isUpdatingStatus}
      />

      <RejectionDialog
        isOpen={dialogMode === 'reject'}
        onClose={handleCloseDialog}
        onConfirm={handleRejectConfirm}
        visitorName={selectedVisit ? getVisitorName(selectedVisit) : ''}
        isLoading={isUpdatingStatus}
      />

      {/* Details drawer modal overlay */}
      {dialogMode === 'details' && selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                Visit Log Details
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors text-sm font-mono"
              >
                X
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-100">
                <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400">
                  {getVisitorPhoto(selectedVisit) ? (
                    <img src={getVisitorPhoto(selectedVisit)} alt={getVisitorName(selectedVisit)} className="h-full w-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{getVisitorName(selectedVisit)}</h4>
                  <p className="text-slate-500 font-semibold">{getVisitorCompany(selectedVisit)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Status</span>
                  <div className="pt-0.5"><StatusBadge status={selectedVisit.status} /></div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purpose of Visit</span>
                  <p className="font-bold text-slate-700 mt-0.5">{selectedVisit.purpose}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-In Time</span>
                  <p className="font-bold text-slate-700 mt-0.5">{formatVisitTime(selectedVisit.check_in)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-Out Time</span>
                  <p className="font-bold text-slate-700 mt-0.5">{formatVisitTime(selectedVisit.check_out)}</p>
                </div>
              </div>

              {selectedVisit.notes && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reception Notes</span>
                  <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-slate-600 leading-relaxed italic">
                    "{selectedVisit.notes}"
                  </p>
                </div>
              )}

              {selectedVisit.status === 'rejected' && selectedVisit.reason && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rejection Reason</span>
                  <p className="bg-red-50/50 p-2.5 rounded-lg border border-red-150 text-red-700 leading-relaxed font-semibold">
                    "{selectedVisit.reason}"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-right">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors active:scale-[0.98]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
