import React, { useMemo } from 'react';
import { useVisitors, useVisits, useEmployees, useOffices } from '@/features/tenant-admin/api/queryHooks';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Users, UserCheck, Clock, UserX, BarChart3, HelpCircle, ArrowUpRight, ShieldAlert, Calendar, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { EmployeeDashboard } from '@/features/employees/components/EmployeeDashboard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { visitors, isLoading: visitorsLoading } = useVisitors();
  const { visits, isLoading: visitsLoading } = useVisits();
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { offices, isLoading: officesLoading } = useOffices();

  const isPageLoading = visitorsLoading || visitsLoading || employeesLoading || officesLoading;

  // Compute stats and chart datasets
  const dashboardStats = useMemo(() => {
    if (!visits || !visitors || !employees) {
      return {
        todayVisitors: 0,
        activeVisitors: 0,
        pendingApprovals: 0,
        blacklistedCount: 0,
        monthlyVisits: 0,
        totalEmployees: 0,
      };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Today's visitors (visits check_in >= today start)
    const todayVisits = visits.filter(v => new Date(v.check_in) >= todayStart);
    
    // 2. Active visitors (approved and check_out is null/empty)
    const active = visits.filter(v => v.status === 'approved' && !v.check_out);

    // 3. Pending approvals
    const pending = visits.filter(v => v.status === 'pending');

    // 4. Blacklisted count
    const blacklisted = visitors.filter(v => v.is_blacklisted);

    // 5. Monthly visits (last 30 days)
    const monthly = visits.filter(v => new Date(v.check_in) >= thirtyDaysAgo);

    return {
      todayVisitors: todayVisits.length,
      activeVisitors: active.length,
      pendingApprovals: pending.length,
      blacklistedCount: blacklisted.length,
      monthlyVisits: monthly.length,
      totalEmployees: employees.length,
    };
  }, [visits, visitors, employees]);

  // Chart 1: Daily visitor trend (last 7 days)
  const dailyTrend = useMemo(() => {
    const trendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      trendMap[label] = 0;
    }

    if (visits) {
      visits.forEach(v => {
        const date = new Date(v.check_in);
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (dayLabel in trendMap) {
          trendMap[dayLabel]++;
        }
      });
    }

    return Object.keys(trendMap).map(date => ({
      date,
      visits: trendMap[date]
    }));
  }, [visits]);

  // Chart 2: Weekly visit trend (past 4 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks = [
      { name: 'Week 4', startDaysAgo: 28, endDaysAgo: 21, count: 0 },
      { name: 'Week 3', startDaysAgo: 21, endDaysAgo: 14, count: 0 },
      { name: 'Week 2', startDaysAgo: 14, endDaysAgo: 7, count: 0 },
      { name: 'Week 1 (Latest)', startDaysAgo: 7, endDaysAgo: 0, count: 0 },
    ];

    if (visits) {
      const now = new Date();
      visits.forEach(v => {
        const checkIn = new Date(v.check_in);
        const diffTime = Math.abs(now.getTime() - checkIn.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        weeks.forEach(w => {
          if (diffDays > w.endDaysAgo && diffDays <= w.startDaysAgo) {
            w.count++;
          }
        });
      });
    }

    return weeks.map(w => ({ name: w.name, visits: w.count }));
  }, [visits]);

  // Chart 3: Visit status distribution
  const statusDistribution = useMemo(() => {
    if (!visits) return [];
    const counts = {
      Approved: visits.filter(v => v.status === 'approved').length,
      Pending: visits.filter(v => v.status === 'pending').length,
      Exited: visits.filter(v => v.status === 'exited').length,
      Rejected: visits.filter(v => v.status === 'rejected').length,
    };

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [visits]);

  // Chart 4: Department-wise visits
  const departmentDistribution = useMemo(() => {
    if (!visits || !employees) return [];
    const deptMap: Record<string, number> = {};

    visits.forEach(v => {
      // Find host employee details
      const hostId = typeof v.host_id === 'object' && v.host_id !== null ? v.host_id._id : v.host_id;
      const emp = employees.find(e => e._id === hostId);
      const dept = emp?.department || 'Administration';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    return Object.entries(deptMap).map(([name, visits]) => ({ name, visits }));
  }, [visits, employees]);

  // Chart 5: Hourly traffic analysis
  const hourlyTraffic = useMemo(() => {
    const hours = Array.from({ length: 9 }, (_, i) => ({
      hour: `${i + 9}:00`,
      hourNum: i + 9,
      visits: 0
    }));

    if (visits) {
      visits.forEach(v => {
        const hour = new Date(v.check_in).getHours();
        const slot = hours.find(h => h.hourNum === hour);
        if (slot) {
          slot.visits++;
        }
      });
    }

    return hours;
  }, [visits]);

  // Lists: Recent visitors, Recent approvals, Upcoming meetings
  const tablesData = useMemo(() => {
    if (!visits) return { recent: [], approvals: [], upcoming: [] };

    // Recent visitors: last 5 sorted by check_in time
    const sorted = [...visits].sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());
    const recent = sorted.slice(0, 5);

    // Recent approvals: last 5 with status approved/exited
    const approvals = sorted.filter(v => v.status === 'approved' || v.status === 'exited').slice(0, 5);

    // Upcoming meetings: visits with status 'pending' or meeting in future
    const upcoming = sorted.filter(v => v.status === 'pending').slice(0, 5);

    return { recent, approvals, upcoming };
  }, [visits]);

  const getVisitorName = (visitor: any) => {
    return typeof visitor === 'object' && visitor !== null ? visitor.name : 'Unknown Visitor';
  };

  const getHostName = (host: any) => {
    return typeof host === 'object' && host !== null ? host.name : 'Unknown Host';
  };

  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Overview Dashboard</h1>
          <p className="text-sm text-slate-500">Loading modules and reports...</p>
        </div>

        {/* Skeleton cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              <div className="h-3 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Skeleton charts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-64 sm:h-80 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-slate-100 rounded w-1/4"></div>
            <div className="h-40 sm:h-48 bg-slate-200/50 rounded w-full"></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-64 sm:h-80 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-slate-100 rounded w-1/3"></div>
            <div className="h-40 sm:h-48 bg-slate-200/50 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" size={24} />
            Overview Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Here's a real-time summary of visitor activities.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {/* Today's Visitors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-500 hover:shadow-md transition-all duration-200">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Visits</h3>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.todayVisitors}</p>
            <p className="text-[9px] text-slate-400">Since 12:00 AM today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <Users size={18} />
          </div>
        </div>

        {/* Active Visitors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-emerald-500 hover:shadow-md transition-all duration-200">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Inside</h3>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.activeVisitors}</p>
            <p className="text-[9px] text-slate-400">Checked-in, not exited</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <UserCheck size={18} />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-amber-500 hover:shadow-md transition-all duration-200">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Auth</h3>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.pendingApprovals}</p>
            <p className="text-[9px] text-slate-400">Pending host approval</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
            <Clock size={18} className="animate-pulse" />
          </div>
        </div>

        {/* Blacklisted Visitors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-red-500 hover:shadow-md transition-all duration-200">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blacklisted</h3>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.blacklistedCount}</p>
            <p className="text-[9px] text-slate-400">Flagged identity profiles</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
            <UserX size={18} />
          </div>
        </div>

        {/* Monthly Visits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-indigo-500 hover:shadow-md transition-all duration-200">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Visits</h3>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.monthlyVisits}</p>
            <p className="text-[9px] text-slate-400">Past 30 days total</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <BarChart3 size={18} />
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-purple-500 hover:shadow-md transition-all duration-200">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hosts Directory</h3>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.totalEmployees}</p>
            <p className="text-[9px] text-slate-400">Total company employees</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
            <Users size={18} />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Daily visitor trend */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-64 sm:h-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <BarChart3 size={16} className="text-blue-500" />
              Daily Visitor Trend
            </h3>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Last 7 Days</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly visit trend */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-64 sm:h-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <ArrowUpRight size={16} className="text-emerald-500" />
              Weekly Traffic Trend
            </h3>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Past Month</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visit Status Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-64 sm:h-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle size={16} className="text-amber-500" />
              Status Distribution
            </h3>
          </div>
          <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center">
            <div className="flex-1 w-full h-full min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-row sm:flex-col justify-center gap-2 sm:gap-2 px-2 shrink-0">
              {statusDistribution.map((entry, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="truncate">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department-wise visits */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-64 sm:h-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Users size={16} className="text-indigo-500" />
              Department-wise Visits
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Bar dataKey="visits" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly traffic analysis */}
        <div className="md:col-span-2 lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-64 sm:h-80">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Clock size={16} className="text-purple-500" />
              Hourly Visitor Traffic
            </h3>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">9:00 AM - 5:00 PM</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTraffic} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="visits" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorHourly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Recent Visitors */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-700">Recent Visitors</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {tablesData.recent.length > 0 ? (
              tablesData.recent.map((visit) => (
                <div key={visit._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{getVisitorName(visit.visitor_id)}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">Host: {getHostName(visit.host_id)} | {visit.purpose}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border shrink-0 capitalize ${
                    visit.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                    visit.status === 'exited' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    visit.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {visit.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">No visitors logged today.</div>
            )}
          </div>
        </div>

        {/* Recent Approvals */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-700">Recent Approvals</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {tablesData.approvals.length > 0 ? (
              tablesData.approvals.map((visit) => (
                <div key={visit._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{getVisitorName(visit.visitor_id)}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">Approved: {new Date(visit.check_in).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-[9px] font-bold text-green-600 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Ready
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">No approved visits today.</div>
            )}
          </div>
        </div>

        {/* Upcoming/Awaiting Meetings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-700">Awaiting Response</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {tablesData.upcoming.length > 0 ? (
              tablesData.upcoming.map((visit) => (
                <div key={visit._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{getVisitorName(visit.visitor_id)}</p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">Host: {getHostName(visit.host_id)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] text-slate-500 font-medium">Awaiting Host</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">No visits currently pending.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  if (user?.role === 'employee') {
    return <EmployeeDashboard />;
  }
  return <AdminDashboard />;
};

export default DashboardPage;
