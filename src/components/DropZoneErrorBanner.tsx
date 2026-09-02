import React from 'react';
import { FileWarning } from 'lucide-react';

/**
 * ドロップゾーンエラーバナーのプロパティ定義
 */
export interface DropZoneErrorBannerProps {
  /** エラーメッセージ本文 */
  errorMessage: string;
  /** エラーメッセージ閉じるコールバック */
  onErrorDismiss?: () => void;
}

/**
 * 無効なファイル選択等のエラーメッセージを表示する通知バナー
 */
export const DropZoneErrorBanner: React.FC<DropZoneErrorBannerProps> = ({
  errorMessage,
  onErrorDismiss,
}) => {
  return (
    <div
      data-testid="error-message"
      className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between shadow-sm animate-fade-in"
    >
      <div className="flex items-center gap-2">
        <FileWarning className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <span className="text-sm font-medium">{errorMessage}</span>
      </div>
      {onErrorDismiss && (
        <button
          onClick={onErrorDismiss}
          className="text-xs px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium rounded transition cursor-pointer"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export default DropZoneErrorBanner;
