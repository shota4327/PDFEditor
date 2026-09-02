import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * ローディングオーバーレイコンポーネントのプロパティ定義
 */
interface LoadingOverlayProps {
  /** 読み込み・処理中フラグ */
  isLoading: boolean;
  /** 表示するメッセージ本文（省略可） */
  message?: string;
}

/**
 * PDFファイルの読み込み・処理中に表示する全画面半透明ローディングオーバーレイ
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'PDFドキュメントを処理中 & サムネイルを生成中...',
}) => {
  if (!isLoading) return null;

  return (
    <div
      data-testid="loading-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center transition-opacity duration-200 animate-in fade-in"
    >
      <div className="bg-white text-slate-900 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl border border-slate-200">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
