export type MovementType = 'entrada' | 'saida' | 'avaria';

export interface FixedProduct {
  codigo: string;
  descricao: string;
  defaultFardosPorPalete: number;
}

export interface Movement {
  id: string;
  tipo: MovementType;
  paletes: number;
  fardos: number;
  timestamp: number;
}

export interface StockEntry {
  paletes: number | null;
  fardos: number | null;
  updatedAt: number | null;
}

export interface ProductItemState {
  codigo: string;
  fardosPorPalete: number | null;
  estoque: StockEntry;
  movimentos: Movement[];
  lastModifiedAt: number | null;
}

export interface DailyInventoryStorage {
  date: string;
  items: Record<string, ProductItemState>;
}

export interface ItemTotals {
  fardosPorPalete: number;
  estoqueFardos: number;
  entradasFardos: number;
  saidasFardos: number;
  avariasFardos: number;
  entradasCount: number;
  saidasCount: number;
  avariasCount: number;
  totalFardos: number;
}
