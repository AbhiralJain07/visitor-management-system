import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

/* ==========================================
   PAGE HEADER COMPONENT
   ========================================== */
interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action && <div className="flex items-center shrink-0">{action}</div>}
    </div>
  );
};

/* ==========================================
   STATS CARD COMPONENT
   ========================================== */
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: number; // percentage change
  changeType?: 'positive' | 'negative' | 'neutral';
  isLoading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  change,
  changeType = 'neutral',
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-8 w-16 bg-slate-200 rounded"></div>
        <div className="h-3 w-32 bg-slate-200 rounded"></div>
      </div>
    );
  }

  const changeColor =
    changeType === 'positive'
      ? 'text-green-600 bg-green-50'
      : changeType === 'negative'
      ? 'text-red-600 bg-red-50'
      : 'text-slate-500 bg-slate-50';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-200">
          {icon}
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${changeColor}`}>
              {change > 0 ? `+${change}%` : `${change}%`}
            </span>
          )}
          {description && <span className="text-xs text-slate-500">{description}</span>}
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   STATUS BADGE COMPONENT
   ========================================== */
interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.trim().toLowerCase();

  let styles = 'bg-slate-50 text-slate-600 border-slate-200';
  if (normalized === 'active' || normalized === 'approved' || normalized === 'sys_active') {
    styles = 'bg-green-50 text-green-700 border-green-200';
  } else if (normalized === 'suspended' || normalized === 'inactive' || normalized === 'rejected') {
    styles = 'bg-red-50 text-red-700 border-red-200';
  } else if (normalized === 'pending' || normalized === 'sys_pending') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm capitalize ${styles}`}>
      {status}
    </span>
  );
};

/* ==========================================
   SEARCH BAR WITH DEBOUNCING
   ========================================== */
interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  debounceMs = 300,
}) => {
  const [innerValue, setInnerValue] = useState(value);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(innerValue);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [innerValue, onChange, debounceMs]);

  return (
    <div className="relative w-full max-w-sm group">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
        <Search size={16} />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={innerValue}
        onChange={(e) => setInnerValue(e.target.value)}
        className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
      />
      {innerValue && (
        <button
          type="button"
          onClick={() => {
            setInnerValue('');
            onChange('');
          }}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

/* ==========================================
   DATA TABLE COMPONENT (GENERIC)
   ========================================== */
interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  // pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends { _id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyState,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return <TableLoadingSkeleton columns={columns.length} rows={5} />;
  }

  if (data.length === 0) {
    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        <div className="min-h-[300px] flex items-center justify-center p-8">
          {emptyState || <EmptyState />}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-xs font-bold uppercase tracking-wider">
              {columns.map((column, i) => (
                <th key={i} className={`px-6 py-3.5 ${column.className || ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
            {data.map((row) => (
              <tr key={row._id} className="hover:bg-slate-50/50 transition-colors duration-150">
                {columns.map((column, colIdx) => {
                  const rendered =
                    typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : (row[column.accessor] as React.ReactNode);
                  return (
                    <td key={colIdx} className={`px-6 py-4 font-medium ${column.className || ''}`}>
                      {rendered}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden p-4 space-y-3 bg-slate-50/30">
        {data.map((row) => (
          <div key={row._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            {columns.map((column, colIdx) => {
              const rendered =
                typeof column.accessor === 'function'
                  ? column.accessor(row)
                  : (row[column.accessor] as React.ReactNode);
              
              const isActions = column.header.toLowerCase() === 'actions' || column.header.toLowerCase() === '';
              
              if (isActions) {
                return (
                  <div key={colIdx} className="flex justify-end pt-2 border-t border-slate-100 mt-2 gap-2">
                    {rendered}
                  </div>
                );
              }

              return (
                <div key={colIdx} className="flex justify-between items-center gap-4 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{column.header}</span>
                  <span className="font-semibold text-slate-800 text-right">{rendered}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Pagination Actions footer */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500 font-semibold select-none">
          <span>
            Page <span className="text-slate-800">{currentPage}</span> of{' '}
            <span className="text-slate-800">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   LOADING SKELETON COMPONENT
   ========================================== */
export const TableLoadingSkeleton: React.FC<{ columns: number; rows?: number }> = ({
  columns,
  rows = 5,
}) => {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm animate-pulse">
      <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
      <div className="divide-y divide-slate-100 p-4 space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-100 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/4"></div>
      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
      </div>
    </div>
  );
};

/* ==========================================
   EMPTY STATE COMPONENT
   ========================================== */
interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Records Found',
  description = 'There are no active records in this view matching your filter parameters.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 select-none max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
        <AlertTriangle size={22} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};

/* ==========================================
   ERROR STATE COMPONENT
   ========================================== */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'An unexpected connection error occurred while loading this view.',
  onRetry,
}) => {
  return (
    <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto space-y-4">
      <div className="mx-auto w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <AlertCircle size={20} />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-red-900">{title}</h4>
        <p className="text-xs text-red-700 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold px-4 py-2 bg-white border border-red-200 rounded-lg text-red-700 hover:bg-red-100/50 transition-colors shadow-sm"
        >
          Retry Request
        </button>
      )}
    </div>
  );
};

/* ==========================================
   CONFIRMATION DIALOG MODAL
   ========================================== */
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const confirmBtnColor =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300" onClick={onClose}></div>

      {/* Modal Dialog */}
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4 relative z-10 animate-fadeIn">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-md font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all focus:outline-none">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
