import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, RotateCcw, Search, X } from 'lucide-react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCopy: () => Promise<void>;
  onDownload: () => Promise<void>;
  onReset: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onCopy,
  onDownload,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopyClick = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownloadClick = async () => {
    await onDownload();
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 2000);
  };

  const handleResetClick = () => {
    if (!confirmingReset) {
      // 1st touch: turn red and show "Confirmar?"
      setConfirmingReset(true);
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(() => {
        setConfirmingReset(false);
        resetTimerRef.current = null;
      }, 3000);
    } else {
      // 2nd touch within 3 seconds: execute reset
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      setConfirmingReset(false);
      onReset();
    }
  };

  return (
    <div className="px-4 py-3 bg-[#F3F5F9] dark:bg-[#0F1524] flex flex-col gap-2.5 transition-colors">
      {/* Campo de Busca */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por código ou descrição..."
          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#192238] text-slate-900 dark:text-[#E8EDF8] text-sm sm:text-base rounded-[10px] border border-[#DDE3EE] dark:border-[#2A3654] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2A4E] dark:focus:ring-blue-500 shadow-xs transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Limpar busca"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 3 Botões de Ação */}
      <div className="grid grid-cols-3 gap-2">
        {/* Copiar */}
        <button
          type="button"
          onClick={handleCopyClick}
          className={`h-11 px-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white dark:bg-[#192238] text-slate-700 dark:text-slate-200 border-[#DDE3EE] dark:border-[#2A3654] hover:bg-slate-50 dark:hover:bg-[#222E4A] active:scale-[0.98]'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>

        {/* Baixar */}
        <button
          type="button"
          onClick={handleDownloadClick}
          className={`h-11 px-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
            downloaded
              ? 'bg-emerald-600 text-white'
              : 'bg-[#1B2A4E] text-white hover:bg-[#243763] active:scale-[0.98]'
          }`}
        >
          {downloaded ? <Check size={16} /> : <Download size={16} />}
          <span>{downloaded ? 'Baixado!' : 'Baixar'}</span>
        </button>

        {/* Zerar (com 2 toques) */}
        <button
          type="button"
          onClick={handleResetClick}
          className={`h-11 px-2 rounded-[10px] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
            confirmingReset
              ? 'bg-[#D33F3F] text-white border-[#D33F3F] animate-pulse ring-2 ring-red-300'
              : 'bg-white dark:bg-[#192238] text-slate-700 dark:text-slate-200 border-[#DDE3EE] dark:border-[#2A3654] hover:bg-slate-50 dark:hover:bg-[#222E4A] active:scale-[0.98]'
          }`}
        >
          <RotateCcw size={16} />
          <span>{confirmingReset ? 'Confirmar?' : 'Zerar'}</span>
        </button>
      </div>
    </div>
  );
};
