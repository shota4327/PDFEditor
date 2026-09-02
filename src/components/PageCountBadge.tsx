import React from 'react';
import { FileText } from 'lucide-react';

/**
 * ページ数バッジコンポーネントのプロパティ定義
 */
export interface PageCountBadgeProps {
  /** 読み込まれている総ページ数 */
  pageCount: number;
}

/**
 * 読み込まれている PDF の総ページ数を表示するバッジコンポーネント
 */
export const PageCountBadge: React.FC<PageCountBadgeProps> = ({ pageCount }) => {
  return (
    <div
      data-testid="page-count-badge"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-900 rounded-lg text-xs font-semibold"
      title={`現在の総ページ数: ${pageCount}`}
    >
      <FileText className="w-3.5 h-3.5 text-indigo-600" />
      <span>ページ数:</span>
      <span data-testid="page-count" className="font-bold text-indigo-600 font-mono text-sm">
        {pageCount}
      </span>
    </div>
  );
};

export default PageCountBadge;
