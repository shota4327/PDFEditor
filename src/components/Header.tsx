import React, { useRef } from 'react';
import { FileText, ShieldCheck, FolderOpen } from 'lucide-react';

/**
 * ヘッダーコンポーネントのプロパティ定義
 */
interface HeaderProps {
  /** ファイル選択時のコールバック */
  onFilesSelected?: (files: File[]) => void;
  /** 読み込み・処理中フラグ */
  isProcessing?: boolean;
}

/**
 * アプリケーションの共通ヘッダーコンポーネント
 * アプリ名、ファイル読み込みボタン、オフライン保証バッジを表示します
 */
export const Header: React.FC<HeaderProps> = ({
  onFilesSelected,
  isProcessing = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      if (onFilesSelected && files.length > 0) {
        onFilesSelected(files);
      }
      e.target.value = '';
    }
  };

  const handleClickOpen = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <header
      data-testid="header"
      className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-md"
    >
      <input
        ref={fileInputRef}
        data-testid="header-file-input"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-inner text-white font-bold">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-bold tracking-tight text-white">
            PDFEditor
          </h1>
          <span className="text-xs text-slate-400 hidden sm:inline">
            オフライン完結型PDF編集ツール
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          data-testid="header-open-file-btn"
          onClick={handleClickOpen}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg shadow transition-colors cursor-pointer"
          title="PDFファイルを開く / 追加"
        >
          <FolderOpen className="w-4 h-4" />
          <span>ファイルを開く</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">100% Offline Client-Side</span>
          <span className="sm:hidden">Offline</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
