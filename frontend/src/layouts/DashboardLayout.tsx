import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ShieldAlert } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isOnline = useNetworkStatus();

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Offline Alert Banner */}
        {!isOnline && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs flex items-center space-x-2 shrink-0 animate-slideDown shadow-sm">
            <ShieldAlert size={14} className="shrink-0 animate-pulse" />
            <span className="font-medium">
              Offline Mode Active: Changes are saved to your local tablet database and will auto-sync once connection is restored.
            </span>
          </div>
        )}

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 focus:outline-none custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
