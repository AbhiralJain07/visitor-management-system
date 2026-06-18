import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore, type OfficeConfig } from '@/store/configStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { db } from '@/offline/db';
import { Menu, Wifi, WifiOff, RefreshCw, Building, Globe } from 'lucide-react';
import { UniversalSearch } from '@/features/tenant-admin/components/UniversalSearch';
import { useAuthStore } from '@/store/authStore';
import { useVisits } from '@/features/tenant-admin/api/queryHooks';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';

interface NavbarProps {
  onMenuClick: () => void;
}

const LanguageSwitcher: React.FC = () => {
  const [lang, setLang] = useState('EN');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-[11px] font-bold"
        aria-label="Language Selector"
      >
        <Globe size={16} />
        <span className="hidden sm:inline uppercase">{lang}</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50 animate-fadeIn text-[11px]">
            {['EN', 'ES', 'HI'].map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-bold transition-colors ${
                  lang === l ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                }`}
              >
                {l === 'EN' ? 'English' : l === 'ES' ? 'Español' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const { selectedOffice, setSelectedOffice, isSyncing, lastSyncedAt } = useConfigStore();
  const [offices, setOffices] = useState<OfficeConfig[]>([]);

  const { user } = useAuthStore();
  const { visits: notificationVisits, isLoading: isNotificationsLoading } = useVisits(
    user?.role === 'employee' ? { host_id: user.id } : undefined
  );

  // Fetch offices from Dexie DB on load
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const localOffices = await db.offices.toArray();
        if (localOffices.length > 0) {
          setOffices(localOffices);
        } else {
          // Add default fallback mock offices if database is empty for demo demonstration
          const mockOffices: OfficeConfig[] = [
            { _id: 'o1', name: 'Mumbai Corporate Office', city: 'Mumbai', address: 'Bandra Kurla Complex', is_active: true },
            { _id: 'o2', name: 'Delhi Tech Center', city: 'Delhi', address: 'Connaught Place', is_active: true },
            { _id: 'o3', name: 'Bengaluru R&D Hub', city: 'Bengaluru', address: 'Indiranagar', is_active: true }
          ];
          await db.offices.bulkPut(mockOffices);
          setOffices(mockOffices);
          if (!selectedOffice) {
            setSelectedOffice(mockOffices[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load offices from local database:', err);
      }
    };
    fetchOffices();
  }, [selectedOffice, setSelectedOffice]);

  const handleOfficeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const office = offices.find((o) => o._id === e.target.value);
    if (office) {
      setSelectedOffice(office);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    if (result.type === 'visitor') {
      navigate(`/visitors?q=${encodeURIComponent(result.title)}`);
    } else if (result.type === 'employee') {
      navigate(`/employees?q=${encodeURIComponent(result.title)}`);
    } else if (result.type === 'office') {
      navigate(`/offices?q=${encodeURIComponent(result.title)}`);
    } else if (result.type === 'visit') {
      navigate(`/visits?q=${encodeURIComponent(result.title)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[70px] px-4 md:px-6 bg-white border-b border-slate-200 shadow-sm">
      {/* Left side: Hamburger menu & Office selector */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Toggle Button for mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Open Sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Office Selection Kiosk dropdown */}
        <div className="flex items-center space-x-1.5 md:space-x-2">
          <Building className="text-blue-600 shrink-0 hidden sm:inline" size={18} />
          <div className="relative">
            <select
              value={selectedOffice?._id || ''}
              onChange={handleOfficeChange}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all max-w-[130px] sm:max-w-none truncate"
            >
              {offices.length === 0 ? (
                <option value="">Loading Offices...</option>
              ) : (
                offices.map((office) => (
                  <option key={office._id} value={office._id}>
                    {office.name} ({office.city})
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Sync Status, Connection Indicator, and actions */}
      <div className="flex items-center space-x-1.5 md:space-x-3">
        {/* Universal Search Modal Trigger */}
        <UniversalSearch onSelectResult={handleSelectSearchResult} />

        {/* Sync outbox status spinner */}
        {isSyncing ? (
          <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-1 rounded-md animate-pulse">
            <RefreshCw size={12} className="animate-spin" />
            <span className="hidden sm:inline font-medium">Syncing...</span>
          </div>
        ) : lastSyncedAt ? (
          <span className="hidden md:inline text-[10px] text-slate-400">
            Last synced: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : null}

        {/* Language Switcher dropdown */}
        <LanguageSwitcher />

        {/* Notification bell dropdown */}
        {user && (
          <NotificationDropdown
            visits={notificationVisits || []}
            isLoading={isNotificationsLoading}
          />
        )}

        {/* Connection Network Status Badge */}
        {isOnline ? (
          <div className="flex items-center space-x-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 sm:px-2.5 rounded-full text-xs font-semibold shadow-sm transition-all">
            <Wifi size={14} className="text-green-600 animate-pulse" />
            <span className="hidden sm:inline">Online</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 sm:px-2.5 rounded-full text-xs font-semibold shadow-sm transition-all animate-pulse">
            <WifiOff size={14} className="text-amber-600" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}
      </div>
    </header>
  );
};
