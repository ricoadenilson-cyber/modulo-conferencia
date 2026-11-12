import { CalculatedLineTotals, ItemEntryState, LineEntry } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTodayDisplay(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentDateTimeFormatted(): string {
  const date = formatTodayDisplay();
  const time = getCurrentTimeHHMM();
  return `${date} ${time}`;
}

export function formatNumberBR(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function calculateLineFardos(
  line: LineEntry,
  fardosPerPallet: number
): number {
  const p = typeof line.paletes === 'number' ? line.paletes : 0;
  const f = typeof line.fardos === 'number' ? line.fardos : 0;
  return (p * fardosPerPallet) + f;
}

export function calculateItemTotals(item: ItemEntryState): CalculatedLineTotals {
  const fpp = item.fardosPerPallet || 0;
  const estoqueFardos = calculateLineFardos(item.estoque, fpp);
  const entradaFardos = calculateLineFardos(item.entrada, fpp);
  const saidaFardos = calculateLineFardos(item.saida, fpp);
  const avariaFardos = calculateLineFardos(item.avaria, fpp);
  const totalFardos = estoqueFardos + entradaFardos - saidaFardos - avariaFardos;

  return {
    estoqueFardos,
    entradaFardos,
    saidaFardos,
    avariaFardos,
    totalFardos,
  };
}

export function hasAnyLineEntry(item: ItemEntryState): boolean {
  const check = (l: LineEntry) => l.paletes !== '' || l.fardos !== '';
  return check(item.estoque) || check(item.entrada) || check(item.saida) || check(item.avaria);
}
