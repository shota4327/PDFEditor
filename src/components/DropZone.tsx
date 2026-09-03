import React, { useRef } from 'react';
import { UploadCloud, FilePlus, Loader2 } from 'lucide-react';
import DropZoneErrorBanner from './DropZoneErrorBanner';

/**
 * ファイルドロップゾーンコンポーネントのプロパティ定義
 */
interface DropZoneProps {
  /** ファイル選択時のコールバック */
  onFilesSelected?: (files: File[]) => void;
  /** 追加ファイル選択時のコールバック */
  onFilesAdded?: (files: File[]) => void;
  /** 表示するエラーメッセージ（無効ファイル等） */
  errorMessage?: string | null;
  /** エラーメッセージ消去コールバック */
  onErrorDismiss?: () => void;
  /** 読み込み処理中フラグ */
  isProcessing?: boolean;
  /** コンパクト表示モードフラグ */
  compact?: boolean;
}

/**
 * PDF ファイルのドラッグ＆ドロップおよび選択ダイアログを提供するドロップゾーン
 */
export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onFilesAdded,
  errorMessage,
  onErrorDismiss,
  isProcessing = false,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (onFilesSelected) {
      onFilesSelected(files);
    }
    if (onFilesAdded && onFilesAdded !== onFilesSelected) {
      onFilesAdded(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          data-testid="file-input"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          data-testid="add-files-btn"
          onClick={handleClick}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow transition-colors cursor-pointer"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FilePlus className="w-4 h-4" />
          )}
          <span>PDFファイルを追加</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {errorMessage && (
        <DropZoneErrorBanner
          errorMessage={errorMessage}
          onErrorDismiss={onErrorDismiss}
        />
      )}

      <div
        data-testid="dropzone"
        onClick={handleClick}
        className="relative w-full border-2 border-dashed border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/80 rounded-2xl py-16 px-10 min-h-[250px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-sm"
      >
        <input
          ref={fileInputRef}
          data-testid="file-input"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center gap-4 pointer-events-none py-3">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">
              PDFファイルをドラッグ＆ドロップ
            </p>
            <p className="text-sm text-slate-500 mt-1">
              またはクリックしてファイルを選択（複数選択可）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
