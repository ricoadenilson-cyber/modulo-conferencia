import type { ItemTotals, MovementType, ProductItemState } from '../types/inventory';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

export function formatDateBR(dateOrTs: Date | number = new Date()): string {
  const d = typeof dateOrTs === 'number' ? new Date(dateOrTs) : dateOrTs;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatTimeBR(timestamp: number): string {
  const d = new Date(timestamp);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatDateTimeBR(timestamp: number): string {
  return `${formatDateBR(timestamp)} ${formatTimeBR(timestamp)}`;
}

export function formatNumberBR(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function calcBales(
  paletes: number | null | undefined,
  fardos: number | null | undefined,
  fardosPorPalete: number | null | undefined,
): number {
  const p = paletes ?? 0;
  const f = fardos ?? 0;
  const fpp = fardosPorPalete ?? 0;
  return p * fpp + f;
}

export function computeItemTotals(state: ProductItemState): ItemTotals {
  const fpp = state.fardosPorPalete ?? 0;
  const estoqueFardos = calcBales(state.estoque.paletes, state.estoque.fardos, fpp);

  let entradasFardos = 0;
  let saidasFardos = 0;
  let avariasFardos = 0;
  let entradasCount = 0;
  let saidasCount = 0;
  let avariasCount = 0;

  for (const mov of state.movimentos) {
    const qty = calcBales(mov.paletes, mov.fardos, fpp);
    if (mov.tipo === 'entrada') {
      entradasFardos += qty;
      entradasCount += 1;
    } else if (mov.tipo === 'saida') {
      saidasFardos += qty;
      saidasCount += 1;
    } else {
      avariasFardos += qty;
      avariasCount += 1;
    }
  }

  const totalFardos = estoqueFardos + entradasFardos - saidasFardos - avariasFardos;

  return {
    fardosPorPalete: fpp,
    estoqueFardos,
    entradasFardos,
    saidasFardos,
    avariasFardos,
    entradasCount,
    saidasCount,
    avariasCount,
    totalFardos,
  };
}

export function getMovementLabel(tipo: MovementType): string {
  if (tipo === 'entrada') return 'Entrada';
  if (tipo === 'saida') return 'Saída';
  return 'Avaria';
}

export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function parseOptionalInt(raw: string): number | null {
  const cleaned = sanitizeIntegerInput(raw);
  if (cleaned === '') return null;
  const num = Number.parseInt(cleaned, 10);
  return Number.isNaN(num) ? null : Math.max(0, num);
}
