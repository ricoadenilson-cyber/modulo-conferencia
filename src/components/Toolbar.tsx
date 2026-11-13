import { Check, Copy, Download, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCopy: () => Promise<boolean>;
  onDownload: () => Promise<void>;
  onResetAll: () => void;
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  onCopy,
  onDownload,
  onResetAll,
}: ToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const copyTimerRef = useRef<number | null>(null);
  const downloadTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (downloadTimerRef.current) window.clearTimeout(downloadTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  const handleCopyClick = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadClick = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownload();
      setDownloaded(true);
      if (downloadTimerRef.current) window.clearTimeout(downloadTimerRef.current);
      downloadTimerRef.current = window.setTimeout(() => setDownloaded(false), 2000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => setConfirmReset(false), 3000);
      return;
    }

    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    setConfirmReset(false);
    onResetAll();
  };

  return (
    <section aria-label="Barra de ferramentas" className="space-y-2.5">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52607A] dark:text-[#98A6C3] pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por código ou descrição"
          aria-label="Buscar por código ou descrição"
          className="w-full h-[46px] pl-10 pr-10 rounded-[10px] bg-white dark:bg-[#192238] border border-[#DDE3EE] dark:border-[#2A3654] text-[16px] text-[#14213D] dark:text-[#E8EDF8] placeholder:text-[#7A87A0] dark:placeholder:text-[#7D8BA8] focus:outline-none focus:ring-2 focus:ring-[#1B2A4E] dark:focus:ring-[#4A68B0]"
        />
        {searchQuery !== '' && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Limpar busca"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-[8px] text-[#52607A] dark:text-[#98A6C3] hover:bg-[#F3F5F9] dark:hover:bg-[#232F4D]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleCopyClick}
          className="min-h-[44px] px-2.5 rounded-[10px] border border-[#DDE3EE] dark:border-[#2A3654] bg-white dark:bg-[#192238] text-[#14213D] dark:text-[#E8EDF8] text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check size={16} className="text-[#1E8E4E] shrink-0" />
              <span className="text-[#1E8E4E]">Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={16} className="shrink-0" />
              <span>Copiar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="min-h-[44px] px-2.5 rounded-[10px] bg-[#1B2A4E] dark:bg-[#253B6E] text-white text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform whitespace-nowrap disabled:opacity-75"
        >
          {downloaded ? (
            <>
              <Check size={16} className="shrink-0" />
              <span>Baixado!</span>
            </>
          ) : (
            <>
              <Download size={16} className="shrink-0" />
              <span>Baixar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleResetClick}
          className={`min-h-[44px] px-2.5 rounded-[10px] text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-colors whitespace-nowrap ${
            confirmReset
              ? 'bg-[#D33F3F] text-white border border-[#D33F3F]'
              : 'bg-white dark:bg-[#192238] text-[#14213D] dark:text-[#E8EDF8] border border-[#DDE3EE] dark:border-[#2A3654]'
          }`}
        >
          <RotateCcw size={15} className="shrink-0" />
          <span>{confirmReset ? 'Confirmar?' : 'Zerar'}</span>
        </button>
      </div>
    </section>
  );
}
