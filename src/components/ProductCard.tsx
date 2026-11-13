import { useEffect, useRef, useState } from 'react';
import type { FixedProduct, Movement, MovementType, ProductItemState } from '../types/inventory';
import {
  calcBales,
  computeItemTotals,
  formatDateTimeBR,
  formatNumberBR,
  formatTimeBR,
  getMovementLabel,
  parseOptionalInt,
  sanitizeIntegerInput,
} from '../utils/formatters';
import { ProductPhoto } from './ProductPhoto';

interface ProductCardProps {
  product: FixedProduct;
  item: ProductItemState;
  photoUrl?: string;
  resetSignal: number;
  onUpdateFardosPorPalete: (codigo: string, value: number | null) => void;
  onUpdateEstoque: (codigo: string, field: 'paletes' | 'fardos', value: number | null) => void;
  onAddMovement: (codigo: string, tipo: MovementType, paletes: number, fardos: number) => void;
  onUpdateMovement: (
    codigo: string,
    movementId: string,
    tipo: MovementType,
    paletes: number,
    fardos: number,
  ) => void;
  onDeleteMovement: (codigo: string, movementId: string) => void;
  onSavePhoto: (codigo: string, dataUrl: string) => void;
  onRemovePhoto: (codigo: string) => void;
}

const MOVEMENT_STYLES: Record<
  MovementType,
  {
    color: string;
    activeBtn: string;
    borderClass: string;
    bgTint: string;
    textClass: string;
  }
> = {
  entrada: {
    color: '#1E8E4E',
    activeBtn: 'bg-[#1E8E4E] text-white border-[#1E8E4E]',
    borderClass: 'border-[#1E8E4E]/45 dark:border-[#1E8E4E]/60',
    bgTint: 'bg-[#1E8E4E]/[0.04] dark:bg-[#1E8E4E]/[0.08]',
    textClass: 'text-[#1E8E4E] dark:text-[#45C279]',
  },
  saida: {
    color: '#D33F3F',
    activeBtn: 'bg-[#D33F3F] text-white border-[#D33F3F]',
    borderClass: 'border-[#D33F3F]/45 dark:border-[#D33F3F]/60',
    bgTint: 'bg-[#D33F3F]/[0.04] dark:bg-[#D33F3F]/[0.08]',
    textClass: 'text-[#D33F3F] dark:text-[#F06B6B]',
  },
  avaria: {
    color: '#E08A00',
    activeBtn: 'bg-[#E08A00] text-white border-[#E08A00]',
    borderClass: 'border-[#E08A00]/45 dark:border-[#E08A00]/60',
    bgTint: 'bg-[#E08A00]/[0.04] dark:bg-[#E08A00]/[0.08]',
    textClass: 'text-[#E08A00] dark:text-[#F5A82E]',
  },
};

