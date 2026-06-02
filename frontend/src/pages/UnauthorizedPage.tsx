import React from 'react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-200 shadow-sm animate-pulse">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-sm text-slate-500 max-w-sm">You do not have the required permissions to view this dashboard page.</p>
      </div>

      <Link
        to="/dashboard"
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
      >
        Go to Home Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
