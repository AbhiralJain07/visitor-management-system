import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] w-full text-center p-6 space-y-6">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm animate-pulse">
        <FileQuestion size={40} />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-700">Page Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
      </div>

      <div className="flex justify-center space-x-3">
        <button
          onClick={() => window.history.back()}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-3 rounded-lg border border-slate-200 transition-colors"
        >
          Go Back
        </button>
        <Link
          to="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-sm transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
