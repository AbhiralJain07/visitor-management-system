import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVisits, useEmployees, useOffices } from '@/features/tenant-admin/api/queryHooks';
import { useAuthStore } from '@/store/authStore';
import { Search, Calendar, Clock, Eye, AlertTriangle, FileSpreadsheet, FileText, X, CheckCircle, ArrowRight, LogOut, Check, XCircle } from 'lucide-react';

export const VisitsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isReceptionistOrAdmin = ['admin', 'receptionist'].includes(user?.role || '');

  const [searchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hostFilter, setHostFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { visits, pagination, isLoading: visitsLoading, updateVisit } = useVisits({
    page,
    limit,
    search: searchQuery,
    status: statusFilter,
    host_id: hostFilter,
    startDate,
    endDate,
  });

  const { employees, isLoading: employeesLoading } = useEmployees();
  const { offices, isLoading: officesLoading } = useOffices();

  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, hostFilter, startDate, endDate]);

  // Sync search with URL params
  useEffect(() => {
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [qParam]);

  // Filtered visits list
  const filteredVisits = visits;

  const getVisitorName = (visitor: any) => {
    return typeof visitor === 'object' && visitor !== null ? visitor.name : 'Unknown Visitor';
  };

  const getHostName = (host: any) => {
    return typeof host === 'object' && host !== null ? host.name : 'Unknown Host';
  };

  const getOfficeName = (office: any) => {
    return typeof office === 'object' && office !== null ? office.name : 'Unknown Office';
  };

  // Perform checkout action
  const handleCheckOut = async (visit: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Check out ${getVisitorName(visit.visitor_id)} now?`)) {
      try {
        await updateVisit({
          id: visit._id,
          payload: {
            status: 'exited',
            check_out: new Date().toISOString(),
          },
        });
        if (selectedVisit?._id === visit._id) {
          setSelectedVisit((prev: any) => ({
            ...prev,
            status: 'exited',
            check_out: new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.error('Checkout failed:', err);
      }
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    try {
      const headers = ['Visitor Name', 'Phone', 'Government ID', 'Host Name', 'Office Location', 'Visit Purpose', 'Check-In', 'Check-Out', 'Status'];
      const rows = filteredVisits.map((v) => {
        const vis = typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id : { name: 'Unknown', phone: '', id_number: '' };
        const host = typeof v.host_id === 'object' && v.host_id !== null ? v.host_id : { name: 'Unknown' };
        const office = typeof v.office_id === 'object' && v.office_id !== null ? v.office_id : { name: 'Unknown' };

        return [
          vis.name,
          vis.phone,
          vis.id_number,
          host.name,
          office.name,
          v.purpose,
          new Date(v.check_in).toLocaleString(),
          v.check_out ? new Date(v.check_out).toLocaleString() : 'N/A',
          v.status.toUpperCase(),
        ];
      });

      const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `VMS_Visits_Report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess('CSV spreadsheet export downloaded successfully! Excel is ready. ✅');
      setTimeout(() => setExportSuccess(null), 4000);
      setExportModalOpen(false);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  // Print-based PDF layout window trigger
  const handleExportPDF = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Pop-up blocked! Please allow popups to download PDF reports.');
        return;
      }

      const visitsRowsHTML = filteredVisits
        .map(
          (v) => `
          <tr>
            <td><strong>${getVisitorName(v.visitor_id)}</strong></td>
            <td>${getHostName(v.host_id)}</td>
            <td>${getOfficeName(v.office_id)}</td>
            <td>${v.purpose}</td>
            <td>${new Date(v.check_in).toLocaleString()}</td>
            <td>${v.check_out ? new Date(v.check_out).toLocaleString() : 'Active'}</td>
            <td><span class="badge ${v.status}">${v.status.toUpperCase()}</span></td>
          </tr>`
        )
        .join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>VMS Corporate Attendance Report</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; margin: 40px; }
              header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { font-size: 24px; margin: 0 0 5px 0; color: #1e293b; }
              p.meta { font-size: 11px; color: #64748b; margin: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
              th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
              th { bg-color: #f8fafc; font-weight: bold; color: #475569; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .badge { font-size: 8px; font-weight: bold; padding: 3px 6px; border-radius: 4px; text-transform: uppercase; }
              .badge.approved { background-color: #dcfce7; color: #15803d; }
              .badge.pending { background-color: #fef3c7; color: #b45309; }
              .badge.exited { background-color: #f1f5f9; color: #475569; }
              .badge.rejected { background-color: #fee2e2; color: #b91c1c; }
            </style>
          </head>
          <body>
            <header>
              <h1>Visitor Access Attendance Log</h1>
              <p class="meta">Generated on: ${new Date().toLocaleString()} | Filtered records count: ${filteredVisits.length}</p>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Host Employee</th>
                  <th>Office Location</th>
                  <th>Visit Purpose</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${visitsRowsHTML}
              </tbody>
            </table>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setExportModalOpen(false);
    } catch (err) {
      console.error('PDF export print failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Visits Attendance Log</h1>
          <p className="text-sm text-slate-500">View real-time check-in records, active visitor badges, and export spreadsheets.</p>
        </div>

        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all shrink-0"
        >
          <FileSpreadsheet size={16} />
          <span>Export Records</span>
        </button>
      </div>

      {/* Export status alerts */}
      {exportSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-4 flex items-start space-x-2 shadow-sm animate-fadeIn">
          <Check size={16} className="text-emerald-600 mt-0.5" />
          <span className="text-xs font-medium">{exportSuccess}</span>
        </div>
      )}

      {/* Multi-Filters Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-4 sm:grid-cols-2">
          {/* Search bar */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, host, purpose..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 focus:outline-none placeholder:text-slate-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Host Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Host Employee</label>
            <select
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Employees</option>
              {employeesLoading ? (
                <option value="loading" disabled>Loading employees...</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.department || 'General'})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-in Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Auth</option>
              <option value="approved">Approved / Inside</option>
              <option value="exited">Exited</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Filters</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-[10px] bg-slate-50 text-slate-800 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-[10px] bg-slate-50 text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Clear filters shortcut row */}
        {(searchQuery || statusFilter !== 'all' || hostFilter !== 'all' || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setHostFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Grid: Table vs Drawer Details */}
      <div className="grid gap-6 lg:grid-cols-3 items-start animate-fadeIn">
        {/* Table view panel */}
        <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden ${selectedVisit ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all`}>
          {/* Desktop/Tablet Table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Visitor</th>
                  <th className="px-6 py-4">Host Hostess</th>
                  <th className="px-6 py-4">Purpose</th>
                  <th className="px-6 py-4">Office Realm</th>
                  <th className="px-6 py-4">Check-In</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium font-sans">
                {visitsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      Loading attendance check-ins...
                    </td>
                  </tr>
                ) : filteredVisits.length > 0 ? (
                  filteredVisits.map((visit) => (
                    <tr
                      key={visit._id}
                      onClick={() => setSelectedVisit(visit)}
                      className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                        selectedVisit?._id === visit._id ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {getVisitorName(visit.visitor_id)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{getHostName(visit.host_id)}</td>
                      <td className="px-6 py-4 text-slate-500">{visit.purpose}</td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[130px]">
                        {getOfficeName(visit.office_id)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">
                        {new Date(visit.check_in).toLocaleDateString()} {new Date(visit.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          visit.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                          visit.status === 'exited' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          visit.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            visit.status === 'approved' ? 'bg-green-500' :
                            visit.status === 'exited' ? 'bg-slate-500' :
                            visit.status === 'pending' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}></span>
                          {visit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisit(visit);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                            title="View log details"
                          >
                            <Eye size={14} />
                          </button>
                          {isReceptionistOrAdmin && visit.status === 'approved' && !visit.check_out && (
                            <button
                              onClick={(e) => handleCheckOut(visit, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                              title="Check out visitor"
                            >
                              <LogOut size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 space-y-2">
                      <AlertTriangle className="mx-auto text-slate-300" size={24} />
                      <p className="text-xs font-semibold">No visits logged matching search criteria</p>
                      <p className="text-[10px] text-slate-400 font-medium">Verify parameter criteria filters above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card list view */}
          <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/20">
            {visitsLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Loading attendance check-ins...
              </div>
            ) : filteredVisits.length > 0 ? (
              filteredVisits.map((visit) => (
                <div
                  key={visit._id}
                  onClick={() => setSelectedVisit(visit)}
                  className={`p-4 space-y-3 hover:bg-slate-50/60 cursor-pointer transition-colors ${
                    selectedVisit?._id === visit._id ? 'bg-blue-50/20 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">{getVisitorName(visit.visitor_id)}</span>
                    <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      visit.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      visit.status === 'exited' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      visit.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {visit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Host</span>
                      <span>{getHostName(visit.host_id)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Purpose</span>
                      <span>{visit.purpose}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Location</span>
                      <span className="truncate block max-w-[120px]">{getOfficeName(visit.office_id)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold mb-0.5">Check-In</span>
                      <span>{new Date(visit.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVisit(visit);
                      }}
                      className="flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-xs transition-colors"
                    >
                      <Eye size={13} />
                      View Details
                    </button>
                    {isReceptionistOrAdmin && visit.status === 'approved' && !visit.check_out && (
                      <button
                        onClick={(e) => handleCheckOut(visit, e)}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-1 px-3 py-2 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl text-red-705 font-bold text-xs transition-colors"
                      >
                        <LogOut size={13} />
                        Checkout
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <AlertTriangle className="mx-auto text-slate-300" size={24} />
                <p className="text-xs font-semibold">No visits logged matching search criteria</p>
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
        {selectedVisit && (
          <div
            onClick={() => setSelectedVisit(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Selected Visit Details Drawer */}
        {selectedVisit && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-2xl space-y-6 animate-slideIn fixed inset-x-0 bottom-0 top-16 md:inset-y-0 md:right-0 md:left-auto md:w-[460px] lg:relative lg:inset-auto lg:w-auto lg:col-span-1 z-50 overflow-y-auto custom-scrollbar shadow-blue-500/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800">Visit Check-In Details</h2>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-405 hover:text-slate-600 transition-colors font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Visitor & Host Info */}
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Visitor Profile</h4>
                  <p className="text-sm font-extrabold text-slate-800 mt-1 leading-snug">
                    {getVisitorName(selectedVisit.visitor_id)}
                  </p>
                  {typeof selectedVisit.visitor_id === 'object' && selectedVisit.visitor_id !== null && (
                    <p className="text-[9px] text-slate-400 mt-0.5">Phone: {selectedVisit.visitor_id.phone} | ID: {selectedVisit.visitor_id.id_number}</p>
                  )}
                </div>

                <div className="border-t border-slate-50 pt-3">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Host Employee</h4>
                  <p className="text-xs font-bold text-slate-700 mt-1">{getHostName(selectedVisit.host_id)}</p>
                  {typeof selectedVisit.host_id === 'object' && selectedVisit.host_id !== null && (
                    <p className="text-[9px] text-slate-400">Dept: {selectedVisit.host_id.department || 'General'} | Email: {selectedVisit.host_id.email}</p>
                  )}
                </div>
              </div>

              {/* Visit Details */}
              <div className="border-t border-slate-50 pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purpose of Visit</h4>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedVisit.purpose}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location Site</h4>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{getOfficeName(selectedVisit.office_id)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-3">
                  <div>
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check-In Timestamp</h4>
                    <p className="text-[10px] font-semibold text-slate-600 mt-0.5">{new Date(selectedVisit.check_in).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Check-Out Timestamp</h4>
                    <p className="text-[10px] font-semibold text-slate-600 mt-0.5">
                      {selectedVisit.check_out ? new Date(selectedVisit.check_out).toLocaleString() : 'Active Inside Facility'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-3">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Badge Status</h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedVisit.status === 'approved' ? 'bg-green-500 animate-pulse' :
                      selectedVisit.status === 'exited' ? 'bg-slate-400' :
                      selectedVisit.status === 'pending' ? 'bg-amber-400 animate-bounce' :
                      'bg-red-500'
                    }`}></span>
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{selectedVisit.status}</span>
                  </div>
                </div>
              </div>

              {isReceptionistOrAdmin && selectedVisit.status === 'approved' && !selectedVisit.check_out && (
                <div className="border-t border-slate-50 pt-4">
                  <button
                    onClick={(e) => handleCheckOut(selectedVisit, e)}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition-all shadow cursor-pointer"
                  >
                    <LogOut size={12} />
                    Force Checkout Visitor
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Format Overlay Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setExportModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />

          {/* Dialog Container */}
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden animate-scaleUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Export Visit Attendance Logs</h2>
              <button
                onClick={() => setExportModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              <p className="text-xs text-slate-500">
                You are exporting <span className="font-bold text-slate-800">{filteredVisits.length} filtered rows</span>. Select your desired format below:
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Excel/CSV button */}
                <button
                  onClick={handleExportCSV}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl transition-all cursor-pointer group"
                >
                  <FileSpreadsheet size={32} className="text-slate-400 group-hover:text-blue-600 transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700">Excel / CSV</span>
                  <span className="text-[9px] text-slate-400 mt-1">Structured spreadsheet</span>
                </button>

                {/* PDF Print button */}
                <button
                  onClick={handleExportPDF}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-red-500 hover:bg-red-50/20 rounded-xl transition-all cursor-pointer group"
                >
                  <FileText size={32} className="text-slate-400 group-hover:text-red-600 transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700">PDF Report</span>
                  <span className="text-[9px] text-slate-400 mt-1">Printable report view</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsPage;
