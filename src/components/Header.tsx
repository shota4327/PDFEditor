import React, { useRef } from 'react';
import { FolderOpen } from 'lucide-react';

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
 * アプリ名およびファイル読み込みボタンを表示します
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

      <div className="flex items-baseline gap-2.5">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
          PDFEditor
        </h1>
        <span className="text-xs text-slate-400 hidden sm:inline">
          オフライン完結型PDF編集ツール
        </span>
      </div>

      <div>
        <button
          type="button"
          data-testid="header-open-file-btn"
          onClick={handleClickOpen}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg shadow transition-colors cursor-pointer"
          title="PDFファイルを開く / 追加"
        >
          <FolderOpen className="w-4 h-4" />
          <span>ファイルを開く</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
