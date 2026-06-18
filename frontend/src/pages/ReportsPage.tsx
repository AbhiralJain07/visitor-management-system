import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/api/client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart2, Users, UserX, Clock, TrendingUp,
  Calendar, CheckCircle, XCircle, AlertTriangle, Download,
  RefreshCw, Filter,
} from 'lucide-react';

/* ─── Types ─── */
interface ReportData {
  stats: {
    totalVisits: number;
    approvedVisits: number;
    rejectedVisits: number;
    pendingVisits: number;
    exitedVisits: number;
    totalVisitors: number;
    blacklistedVisitors: number;
    visitsToday: number;
    activeVisitors: number;
    avgDurationMinutes: number;
  };
  dailyTrend: { date: string; visits: number }[];
  purposeBreakdown: { purpose: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  topHosts: { name: string; department: string; visitCount: number }[];
  hourlyDistribution: { hour: string; count: number }[];
  dateRange: { startDate: string; endDate: string };
}

/* ─── Colors ─── */
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b', '#06b6d4', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  Approved: '#10b981',
  Pending: '#f59e0b',
  Rejected: '#f43f5e',
  Exited: '#6366f1',
};

/* ─── Custom Tooltip ─── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl shadow-xl text-[11px] font-semibold">
      <p className="text-slate-400 text-[9px] uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#fff' }}>{p.name}: <span className="font-mono font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ title, value, icon, color, sub }: {
  title: string; value: string | number; icon: React.ReactNode; color: string; sub?: string;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-extrabold text-slate-800 font-mono leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Date presets ─── */
const DATE_PRESETS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export const ReportsPage: React.FC = () => {
  const [preset, setPreset] = useState(30);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return toDateInput(d);
  });
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));

  const applyPreset = (days: number) => {
    setPreset(days);
    const d = new Date(); d.setDate(d.getDate() - days);
    setStartDate(toDateInput(d));
    setEndDate(toDateInput(new Date()));
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ReportData>({
    queryKey: ['reports', startDate, endDate],
    queryFn: async () => {
      const res = await httpClient.get('/reports', { params: { startDate, endDate } });
      if (!res.data?.success) throw new Error(res.data?.message || 'Failed to load reports');
      return res.data.data;
    },
    staleTime: 2 * 60_000,
  });

  const approvalRate = useMemo(() => {
    if (!data) return 0;
    const decided = data.stats.approvedVisits + data.stats.rejectedVisits;
    return decided > 0 ? Math.round((data.stats.approvedVisits / decided) * 100) : 0;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={24} />
            Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500">Traffic volumes, visit patterns, host activity, and visitor insights.</p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Filter size={14} className="text-slate-400 shrink-0 mt-2 sm:mt-0" />

        {/* Preset pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {DATE_PRESETS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => applyPreset(days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                preset === days ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="font-bold text-slate-400">From</span>
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPreset(0); }}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="font-bold text-slate-400">To</span>
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPreset(0); }}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3 text-red-700">
          <AlertTriangle size={18} />
          <div>
            <p className="font-bold text-sm">Failed to load report data</p>
            <p className="text-xs mt-0.5">Check that your backend is running and you have the required permissions.</p>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Visits"
              value={data.stats.totalVisits}
              icon={<Calendar size={18} className="text-blue-600" />}
              color="bg-blue-50"
              sub={`${data.stats.visitsToday} today`}
            />
            <StatCard
              title="Active Now"
              value={data.stats.activeVisitors}
              icon={<Users size={18} className="text-emerald-600" />}
              color="bg-emerald-50"
              sub="currently checked in"
            />
            <StatCard
              title="Approval Rate"
              value={`${approvalRate}%`}
              icon={<CheckCircle size={18} className="text-indigo-600" />}
              color="bg-indigo-50"
              sub={`${data.stats.approvedVisits} approved`}
            />
            <StatCard
              title="Avg Duration"
              value={`${data.stats.avgDurationMinutes}m`}
              icon={<Clock size={18} className="text-amber-600" />}
              color="bg-amber-50"
              sub="per visit"
            />
            <StatCard
              title="Total Visitors"
              value={data.stats.totalVisitors}
              icon={<TrendingUp size={18} className="text-purple-600" />}
              color="bg-purple-50"
              sub="registered in system"
            />
            <StatCard
              title="Blacklisted"
              value={data.stats.blacklistedVisitors}
              icon={<UserX size={18} className="text-red-600" />}
              color="bg-red-50"
              sub="blocked visitors"
            />
            <StatCard
              title="Rejected"
              value={data.stats.rejectedVisits}
              icon={<XCircle size={18} className="text-rose-600" />}
              color="bg-rose-50"
              sub="in selected range"
            />
            <StatCard
              title="Pending"
              value={data.stats.pendingVisits}
              icon={<AlertTriangle size={18} className="text-yellow-600" />}
              color="bg-yellow-50"
              sub="awaiting approval"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daily Visit Trend</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Check-ins over selected period</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" name="Visits" dataKey="visits" stroke="#6366f1" strokeWidth={2} fill="url(#visitGrad)" activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Peak Hours</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Busiest check-in times (office hours)</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar name="Visits" dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Purpose Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 lg:col-span-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Visit Purpose Breakdown</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Top reasons for visits</p>
              </div>
              {data.purposeBreakdown.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.purposeBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="purpose" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} width={90} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar name="Visits" dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                        {data.purposeBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-slate-400 text-xs">No data in selected range</div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Visit Status</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Distribution by status</p>
              </div>
              <div className="h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusDistribution.filter(s => s.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {data.statusDistribution.map((s, i) => (
                        <Cell key={i} fill={STATUS_COLORS[s.status] || COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {data.statusDistribution.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] || COLORS[i] }} />
                      <span className="text-slate-500 font-semibold">{s.status}</span>
                    </div>
                    <span className="font-bold font-mono text-slate-700">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Hosts Table */}
          {data.topHosts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Top Hosts</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Employees with most visits in period</p>
                </div>
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3 text-right">Visits Hosted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topHosts.map((host, i) => (
                    <tr key={i} className="text-xs hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-extrabold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' :
                          i === 1 ? 'bg-slate-100 text-slate-600' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">{host.name}</td>
                      <td className="px-6 py-3.5 text-slate-500">{host.department || 'General'}</td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-indigo-600">{host.visitCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
