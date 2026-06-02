import React from 'react';
import { LogOut, X, Loader2 } from 'lucide-react';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  visitorName: string;
  isLoading?: boolean;
}

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  visitorName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden transition-all transform scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <LogOut size={16} className="text-blue-600" />
            Confirm Checkout
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <LogOut size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Are you sure you want to check out?
            </p>
            <p className="text-base font-extrabold text-blue-600">
              {visitorName}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              This will record their checkout timestamp and end their active visit log.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex p-4 border-t border-slate-100 bg-slate-50/50 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-h-[44px] text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 min-h-[44px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              'Confirm Checkout'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutDialog;
