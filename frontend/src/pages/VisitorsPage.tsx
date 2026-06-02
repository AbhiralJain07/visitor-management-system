import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVisitors, useVisits } from '@/features/tenant-admin/api/queryHooks';
import { useAuthStore } from '@/store/authStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blacklistFormSchema, type BlacklistFormValues } from '@/features/tenant-admin/schemas';
import { Search, ShieldAlert, ShieldCheck, X, Calendar, Clock, AlertTriangle, Eye, ArrowRight, User } from 'lucide-react';

export const VisitorsPage: React.FC = () => {
  const { user } = useAuthStore();
  const canModifyBlacklist = ['admin', 'manager', 'receptionist'].includes(user?.role || '');

  const [searchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [blacklistFilter, setBlacklistFilter] = useState<'all' | 'whitelisted' | 'blacklisted'>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { visitors, pagination, isLoading: visitorsLoading, updateVisitor } = useVisitors({
    page,
    limit,
    search: searchQuery,
    is_blacklisted: blacklistFilter === 'all' ? 'all' : blacklistFilter === 'blacklisted' ? true : false,
  });
  const { visits, isLoading: visitsLoading } = useVisits();

  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, blacklistFilter]);

  // Blacklist Reason Modal State
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [visitorToBlacklist, setVisitorToBlacklist] = useState<any | null>(null);

  // Sync search input with Ctrl+K query parameters
  useEffect(() => {
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [qParam]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlacklistFormValues>({
    resolver: zodResolver(blacklistFormSchema),
    defaultValues: {
      reason: '',
    },
  });

  // Filtered visitors
  const filteredVisitors = visitors;

  // Visitor history logs timeline
  const visitorHistory = useMemo(() => {
    if (!selectedVisitor || !visits) return [];
    
    return visits
      .filter((v) => {
        const visId = typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id._id : v.visitor_id;
        return visId === selectedVisitor._id;
      })
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());
  }, [selectedVisitor, visits]);

  // Trigger blacklist action
  const handleOpenBlacklistModal = (visitor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisitorToBlacklist(visitor);
    reset({ reason: '' });
    setBlacklistModalOpen(true);
  };

  // Submit blacklist reason
  const onBlacklistSubmit = async (data: BlacklistFormValues) => {
    if (!visitorToBlacklist) return;
    try {
      await updateVisitor({
        id: visitorToBlacklist._id,
        payload: {
          is_blacklisted: true,
          blacklist_reason: data.reason,
        },
      });

      // Update selected visitor view if open
      if (selectedVisitor?._id === visitorToBlacklist._id) {
        setSelectedVisitor((prev: any) => ({
          ...prev,
          is_blacklisted: true,
          blacklist_reason: data.reason,
        }));
      }

      setBlacklistModalOpen(false);
      setVisitorToBlacklist(null);
    } catch (err) {
      console.error('Failed to blacklist visitor:', err);
    }
  };

  // Whitelist/Unblacklist action
  const handleWhitelist = async (visitor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove the blacklist flag for ${visitor.name}?`)) {
      try {
        await updateVisitor({
          id: visitor._id,
          payload: {
            is_blacklisted: false,
            blacklist_reason: '',
          },
        });

        if (selectedVisitor?._id === visitor._id) {
          setSelectedVisitor((prev: any) => ({
            ...prev,
            is_blacklisted: false,
            blacklist_reason: '',
          }));
        }
      } catch (err) {
        console.error('Failed to whitelist visitor:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Visitors Directory</h1>
        <p className="text-sm text-slate-500">View registered visitor database profiles, blacklist flag rules, and attendance logs.</p>
      </div>

      {/* Filters Panel */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by visitor name, phone, government ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-mono font-bold"
            >
              x
            </button>
          )}
        </div>

        {/* Blacklist Filter Toggles */}
        <div className="flex items-center space-x-1.5 self-start md:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setBlacklistFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              blacklistFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setBlacklistFilter('whitelisted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              blacklistFilter === 'whitelisted' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Whitelisted
          </button>
          <button
            onClick={() => setBlacklistFilter('blacklisted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              blacklistFilter === 'blacklisted' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Blacklisted
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Visitors Table Panel */}
        <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${selectedVisitor ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all duration-300`}>
          {/* Desktop/Tablet Table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Visitor Profile</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">ID Number</th>
                  <th className="px-6 py-4">Security Flag</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium font-sans">
                {visitorsLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      Loading registered visitor database...
                    </td>
                  </tr>
                ) : filteredVisitors.length > 0 ? (
                  filteredVisitors.map((visitor) => (
                    <tr
                      key={visitor._id}
                      onClick={() => setSelectedVisitor(visitor)}
                      className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                        selectedVisitor?._id === visitor._id ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                          {visitor.photo_url ? (
                            <img src={visitor.photo_url} alt={visitor.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={14} className="text-slate-400" />
                          )}
                        </div>
                        <span className="truncate max-w-[150px]">{visitor.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{visitor.phone}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono font-semibold">{visitor.id_number}</td>
                      <td className="px-6 py-4">
                        {visitor.is_blacklisted ? (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 uppercase">
                            <ShieldAlert size={10} className="shrink-0" />
                            Blacklisted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 uppercase">
                            <ShieldCheck size={10} className="shrink-0" />
                            Clean
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisitor(visitor);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all animate-fadeIn"
                            title="View logs"
                          >
                            <Eye size={14} />
                          </button>
                          {canModifyBlacklist && (
                            visitor.is_blacklisted ? (
                              <button
                                onClick={(e) => handleWhitelist(visitor, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 border border-transparent hover:border-green-100 transition-all"
                                title="Approve/Whitelist"
                              >
                                <ShieldCheck size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleOpenBlacklistModal(visitor, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                title="Restrict/Blacklist"
                              >
                                <ShieldAlert size={14} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 space-y-2">
                      <AlertTriangle className="mx-auto text-slate-300" size={24} />
                      <p className="text-xs font-semibold">No visitor records found</p>
                      <p className="text-[10px] text-slate-400 font-medium">Verify Gov ID or Name parameter checks.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list view */}
          <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/20">
            {visitorsLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Loading registered visitor database...
              </div>
            ) : filteredVisitors.length > 0 ? (
              filteredVisitors.map((visitor) => (
                <div
                  key={visitor._id}
                  onClick={() => setSelectedVisitor(visitor)}
                  className={`p-4 space-y-3 hover:bg-slate-50/60 cursor-pointer transition-colors ${
                    selectedVisitor?._id === visitor._id ? 'bg-blue-50/20 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                        {visitor.photo_url ? (
                          <img src={visitor.photo_url} alt={visitor.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={14} className="text-slate-400" />
                        )}
                      </div>
                      <span className="font-bold text-slate-850 text-xs truncate max-w-[150px]">{visitor.name}</span>
                    </div>
                    <div>
                      {visitor.is_blacklisted ? (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 uppercase">
                          <ShieldAlert size={10} className="shrink-0" />
                          Blacklist
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 uppercase">
                          <ShieldCheck size={10} className="shrink-0" />
                          Clean
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Phone Number</span>
                      <span>{visitor.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Government ID</span>
                      <span className="font-mono font-bold text-slate-700">{visitor.id_number}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVisitor(visitor);
                      }}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-xs transition-colors"
                    >
                      <Eye size={13} />
                      View Logs
                    </button>
                    {canModifyBlacklist && (
                      visitor.is_blacklisted ? (
                        <button
                          onClick={(e) => handleWhitelist(visitor, e)}
                          className="flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 bg-green-50 border border-green-200 hover:bg-green-100 rounded-xl text-green-700 font-bold text-xs transition-colors"
                        >
                          <ShieldCheck size={13} />
                          Whitelist
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOpenBlacklistModal(visitor, e)}
                          className="flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl text-red-700 font-bold text-xs transition-colors"
                        >
                          <ShieldAlert size={13} />
                          Blacklist
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <AlertTriangle className="mx-auto text-slate-300" size={24} />
                <p className="text-xs font-semibold">No visitor records found</p>
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-slate-600 transition-all font-semibold min-h-[36px]"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-600 font-semibold">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-slate-600 transition-all font-semibold min-h-[36px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Backdrop for Mobile/Tablet overlay details drawer */}
        {selectedVisitor && (
          <div
            onClick={() => setSelectedVisitor(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Visitor Drawer (Details & History logs timeline) */}
        {selectedVisitor && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-2xl space-y-6 animate-slideIn fixed inset-x-0 bottom-0 top-16 md:inset-y-0 md:right-0 md:left-auto md:w-[460px] lg:relative lg:inset-auto lg:w-auto lg:col-span-1 z-50 overflow-y-auto custom-scrollbar shadow-blue-500/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800">Visitor Profile</h2>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-405 hover:text-slate-600 transition-colors font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 shrink-0 overflow-hidden">
                  {selectedVisitor.photo_url ? (
                    <img src={selectedVisitor.photo_url} alt={selectedVisitor.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{selectedVisitor.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">Gov ID: {selectedVisitor.id_number}</p>
                </div>
              </div>

              {selectedVisitor.is_blacklisted && (
                <div className="bg-red-50 text-red-950 p-3 rounded-xl border border-red-200 text-[10px] font-medium leading-relaxed">
                  <span className="font-extrabold block text-red-700 uppercase tracking-wider mb-1">⚠️ Restricted Account:</span>
                  Reason: {selectedVisitor.blacklist_reason || 'No specific security comments logged.'}
                </div>
              )}

              {/* Attendance Log History Timeline */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-in Attendance Timeline</h4>
                <div className="max-h-[180px] overflow-y-auto custom-scrollbar space-y-3.5 pl-1.5">
                  {visitsLoading ? (
                    <div className="text-[10px] text-slate-400 py-3">Fetching logs...</div>
                  ) : visitorHistory.length > 0 ? (
                    visitorHistory.map((h, i) => (
                      <div key={h._id} className="relative pl-4 border-l border-slate-200 last:border-transparent">
                        <span className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-slate-300"></span>
                        <div className="text-[10px] font-semibold text-slate-800 flex items-center justify-between">
                          <span>{h.purpose}</span>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{h.status}</span>
                        </div>
                        <div className="text-[8px] text-slate-400 mt-1 flex items-center space-x-1.5">
                          <Calendar size={10} />
                          <span>{new Date(h.check_in).toLocaleDateString()}</span>
                          <Clock size={10} className="ml-1" />
                          <span>{new Date(h.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 py-3">No check-in logs registered for this visitor.</div>
                  )}
                </div>
              </div>

              {canModifyBlacklist && (
                <div className="border-t border-slate-100 pt-4">
                  {selectedVisitor.is_blacklisted ? (
                    <button
                      onClick={(e) => handleWhitelist(selectedVisitor, e)}
                      className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-xl transition-all shadow cursor-pointer"
                    >
                      <ShieldCheck size={14} />
                      Remove Blacklist Flag
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleOpenBlacklistModal(selectedVisitor, e)}
                      className="w-full flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                    >
                      <ShieldAlert size={14} />
                      Flag / Blacklist Account
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Blacklist Reason dialog modal */}
      {blacklistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setBlacklistModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />

          {/* Dialog Body */}
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                <ShieldAlert size={14} />
                Flag Visitor Account
              </h2>
              <button
                onClick={() => setBlacklistModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onBlacklistSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-800">
                  Provide safety details or reasons to restrict <span className="font-bold text-red-600">{visitorToBlacklist?.name}</span>:
                </p>
                <textarea
                  rows={3}
                  placeholder="e.g. Unruly behavior or flagged by corporate administration."
                  {...register('reason')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none mt-1.5"
                />
                {errors.reason && <p className="text-[10px] text-red-600 font-semibold">{errors.reason.message}</p>}
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setBlacklistModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/10"
                >
                  Confirm Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsPage;
