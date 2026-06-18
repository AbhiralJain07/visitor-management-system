import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 space-y-3">
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      <p className="text-xs text-slate-500 font-medium tracking-wide">Loading workspace data...</p>
    </div>
  );
};

export default LoadingScreen;
