import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../hooks/usePdfPages';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

/**
 * 画面右下に表示される操作結果通知（トースト）コンポーネント
 */
export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div
      data-testid="toast-notification"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
        toast.type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : toast.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-indigo-50 border-indigo-200 text-indigo-800'
      }`}
    >
      {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
      {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600 shrink-0" />}
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-0.5 ml-2 cursor-pointer"
        aria-label="閉じる"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
