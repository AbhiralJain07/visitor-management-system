import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building,
  Users,
  UserCheck,
  Percent,
  History,
  Calendar,
  ArrowRight,
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
} from 'recharts';
import { useGlobalAnalytics, useUniversalSearch } from '@/features/super-admin/api/queryHooks';
import {
  PageHeader,
  StatsCard,
  SearchBar,
  LoadingSkeleton,
} from '@/features/super-admin/components/UIComponents';

const RECHARTS_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b'];

// Premium Custom Tooltip Component for Charts
const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 text-white px-3 py-2.5 rounded-xl shadow-xl backdrop-blur-md text-[11px] font-bold space-y-1 select-none">
        <p className="text-slate-400 text-[9px] uppercase tracking-wider">{label}</p>
        <p className="text-xs font-extrabold text-white">
          {payload[0].name}: <span className="text-indigo-400 font-mono">{prefix}{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-slate-200">
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
            <div className="absolute right-0 top-full mt-2 w-full sm:w-[420px] bg-white border border-slate-200/80 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn max-h-[400px] overflow-y-auto custom-scrollbar">
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
                      <div className="space-y-0.5 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{item.title}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
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

      {/* Recent searches history */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 animate-fadeIn">
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
            className="text-slate-500 hover:text-slate-800 font-bold focus:outline-none ml-1 text-[11px]"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Premium Segmented Pill Selector for Date Range */}
      <div className="flex justify-between items-center bg-slate-50 border border-slate-200/50 p-1 rounded-2xl max-w-xs select-none">
        {['7d', '30d', '90d'].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`flex-1 text-center py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
              dateRange === range
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {isAnalyticsLoading || !analytics ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Stats Grid with dynamic Sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Total Registered Tenants"
              value={analytics.stats.totalCompanies}
              icon={<Building size={18} />}
              change={15.4}
              changeType="positive"
              description="registered clients"
              sparklineData={analytics.companyGrowth.map((item) => item.companies)}
            />
            <StatsCard
              title="Active System Users"
              value={analytics.stats.activeUsers}
              icon={<Users size={18} />}
              change={8.2}
              changeType="positive"
              description="active accounts"
              sparklineData={[802, 811, 823, 829, 836, 843]}
            />
            <StatsCard
              title="Monthly Subscriptions Growth"
              value={`${analytics.stats.monthlyGrowthPercent}%`}
              icon={<Percent size={18} />}
              change={analytics.stats.monthlyGrowthPercent}
              changeType="positive"
              description="growth rate"
              sparklineData={[10.5, 11.2, 11.8, 12.0, 12.5, 12.8]}
            />
            <StatsCard
              title="Total Guests Checked-in"
              value={analytics.stats.totalVisitors}
              icon={<UserCheck size={18} />}
              change={20.1}
              changeType="positive"
              description="visitor history"
              sparklineData={[7900, 8100, 8250, 8310, 8390, 8432]}
            />
            <StatsCard
              title="Visits Today"
              value={analytics.stats.visitsToday}
              icon={<Calendar size={18} />}
              change={-4.3}
              changeType="negative"
              description="checked in today"
              sparklineData={analytics.visitorTrend.map((item) => item.visits)}
            />
            <StatsCard
              title="Global Active Companies"
              value={analytics.stats.activeCompanies}
              icon={<Building size={18} />}
              change={12.5}
              changeType="positive"
              description="operational nodes"
              sparklineData={[15, 16, 17, 18, 18, 19]}
            />
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Daily Visitor Trend (Area Chart) */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">System Guest Traffic</h3>
                <p className="text-[10px] font-semibold text-slate-400">Visitor check-in trend over the last 7 days</p>
              </div>
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.visitorTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" name="Visits" dataKey="visits" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#visitorGrad)" activeDot={{ r: 5, strokeWidth: 1.5, fill: '#fff', stroke: '#6366f1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Company Growth Trend (Bar Chart) */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Corporate Growth Trend</h3>
                <p className="text-[10px] font-semibold text-slate-400">Total registered client nodes by month</p>
              </div>
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.companyGrowth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar name="Companies" dataKey="companies" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Monthly Revenue Trend (Line Chart) */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Monthly Platform Revenue</h3>
                <p className="text-[10px] font-semibold text-slate-400">Estimated MRR in USD across active subscriptions</p>
              </div>
              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip prefix="$" />} />
                    <Line name="Revenue" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 1.5, fill: '#fff', stroke: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Subscription Plan Distribution (Pie Chart) */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Subscription Tier Spread</h3>
                <p className="text-[10px] font-semibold text-slate-400">Distribution of company tenants by plan</p>
              </div>
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4 pt-2">
                <div className="h-44 w-44 shrink-0 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.planDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analytics.planDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Absolute Center total info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                    <span className="text-xl font-extrabold text-slate-800 font-mono">24</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Tiers</span>
                  </div>
                </div>

                {/* Pie Chart Legend */}
                <div className="space-y-2.5 text-xs text-slate-600 font-bold select-none max-w-[170px] w-full">
                  {analytics.planDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between border-b border-slate-100/50 pb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-md shrink-0 shadow-2xs"
                          style={{ backgroundColor: RECHARTS_COLORS[index % RECHARTS_COLORS.length] }}
                        />
                        <span className="text-slate-500 font-semibold">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-800">{item.value} clients</span>
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
