import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'row' | 'form';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 3,
  className = '',
}) => {
  const items = Array.from({ length: count });

  if (type === 'row') {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((_, idx) => (
          <div
            key={idx}
            className="flex items-center space-x-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-pulse"
          >
            <div className="rounded-full bg-slate-200 h-10 w-10 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              <div className="h-2 bg-slate-150 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className={`space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          <div className="h-10 bg-slate-200 rounded w-full"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
        <div className="h-12 bg-slate-200 rounded w-full mt-6"></div>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {items.map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm animate-pulse flex flex-col justify-between h-36"
        >
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 bg-slate-200 rounded-full shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-2.5 bg-slate-150 rounded w-1/2"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            <div className="h-7 bg-slate-250 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
