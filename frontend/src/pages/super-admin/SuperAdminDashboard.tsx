import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building,
  Users,
  UserCheck,
  Percent,
  Search,
  History,
  Calendar,
  DollarSign,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useGlobalAnalytics, useUniversalSearch } from '@/features/super-admin/api/queryHooks';
import {
  PageHeader,
  StatsCard,
  SearchBar,
  LoadingSkeleton,
  EmptyState,
} from '@/features/super-admin/components/UIComponents';

const RECHARTS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export const SuperAdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vms_super_admin_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // TanStack Queries
  const { data: analytics, isLoading: isAnalyticsLoading } = useGlobalAnalytics(dateRange);
  const { data: searchResults = [], isLoading: isSearchLoading } = useUniversalSearch(searchQuery);

  const handleSearchSubmit = (val: string) => {
    setSearchQuery(val);
    if (val.trim() && !recentSearches.includes(val)) {
      const updated = [val, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('vms_super_admin_recent_searches', JSON.stringify(updated));
    }
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('vms_super_admin_recent_searches');
  };

  const handleSelectRecent = (term: string) => {
    setSearchQuery(term);
  };

  return (
    <div className="space-y-6">
      {/* Universal Search and Page Title Wrapper */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-200">
        <div>
          <PageHeader
            title="Super Admin Control Centre"
            description="Global multi-tenant dashboard monitoring system growth, core master indexes, and subscription metrics."
          />
        </div>

        {/* Global Search Bar Widget */}
        <div className="relative w-full max-w-sm shrink-0">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchSubmit}
            placeholder="Universal search tenants, configurations..."
          />

          {/* Search Result Overlay Dropdown */}
          {searchQuery && (
            <div className="absolute right-0 top-full mt-2 w-full sm:w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Universal Results
                </span>
                {isSearchLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></span>
                )}
              </div>

              <div className="divide-y divide-slate-50 mt-2">
                {searchResults.length === 0 && !isSearchLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No matching tenants or configurations found.
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                      onClick={() => {
                        window.location.href = item.link;
                      }}
                    >
                      <div className="space-y-0.5 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{item.title}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate leading-relaxed">{item.subtitle}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent searches history (shown when search is empty but matches exist) */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <History size={13} className="shrink-0 text-slate-300" />
          <span className="font-semibold select-none">Recent Searches:</span>
          {recentSearches.map((term, i) => (
            <button
              key={i}
              onClick={() => handleSelectRecent(term)}
              className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-2xs font-medium transition-all"
            >
              {term}
            </button>
          ))}
          <button
            onClick={handleClearRecent}
            className="text-slate-500 hover:text-slate-800 font-bold focus:outline-none"
          >
            Clear All
          </button>
        </div>
      )}

      {isAnalyticsLoading || !analytics ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatsCard
              title="Total Registered Tenants"
              value={analytics.stats.totalCompanies}
              icon={<Building size={18} />}
              change={15.4}
              changeType="positive"
              description="registered clients"
            />
            <StatsCard
              title="Active System Users"
              value={analytics.stats.activeUsers}
              icon={<Users size={18} />}
              change={8.2}
              changeType="positive"
              description="active accounts"
            />
            <StatsCard
              title="Monthly Subscriptions Growth"
              value={`${analytics.stats.monthlyGrowthPercent}%`}
              icon={<Percent size={18} />}
              change={analytics.stats.monthlyGrowthPercent}
              changeType="positive"
              description="growth rate"
            />
            <StatsCard
              title="Total Guests Checked-in"
              value={analytics.stats.totalVisitors}
              icon={<UserCheck size={18} />}
              change={20.1}
              changeType="positive"
              description="visitor history"
            />
            <StatsCard
              title="Visits Today"
              value={analytics.stats.visitsToday}
              icon={<Calendar size={18} />}
              change={-4.3}
              changeType="negative"
              description="checked in today"
            />
            <StatsCard
              title="Global Active Companies"
              value={analytics.stats.activeCompanies}
              icon={<Building size={18} />}
              change={12.5}
              changeType="positive"
              description="operational nodes"
            />
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Daily Visitor Trend (Area Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm">System Guest Traffic</h3>
                  <p className="text-[10px] text-slate-400">Visitor check-in trend over the last 7 days</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.visitorTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#visitorGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Company Growth Trend (Bar Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm">Corporate Growth Trend</h3>
                  <p className="text-[10px] text-slate-400">Total registered client nodes by month</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.companyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Bar dataKey="companies" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Monthly Revenue Trend (Line Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm">Monthly Platform Revenue</h3>
                  <p className="text-[10px] text-slate-400">Estimated MRR in USD across active subscriptions</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Subscription Plan Distribution (Pie Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-sm">Subscription Tier Spread</h3>
                <p className="text-[10px] text-slate-400">Distribution of company tenants by plan</p>
              </div>
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.planDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {analytics.planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart Legend */}
                <div className="space-y-1.5 text-xs text-slate-600 font-semibold select-none max-w-[160px]">
                  {analytics.planDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: RECHARTS_COLORS[index % RECHARTS_COLORS.length] }}
                      />
                      <span className="truncate">{item.name} Plan</span>
                      <span className="text-slate-400 font-bold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
