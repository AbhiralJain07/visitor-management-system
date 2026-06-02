import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment?: string) => Promise<void>;
  visitorName: string;
  isLoading?: boolean;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  visitorName,
  isLoading = false,
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(comment.trim() ? comment.trim() : undefined);
    setComment('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            Approve Visitor Entry
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
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Check size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Allow entry for visitor:
                </p>
                <p className="text-base font-extrabold text-emerald-600">
                  {visitorName}
                </p>
              </div>
            </div>

            {/* Optional Comment */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="comment">
                Approval Note (Optional)
              </label>
              <textarea
                id="comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isLoading}
                placeholder="e.g. Please send them to meeting room A"
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all custom-scrollbar resize-none"
              />
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
              className="flex-1 min-h-[44px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.97]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                'Approve Entry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalDialog;
