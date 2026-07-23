import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header
      data-testid="header"
      className="bg-slate-900 border-b border-slate-800 text-white px-6 py-2 flex items-center justify-between shadow-md"
    >
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

      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>100% Offline Client-Side</span>
      </div>
    </header>
  );
};

export default Header;
