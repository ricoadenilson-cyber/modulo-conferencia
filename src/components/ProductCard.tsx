import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { ItemEntryState, LineType, ProductDefinition } from '../types';
import { calculateItemTotals, formatNumberBR } from '../utils/formatters';

interface ProductCardProps {
  product: ProductDefinition;
  itemState: ItemEntryState;
  photoUrl: string | null;
  onLineChange: (
    code: string,
    line: LineType,
    field: 'paletes' | 'fardos',
    value: string
  ) => void;
  onFardosPerPalletChange: (code: string, value: string) => void;
  onPhotoSelected: (code: string, file: File) => void;
  onOpenPhotoModal: (code: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  itemState,
  photoUrl,
  onLineChange,
  onFardosPerPalletChange,
  onPhotoSelected,
  onOpenPhotoModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totals = calculateItemTotals(itemState);

  const handlePhotoClick = () => {
    if (photoUrl) {
      onOpenPhotoModal(product.code);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelected(product.code, file);
    }
    // reset input so same file can be chosen again if needed
    e.target.value = '';
  };

  const linesConfig: {
    type: LineType;
    label: string;
    labelColor: string;
    borderColor: string;
    calculated: number;
  }[] = [
    {
      type: 'estoque',
      label: 'Estoque',
      labelColor: 'text-[#1B2A4E] dark:text-blue-300',
      borderColor: 'border-[#CBD5E1] dark:border-slate-600 focus:border-[#1B2A4E] dark:focus:border-blue-400',
      calculated: totals.estoqueFardos,
    },
    {
      type: 'entrada',
      label: '+ Entrada',
      labelColor: 'text-[#1E8E4E] dark:text-emerald-400',
      borderColor: 'border-[#1E8E4E] focus:ring-1 focus:ring-[#1E8E4E]',
      calculated: totals.entradaFardos,
    },
    {
      type: 'saida',
      label: '− Saída',
      labelColor: 'text-[#D33F3F] dark:text-rose-400',
      borderColor: 'border-[#D33F3F] focus:ring-1 focus:ring-[#D33F3F]',
      calculated: totals.saidaFardos,
    },
    {
      type: 'avaria',
      label: 'Avaria',
      labelColor: 'text-[#E08A00] dark:text-amber-400',
      borderColor: 'border-[#E08A00] focus:ring-1 focus:ring-[#E08A00]',
      calculated: totals.avariaFardos,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#192238] border border-[#DDE3EE] dark:border-[#2A3654] rounded-[14px] p-3.5 shadow-xs transition-colors">
      {/* Hidden file input for camera/gallery */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 1. TOPO em 3 partes */}
      <div className="flex items-center gap-3 mb-3.5">
        {/* a) ESPAÇO DA FOTO (72x72px, cantos arredondados 12px) */}
        <div
          onClick={handlePhotoClick}
          className="w-[72px] h-[72px] min-w-[72px] min-h-[72px] rounded-[12px] overflow-hidden cursor-pointer flex-shrink-0 relative group select-none"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Foto de ${product.description}`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full rounded-[12px] border-2 border-dashed border-[#CBD5E1] dark:border-[#3B4B70] bg-[#F0F3F8] dark:bg-[#141C2E] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-400 transition-colors">
              <Camera size={22} strokeWidth={1.75} />
              <span className="text-[10px] font-medium mt-1 leading-none">Foto</span>
            </div>
          )}
        </div>

        {/* b) No centro: CÓDIGO (negrito) e descrição (cinza, menor) */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-[#14213D] dark:text-[#E8EDF8] tracking-tight">
              {product.code}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {product.unit}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 leading-snug">
            {product.description}
          </p>
        </div>

        {/* c) À direita: "Fardos/palete" com input numérico editável */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 leading-none">
            Fardos/palete
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={itemState.fardosPerPallet === 0 ? '' : itemState.fardosPerPallet}
            onChange={(e) => onFardosPerPalletChange(product.code, e.target.value)}
            placeholder="0"
            className="w-16 h-8 text-center text-[16px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#141C2E] border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4E] dark:focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 2. Linha de cabeçalho da grade: (vazio) | Paletes | Fardos | = Fardos */}
      <div className="grid grid-cols-[1.2fr_1fr_1fr_1.1fr] gap-1.5 pb-1 mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 border-b border-slate-100 dark:border-slate-800/80">
        <span />
        <span className="text-center">Paletes</span>
        <span className="text-center">Fardos</span>
        <span className="text-center">= Fardos</span>
      </div>

      {/* 3. Quatro linhas de dados */}
      <div className="space-y-1.5">
        {linesConfig.map((line) => {
          const entry = itemState[line.type];
          return (
            <div
              key={line.type}
              className="grid grid-cols-[1.2fr_1fr_1fr_1.1fr] gap-1.5 items-center py-0.5"
            >
              {/* Rótulo + HH:MM abaixo */}
              <div className="flex flex-col justify-center min-w-0 pr-1">
                <span className={`text-xs font-bold leading-tight truncate ${line.labelColor}`}>
                  {line.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight">
                  {entry.updatedAtTime || '—'}
                </span>
              </div>

              {/* Input Paletes */}
              <div>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={entry.paletes}
                  onChange={(e) =>
                    onLineChange(product.code, line.type, 'paletes', e.target.value)
                  }
                  className={`w-full h-9 text-center text-[16px] font-medium text-slate-900 dark:text-[#E8EDF8] bg-white dark:bg-[#141C2E] border rounded-lg focus:outline-none transition-colors ${line.borderColor}`}
                />
              </div>

              {/* Input Fardos */}
              <div>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={entry.fardos}
                  onChange={(e) =>
                    onLineChange(product.code, line.type, 'fardos', e.target.value)
                  }
                  className={`w-full h-9 text-center text-[16px] font-medium text-slate-900 dark:text-[#E8EDF8] bg-white dark:bg-[#141C2E] border rounded-lg focus:outline-none transition-colors ${line.borderColor}`}
                />
              </div>

              {/* = Fardos calculado */}
              <div className="text-center">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {formatNumberBR(line.calculated)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Linha "Total (fardos)" em destaque (fundo cinza-claro) */}
      <div className="mt-3 py-2 px-3 bg-[#F3F5F9] dark:bg-[#202B44] rounded-xl flex items-center justify-between border border-[#E2E8F0] dark:border-[#2D3B5C]">
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-wide text-slate-700 dark:text-slate-200 uppercase">
            Total (fardos)
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Estoque + Entrada − Saída − Avaria
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl sm:text-2xl font-black text-[#1B2A4E] dark:text-emerald-400">
            {formatNumberBR(totals.totalFardos)}
          </span>
        </div>
      </div>

      {/* 5. Rodapé do card, alinhado à direita: "Última alteração: dd/mm/aaaa hh:mm" */}
      <div className="mt-2 text-right">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {itemState.lastUpdatedAt
            ? `Última alteração: ${itemState.lastUpdatedAt}`
            : 'Sem lançamentos'}
        </span>
      </div>
    </div>
  );
};
