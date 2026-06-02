import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import { navigationConfig } from '@/config/navigation';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useConfigStore();

  const filteredNavigation = navigationConfig.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  const isCollapsed = sidebarCollapsed;
  const sidebarWidth = isCollapsed ? 'w-20' : 'w-20 lg:w-64';

  const NavContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => {
    const activeCollapsed = forceExpanded ? false : isCollapsed;
    const textVisibility = forceExpanded
      ? 'block'
      : (activeCollapsed ? 'hidden' : 'hidden lg:block');
    const textVisibilityInline = forceExpanded
      ? 'inline'
      : (activeCollapsed ? 'hidden' : 'hidden lg:inline');

    return (
      <div className="flex flex-col h-full bg-slate-900 text-slate-200">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800 min-h-[70px]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 shrink-0 shadow-md shadow-blue-500/20">
              <span className="font-bold text-lg text-white">V</span>
            </div>
            <div className={`flex flex-col animate-fadeIn ${textVisibility}`}>
              <span className="font-bold text-sm leading-tight text-white uppercase tracking-wider">VMS Enterprise</span>
              <span className="text-[10px] text-slate-400">Visitor Management</span>
            </div>
          </div>
          
          {/* Toggle Button for Desktop */}
          {!forceExpanded && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label={activeCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {activeCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />
                <span className={`ml-3 truncate animate-fadeIn ${textVisibilityInline}`}>{item.name}</span>
                
                {/* Tooltip for Collapsed / Tablet Sidebar */}
                <div className={`absolute left-full ml-3 px-2 py-1 bg-slate-950 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap shadow-md ${
                  activeCollapsed ? 'block' : 'block lg:hidden'
                }`}>
                  {item.name}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* User Section / Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          {/* Expanded Desktop Footer */}
          <div className={`hidden lg:flex items-center justify-between ${activeCollapsed ? 'lg:hidden' : ''}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-blue-400 border border-slate-700 shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</span>
                <span className="text-[10px] text-slate-500 capitalize">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Collapsed / Tablet Footer */}
          <div className={`flex flex-col items-center space-y-3 ${!activeCollapsed ? 'lg:hidden' : 'flex'}`}>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-blue-400 border border-slate-700">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Sidebar Slideover Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={onCloseMobile}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        {/* Sliding Panel */}
        <div
          className={`absolute inset-y-0 left-0 w-64 bg-slate-900 shadow-2xl transition-transform duration-300 transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <NavContent forceExpanded={true} />
        </div>
      </div>

      {/* Desktop/Tablet Sidebar */}
      <aside className={`hidden md:block shrink-0 ${sidebarWidth} transition-all duration-300 ease-in-out border-r border-slate-800 z-10`}>
        <NavContent />
      </aside>
    </>
  );
};
