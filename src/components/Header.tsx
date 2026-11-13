import { formatDateBR, formatNumberBR } from '../utils/formatters';

interface HeaderProps {
  totalFardos: number;
  entradasFardos: number;
  saidasFardos: number;
  avariasFardos: number;
}

export function Header({
  totalFardos,
  entradasFardos,
  saidasFardos,
  avariasFardos,
}: HeaderProps) {
  const todayStr = formatDateBR(new Date());

  return (
    <header className="sticky top-0 z-30 bg-[#1B2A4E] text-white shadow-sm pt-[max(10px,env(safe-area-inset-top))] pb-2.5 px-3">
      <div className="max-w-[520px] mx-auto">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-[18px] font-bold tracking-tight whitespace-nowrap">
            Conferência
          </h1>
          <span className="text-[13px] font-medium text-white/85 tabular-nums whitespace-nowrap">
            {todayStr}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mt-2">
          <div className="bg-white/10 rounded-[10px] px-1.5 py-1.5 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-white/75">
              TOTAL
            </div>
            <div className="text-[15px] font-bold tabular-nums leading-tight mt-0.5 truncate">
              {formatNumberBR(totalFardos)}
            </div>
          </div>

          <div className="bg-white/10 rounded-[10px] px-1.5 py-1.5 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-[#7AE5A6]">
              ENTRADAS
            </div>
            <div className="text-[15px] font-bold tabular-nums leading-tight mt-0.5 truncate">
              {formatNumberBR(entradasFardos)}
            </div>
          </div>

          <div className="bg-white/10 rounded-[10px] px-1.5 py-1.5 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-[#FF9B9B]">
              SAÍDAS
            </div>
            <div className="text-[15px] font-bold tabular-nums leading-tight mt-0.5 truncate">
              {formatNumberBR(saidasFardos)}
            </div>
          </div>

          <div className="bg-white/10 rounded-[10px] px-1.5 py-1.5 text-center">
            <div className="text-[10px] font-semibold tracking-wide text-[#FFD07B]">
              AVARIAS
            </div>
            <div className="text-[15px] font-bold tabular-nums leading-tight mt-0.5 truncate">
              {formatNumberBR(avariasFardos)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
