import React from 'react';
import { formatNumberBR, formatTodayDisplay } from '../utils/formatters';

interface HeaderProps {
  grandTotal: number;
  grandEntradas: number;
  grandSaidas: number;
  grandAvarias: number;
}

export const Header: React.FC<HeaderProps> = ({
  grandTotal,
  grandEntradas,
  grandSaidas,
  grandAvarias,
}) => {
  const todayFormatted = formatTodayDisplay();

  return (
    <header className="sticky top-0 z-30 bg-[#1B2A4E] text-white shadow-md pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 px-4">
      {/* Top row: Title and Date */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-6 bg-emerald-400 rounded-full" />
          <h1 className="text-xl font-bold tracking-tight">Conferência</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium tracking-wide">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* 4 Mini-cards in grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {/* TOTAL */}
        <div className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl p-2 text-center flex flex-col justify-between border border-white/10">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-200">
            TOTAL
          </span>
          <span className="text-base sm:text-lg font-extrabold text-white truncate my-0.5">
            {formatNumberBR(grandTotal)}
          </span>
          <span className="text-[9px] text-blue-200/80">fardos</span>
        </div>

        {/* ENTRADAS */}
        <div className="bg-[#1E8E4E]/20 hover:bg-[#1E8E4E]/30 transition-colors rounded-xl p-2 text-center flex flex-col justify-between border border-[#1E8E4E]/40">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-300">
            ENTRADAS
          </span>
          <span className="text-base sm:text-lg font-extrabold text-emerald-300 truncate my-0.5">
            {formatNumberBR(grandEntradas)}
          </span>
          <span className="text-[9px] text-emerald-200/70">fardos</span>
        </div>

        {/* SAÍDAS */}
        <div className="bg-[#D33F3F]/20 hover:bg-[#D33F3F]/30 transition-colors rounded-xl p-2 text-center flex flex-col justify-between border border-[#D33F3F]/40">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-300">
            SAÍDAS
          </span>
          <span className="text-base sm:text-lg font-extrabold text-rose-300 truncate my-0.5">
            {formatNumberBR(grandSaidas)}
          </span>
          <span className="text-[9px] text-rose-200/70">fardos</span>
        </div>

        {/* AVARIAS */}
        <div className="bg-[#E08A00]/20 hover:bg-[#E08A00]/30 transition-colors rounded-xl p-2 text-center flex flex-col justify-between border border-[#E08A00]/40">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-300">
            AVARIAS
          </span>
          <span className="text-base sm:text-lg font-extrabold text-amber-300 truncate my-0.5">
            {formatNumberBR(grandAvarias)}
          </span>
          <span className="text-[9px] text-amber-200/70">fardos</span>
        </div>
      </div>
    </header>
  );
};
