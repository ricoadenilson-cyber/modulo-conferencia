export interface ProductDefinition {
  code: string;
  description: string;
  unit: string;
  defaultFardosPerPallet: number;
}

export interface LineEntry {
  paletes: number | '';
  fardos: number | '';
  updatedAtTime: string | null; // "HH:MM"
  updatedAtFull: string | null; // "DD/MM/AAAA HH:MM"
}

export interface ItemEntryState {
  code: string;
  fardosPerPallet: number;
  fardosPerPalletUpdatedAt: string | null;
  estoque: LineEntry;
  entrada: LineEntry;
  saida: LineEntry;
  avaria: LineEntry;
  lastUpdatedAt: string | null; // "DD/MM/AAAA HH:MM"
}

export type LineType = 'estoque' | 'entrada' | 'saida' | 'avaria';

export interface CalculatedLineTotals {
  estoqueFardos: number;
  entradaFardos: number;
  saidaFardos: number;
  avariaFardos: number;
  totalFardos: number;
}
