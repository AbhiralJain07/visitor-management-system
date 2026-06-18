import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/offline/db';
import { Search, User, ClipboardList, Briefcase, Building, X, Sparkles } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'visitor' | 'visit' | 'employee' | 'office';
  title: string;
  subtitle: string;
  tag?: string;
  original: any;
}

interface UniversalSearchProps {
  onSelectResult?: (result: SearchResult) => void;
}

export const UniversalSearch: React.FC<UniversalSearchProps> = ({ onSelectResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle modal on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search logic over Dexie DB
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      const lowerQuery = query.toLowerCase();
      const tempResults: SearchResult[] = [];

      try {
        // 1. Search Visitors
        const visitors = await db.visitors
          .filter((v) => 
            v.name.toLowerCase().includes(lowerQuery) || 
            v.phone.toLowerCase().includes(lowerQuery) || 
            v.id_number.toLowerCase().includes(lowerQuery)
          )
          .limit(5)
          .toArray();

        visitors.forEach((v) => {
          tempResults.push({
            id: v._id || v.id || '',
            type: 'visitor',
            title: v.name,
            subtitle: `Phone: ${v.phone} | ID: ${v.id_number}`,
            tag: v.is_blacklisted ? 'Blacklisted' : undefined,
            original: v,
          });
        });

        // 2. Search Employees
        const employees = await db.employees
          .filter((e) => 
            e.name.toLowerCase().includes(lowerQuery) || 
            e.email.toLowerCase().includes(lowerQuery) || 
            (e.department || '').toLowerCase().includes(lowerQuery)
          )
          .limit(5)
          .toArray();

        employees.forEach((e) => {
          tempResults.push({
            id: e._id,
            type: 'employee',
            title: e.name,
            subtitle: `${e.role.toUpperCase()} | ${e.department || 'No Department'} | ${e.email}`,
            original: e,
          });
        });

        // 3. Search Offices
        const offices = await db.offices
          .filter((o) => 
            o.name.toLowerCase().includes(lowerQuery) || 
            o.city.toLowerCase().includes(lowerQuery) || 
            (o.address || '').toLowerCase().includes(lowerQuery)
          )
          .limit(5)
          .toArray();

        offices.forEach((o) => {
          tempResults.push({
            id: o._id,
            type: 'office',
            title: o.name,
            subtitle: `${o.city} | ${o.address}`,
            tag: o.is_active ? 'Active' : 'Inactive',
            original: o,
          });
        });

        // 4. Search Visits
        const visits = await db.visits.toArray();
        const localVisitors = await db.visitors.toArray();
        const localEmployees = await db.employees.toArray();
        const localOffices = await db.offices.toArray();

        const matchedVisits = visits.filter((v) => {
          const vis = localVisitors.find((visitor) => visitor._id === v.visitor_id || visitor.id === v.visitor_id);
          const emp = localEmployees.find((employee) => employee._id === v.host_id);
          const office = localOffices.find((o) => o._id === v.office_id);

          return (
            (vis?.name || '').toLowerCase().includes(lowerQuery) ||
            (emp?.name || '').toLowerCase().includes(lowerQuery) ||
            (v.purpose || '').toLowerCase().includes(lowerQuery) ||
            (office?.name || '').toLowerCase().includes(lowerQuery)
          );
        }).slice(0, 5);

        matchedVisits.forEach((v) => {
          const vis = localVisitors.find((visitor) => visitor._id === v.visitor_id || visitor.id === v.visitor_id);
          const emp = localEmployees.find((employee) => employee._id === v.host_id);
          tempResults.push({
            id: v._id || v.id || '',
            type: 'visit',
            title: `Visit: ${vis?.name || 'Unknown'} ➔ ${emp?.name || 'Unknown'}`,
            subtitle: `Purpose: ${v.purpose} | Status: ${v.status.toUpperCase()} | In: ${new Date(v.check_in).toLocaleDateString()}`,
            tag: v.status,
            original: v,
          });
        });

        setResults(tempResults);
      } catch (err) {
        console.error('Dexie universal search error:', err);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'visitor':
        return <User size={16} className="text-blue-500" />;
      case 'employee':
        return <Briefcase size={16} className="text-emerald-500" />;
      case 'office':
        return <Building size={16} className="text-indigo-500" />;
      case 'visit':
        return <ClipboardList size={16} className="text-amber-500" />;
    }
  };

  const getTagColor = (type: SearchResult['type'], tag?: string) => {
    if (!tag) return '';
    if (tag === 'Blacklisted') return 'bg-red-50 text-red-700 border-red-200';
    if (tag === 'approved' || tag === 'Active') return 'bg-green-50 text-green-700 border-green-200';
    if (tag === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (tag === 'exited') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  return (
    <>
      {/* Search Trigger Button in Navbar style */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200"
      >
        <Search size={14} className="shrink-0" />
        <span className="hidden sm:inline">Search logs...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-medium text-slate-400">
          ctrl K
        </kbd>
      </button>

      {/* Floating Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-xl bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[480px] animate-scaleUp">
            {/* Header Input */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
              <Search className="text-slate-400 shrink-0 mr-3" size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search visitors, hosts, check-ins, office branches..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Results */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
              {results.length > 0 ? (
                results.map((res) => (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => {
                      if (onSelectResult) onSelectResult(res);
                      setIsOpen(false);
                    }}
                    className="w-full text-left flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                        {getIcon(res.type)}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {res.title}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate mt-0.5">
                          {res.subtitle}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {res.tag && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border capitalize ${getTagColor(res.type, res.tag)}`}>
                          {res.tag}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                        {res.type}
                      </span>
                    </div>
                  </button>
                ))
              ) : query.trim() ? (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <X size={24} className="text-slate-300" />
                  <p className="text-xs font-semibold">No results match your search</p>
                  <p className="text-[10px] text-slate-500">Verify keywords and try again.</p>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <Sparkles size={24} className="text-slate-300 animate-pulse" />
                  <p className="text-xs font-semibold">Search across all collections</p>
                  <p className="text-[10px] text-slate-500">Start typing to query visitors, employees, offices, or visits.</p>
                </div>
              )}
            </div>

            {/* Footer tips */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 shrink-0">
              <span>Tip: Press <kbd className="font-mono bg-white px-1 border rounded">esc</kbd> to dismiss this menu</span>
              <span>Dexie Offline-Indexed Search Enabled</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
