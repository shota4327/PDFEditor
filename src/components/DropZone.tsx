import React, { useRef, useState } from 'react';
import { UploadCloud, FilePlus, Loader2, FileWarning } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected?: (files: File[]) => void;
  onFilesAdded?: (files: File[]) => void;
  errorMessage?: string | null;
  onErrorDismiss?: () => void;
  isProcessing?: boolean;
  compact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onFilesAdded,
  errorMessage,
  onErrorDismiss,
  isProcessing = false,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
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
              className="text-xs px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium rounded transition"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div
        data-testid="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative w-full border-2 border-dashed rounded-2xl py-16 px-10 min-h-[250px] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-inner'
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/80 shadow-sm'
        }`}
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

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-700">
              PDFファイルを処理中...
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default DropZone;
