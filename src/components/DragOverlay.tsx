import React from 'react';
import { UploadCloud } from 'lucide-react';

/**
 * ドラッグオーバーレイコンポーネントのプロパティ定義
 */
interface DragOverlayProps {
  /** オーバーレイを表示するかどうか */
  isDragging: boolean;
}

/**
 * 画面全体にファイルがドラッグされた際に表示する半透明オーバーレイ
 */
export const DragOverlay: React.FC<DragOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div
      data-testid="global-drag-overlay"
      className="fixed inset-0 z-50 bg-indigo-950/70 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none transition-opacity duration-200 animate-in fade-in"
    >
      <div className="bg-white/95 text-slate-900 border-2 border-dashed border-indigo-500 rounded-3xl p-10 flex flex-col items-center gap-4 shadow-2xl scale-105 transition-transform duration-200">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 animate-bounce">
          <UploadCloud className="w-10 h-10" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-800">
            ここにPDFファイルをドロップ
          </h2>
          <p className="text-sm font-medium text-slate-500">
            複数ファイルの一括追加に対応しています
          </p>
        </div>
      </div>
    </div>
  );
};

export default DragOverlay;
