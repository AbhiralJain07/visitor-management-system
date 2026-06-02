import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface RejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  visitorName: string;
  isLoading?: boolean;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  visitorName,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Rejection reason is required.');
      return;
    }
    setErrorMsg(null);
    await onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            Reject Visitor Entry
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Deny entry for visitor:
                </p>
                <p className="text-base font-extrabold text-red-600">
                  {visitorName}
                </p>
              </div>
            </div>

            {/* Mandatory Rejection Reason */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="reason">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows={2}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setErrorMsg(null);
                }}
                disabled={isLoading}
                placeholder="e.g. Busy in meeting / Not expecting anyone"
                className={`w-full text-xs bg-white border rounded-xl px-3 py-2.5 focus:ring-1 focus:outline-none transition-all custom-scrollbar resize-none ${
                  errorMsg ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {errorMsg && <p className="text-[10px] text-red-500 font-semibold">{errorMsg}</p>}
            </div>
          </div>

          {/* Footer Actions */}
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
              type="submit"
              disabled={isLoading}
              className="flex-1 min-h-[44px] text-xs font-bold text-white bg-red-600 hover:bg-red-750 rounded-xl shadow-md shadow-red-500/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.97]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                'Reject Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionDialog;