export function ProductCard({
  product,
  item,
  photoUrl,
  resetSignal,
  onUpdateFardosPorPalete,
  onUpdateEstoque,
  onAddMovement,
  onUpdateMovement,
  onDeleteMovement,
  onSavePhoto,
  onRemovePhoto,
}: ProductCardProps) {
  const [selectedTipo, setSelectedTipo] = useState<MovementType>('entrada');
  const [draftPaletes, setDraftPaletes] = useState<string>('');
  const [draftFardos, setDraftFardos] = useState<string>('');
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const draftPaletesRef = useRef<HTMLInputElement | null>(null);
  const deleteTimerRef = useRef<number | null>(null);

  // Clear local draft/edit states when Zerar is confirmed
  useEffect(() => {
    if (resetSignal === 0) return;
    setSelectedTipo('entrada');
    setDraftPaletes('');
    setDraftFardos('');
    setEditingMovementId(null);
    setConfirmDeleteId(null);
    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  }, [resetSignal]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) window.clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const totals = computeItemTotals(item);
  const activeStyle = MOVEMENT_STYLES[selectedTipo];

  const orderedMovements = [...item.movimentos].sort((a, b) => b.timestamp - a.timestamp);

  const handleFppChange = (raw: string) => {
    onUpdateFardosPorPalete(product.codigo, parseOptionalInt(raw));
  };

  const handleFppBlur = () => {
    if (item.fardosPorPalete === null) {
      onUpdateFardosPorPalete(product.codigo, product.defaultFardosPorPalete);
    }
  };

  const handleSubmitMovement = () => {
    const paletes = parseOptionalInt(draftPaletes) ?? 0;
    const fardos = parseOptionalInt(draftFardos) ?? 0;

    if (paletes === 0 && fardos === 0) {
      draftPaletesRef.current?.focus();
      return;
    }

    if (editingMovementId) {
      onUpdateMovement(product.codigo, editingMovementId, selectedTipo, paletes, fardos);
      setEditingMovementId(null);
    } else {
      onAddMovement(product.codigo, selectedTipo, paletes, fardos);
    }

    setDraftPaletes('');
    setDraftFardos('');
  };

  const handleStartEdit = (mov: Movement) => {
    setEditingMovementId(mov.id);
    setSelectedTipo(mov.tipo);
    setDraftPaletes(mov.paletes > 0 ? String(mov.paletes) : '');
    setDraftFardos(mov.fardos > 0 ? String(mov.fardos) : '');
    draftPaletesRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMovementId(null);
    setSelectedTipo('entrada');
    setDraftPaletes('');
    setDraftFardos('');
  };

  const handleDeleteClick = (movId: string) => {
    if (confirmDeleteId !== movId) {
      setConfirmDeleteId(movId);
      if (deleteTimerRef.current) window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = window.setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }

    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setConfirmDeleteId(null);
    if (editingMovementId === movId) {
      handleCancelEdit();
    }
    onDeleteMovement(product.codigo, movId);
  };

  const inputBaseClass =
    'w-full h-[40px] rounded-[8px] border border-[#DDE3EE] dark:border-[#2A3654] bg-white dark:bg-[#0F1524] text-[#14213D] dark:text-[#E8EDF8] text-[16px] font-medium text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1B2A4E] dark:focus:ring-[#4A68B0]';

  return (
    <article className="bg-white dark:bg-[#192238] border border-[#DDE3EE] dark:border-[#2A3654] rounded-[14px] p-3 space-y-3">
      {/* 1. TOPO: Foto | Código + Descrição | Fardos/palete */}
      <div className="flex items-center gap-2.5">
        <ProductPhoto
          codigo={product.codigo}
          descricao={product.descricao}
          photoUrl={photoUrl}
          onSavePhoto={onSavePhoto}
          onRemovePhoto={onRemovePhoto}
        />

        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold text-[#14213D] dark:text-[#E8EDF8] tabular-nums leading-tight">
            {product.codigo}
          </div>
          <div
            title={product.descricao}
            className="text-[clamp(10.5px,2.9vw,12.5px)] font-medium text-[#52607A] dark:text-[#98A6C3] whitespace-nowrap tracking-[-0.015em] leading-snug mt-0.5 overflow-hidden text-ellipsis"
          >
            {product.descricao}
          </div>
        </div>

        <div className="w-[68px] shrink-0 flex flex-col items-center">
          <label
            htmlFor={`fpp-${product.codigo}`}
            className="text-[10.5px] font-medium text-[#52607A] dark:text-[#98A6C3] whitespace-nowrap mb-1 leading-none"
          >
            Fardos/palete
          </label>
          <input
            id={`fpp-${product.codigo}`}
            type="number"
            inputMode="numeric"
            min={0}
            value={item.fardosPorPalete === null ? '' : String(item.fardosPorPalete)}
            onChange={(e) => handleFppChange(e.target.value)}
            onBlur={handleFppBlur}
            className="w-full h-[38px] rounded-[8px] border border-[#DDE3EE] dark:border-[#2A3654] bg-[#F3F5F9] dark:bg-[#0F1524] text-[#14213D] dark:text-[#E8EDF8] text-[16px] font-semibold text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1B2A4E] dark:focus:ring-[#4A68B0]"
          />
        </div>
      </div>

      {/* 2. Cabeçalho da grade + 3. Linha ESTOQUE */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-[minmax(68px,1fr)_64px_64px_76px] sm:grid-cols-[1fr_76px_76px_88px] gap-1.5 items-center text-[11px] font-semibold text-[#52607A] dark:text-[#98A6C3]">
          <div />
          <div className="text-center">Paletes</div>
          <div className="text-center">Fardos</div>
          <div className="text-center">= Fardos</div>
        </div>

        <div className="grid grid-cols-[minmax(68px,1fr)_64px_64px_76px] sm:grid-cols-[1fr_76px_76px_88px] gap-1.5 items-center">
          <div className="pr-1">
            <div className="text-[13px] font-semibold text-[#14213D] dark:text-[#E8EDF8] leading-tight">
              Estoque
            </div>
            {item.estoque.updatedAt && (
              <div className="text-[11px] text-[#52607A] dark:text-[#98A6C3] tabular-nums leading-tight mt-0.5">
                {formatTimeBR(item.estoque.updatedAt)}
              </div>
            )}
          </div>

          <input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label={`Estoque paletes ${product.codigo}`}
            value={item.estoque.paletes === null ? '' : String(item.estoque.paletes)}
            onChange={(e) =>
              onUpdateEstoque(product.codigo, 'paletes', parseOptionalInt(e.target.value))
            }
            className={inputBaseClass}
          />

          <input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label={`Estoque fardos ${product.codigo}`}
            value={item.estoque.fardos === null ? '' : String(item.estoque.fardos)}
            onChange={(e) =>
              onUpdateEstoque(product.codigo, 'fardos', parseOptionalInt(e.target.value))
            }
            className={inputBaseClass}
          />

          <div className="text-[15px] font-bold text-center text-[#14213D] dark:text-[#E8EDF8] tabular-nums">
            {formatNumberBR(totals.estoqueFardos)}
          </div>
        </div>
      </div>

      {/* 4. Bloco NOVO MOVIMENTO */}
      <div
        className={`rounded-[12px] border p-2.5 space-y-2.5 transition-colors ${activeStyle.borderClass} ${activeStyle.bgTint}`}
      >
        <div className="text-[12px] font-semibold text-[#14213D] dark:text-[#E8EDF8]">
          {editingMovementId ? 'Editando movimento' : 'Novo movimento'}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(['entrada', 'saida', 'avaria'] as MovementType[]).map((tipo) => {
            const isSelected = selectedTipo === tipo;
            const style = MOVEMENT_STYLES[tipo];
            const label =
              tipo === 'entrada' ? '+ Entrada' : tipo === 'saida' ? '− Saída' : 'Avaria';

            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setSelectedTipo(tipo)}
                className={`min-h-[40px] px-1.5 rounded-[10px] border text-[13px] font-semibold transition-colors whitespace-nowrap active:scale-[0.98] ${
                  isSelected
                    ? style.activeBtn
                    : 'bg-white dark:bg-[#192238] border-[#DDE3EE] dark:border-[#2A3654] text-[#52607A] dark:text-[#C0CBE0]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_1fr_1.15fr] gap-1.5 items-end">
          <div>
            <label
              htmlFor={`mov-pal-${product.codigo}`}
              className="block text-[11px] font-medium text-[#52607A] dark:text-[#98A6C3] text-center mb-1"
            >
              Paletes
            </label>
            <input
              ref={draftPaletesRef}
              id={`mov-pal-${product.codigo}`}
              type="number"
              inputMode="numeric"
              min={0}
              value={draftPaletes}
              onChange={(e) => setDraftPaletes(sanitizeIntegerInput(e.target.value))}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor={`mov-fd-${product.codigo}`}
              className="block text-[11px] font-medium text-[#52607A] dark:text-[#98A6C3] text-center mb-1"
            >
              Fardos
            </label>
            <input
              id={`mov-fd-${product.codigo}`}
              type="number"
              inputMode="numeric"
              min={0}
              value={draftFardos}
              onChange={(e) => setDraftFardos(sanitizeIntegerInput(e.target.value))}
              className={inputBaseClass}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmitMovement}
            style={{ backgroundColor: activeStyle.color }}
            className="h-[40px] px-2 rounded-[10px] text-white text-[14px] font-semibold active:scale-[0.98] transition-transform whitespace-nowrap"
          >
            {editingMovementId ? 'Salvar' : 'Lançar'}
          </button>
        </div>

        {editingMovementId && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="w-full min-h-[38px] rounded-[10px] border border-[#DDE3EE] dark:border-[#2A3654] bg-white dark:bg-[#192238] text-[#52607A] dark:text-[#C0CBE0] text-[13px] font-semibold active:scale-[0.99] transition-transform"
          >
            Cancelar edição
          </button>
        )}
      </div>

      {/* 5. Três quadradinhos de totais por tipo */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[10px] border border-[#1E8E4E]/30 bg-[#1E8E4E]/[0.06] dark:bg-[#1E8E4E]/15 px-2 py-1.5 text-center">
          <div className="text-[11px] font-semibold text-[#1E8E4E] dark:text-[#45C279]">
            Entradas
          </div>
          <div className="text-[15px] font-bold text-[#1E8E4E] dark:text-[#45C279] tabular-nums">
            {formatNumberBR(totals.entradasFardos)}
          </div>
        </div>

        <div className="rounded-[10px] border border-[#D33F3F]/30 bg-[#D33F3F]/[0.06] dark:bg-[#D33F3F]/15 px-2 py-1.5 text-center">
          <div className="text-[11px] font-semibold text-[#D33F3F] dark:text-[#F06B6B]">
            Saídas
          </div>
          <div className="text-[15px] font-bold text-[#D33F3F] dark:text-[#F06B6B] tabular-nums">
            {formatNumberBR(totals.saidasFardos)}
          </div>
        </div>

        <div className="rounded-[10px] border border-[#E08A00]/30 bg-[#E08A00]/[0.06] dark:bg-[#E08A00]/15 px-2 py-1.5 text-center">
          <div className="text-[11px] font-semibold text-[#E08A00] dark:text-[#F5A82E]">
            Avarias
          </div>
          <div className="text-[15px] font-bold text-[#E08A00] dark:text-[#F5A82E] tabular-nums">
            {formatNumberBR(totals.avariasFardos)}
          </div>
        </div>
      </div>

      {/* 6. Linha Total (fardos) em destaque */}
      <div className="rounded-[10px] bg-[#F3F5F9] dark:bg-[#131B2E] px-3 py-2.5 flex items-center justify-between gap-2">
        <span className="text-[14px] font-bold text-[#14213D] dark:text-[#E8EDF8]">
          Total (fardos)
        </span>
        <span className="text-[22px] font-bold text-[#14213D] dark:text-[#E8EDF8] tabular-nums leading-none">
          {formatNumberBR(totals.totalFardos)}
        </span>
      </div>

      {/* 7. Seção Movimentos do dia */}
      <div className="space-y-1.5 pt-0.5">
        <div className="text-[12px] font-semibold text-[#52607A] dark:text-[#98A6C3]">
          Movimentos do dia
        </div>

        {orderedMovements.length === 0 ? (
          <div className="text-[12.5px] text-[#7A87A0] dark:text-[#7D8BA8] py-1">
            Nenhum movimento lançado
          </div>
        ) : (
          <ul className="divide-y divide-[#EDF1F7] dark:divide-[#24304C]">
            {orderedMovements.map((mov) => {
              const movBales = calcBales(mov.paletes, mov.fardos, totals.fardosPorPalete);
              const style = MOVEMENT_STYLES[mov.tipo];
              const isConfirmingDelete = confirmDeleteId === mov.id;
              const isBeingEdited = editingMovementId === mov.id;

              return (
                <li
                  key={mov.id}
                  className={`py-1.5 flex items-center justify-between gap-1.5 text-[12.5px] ${
                    isBeingEdited ? 'bg-[#1B2A4E]/[0.05] dark:bg-white/[0.05] -mx-1.5 px-1.5 rounded-[8px]' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-[11.5px] text-[#52607A] dark:text-[#98A6C3] tabular-nums shrink-0">
                      {formatTimeBR(mov.timestamp)}
                    </span>
                    <span className={`font-semibold shrink-0 ${style.textClass}`}>
                      {getMovementLabel(mov.tipo)}
                    </span>
                    <span className="text-[#14213D] dark:text-[#E8EDF8] tabular-nums whitespace-nowrap">
                      {mov.paletes} pal + {mov.fardos} fd ={' '}
                      <strong className="font-bold">{formatNumberBR(movBales)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(mov)}
                      aria-label="Editar movimento"
                      className="min-h-[34px] min-w-[34px] px-2 rounded-[8px] border border-[#DDE3EE] dark:border-[#2A3654] bg-white dark:bg-[#0F1524] text-[#14213D] dark:text-[#E8EDF8] text-[14px] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClick(mov.id)}
                      aria-label={isConfirmingDelete ? 'Confirmar exclusão' : 'Excluir movimento'}
                      className={`min-h-[34px] px-2 rounded-[8px] text-[12px] font-semibold flex items-center justify-center transition-colors whitespace-nowrap ${
                        isConfirmingDelete
                          ? 'bg-[#D33F3F] text-white border border-[#D33F3F]'
                          : 'min-w-[34px] border border-[#DDE3EE] dark:border-[#2A3654] bg-white dark:bg-[#0F1524] text-[#52607A] dark:text-[#98A6C3] text-[13px]'
                      }`}
                    >
                      {isConfirmingDelete ? 'Confirmar?' : '✕'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 8. Rodapé do card */}
      <div className="pt-1 border-t border-[#EDF1F7] dark:border-[#24304C] text-right text-[11px] text-[#7A87A0] dark:text-[#7D8BA8] tabular-nums">
        {item.lastModifiedAt
          ? `Última alteração: ${formatDateTimeBR(item.lastModifiedAt)}`
          : 'Sem lançamentos'}
      </div>
    </article>
  );
}
