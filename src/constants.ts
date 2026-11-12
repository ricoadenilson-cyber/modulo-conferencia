import { ItemEntryState, LineEntry, ProductDefinition } from './types';

export const FIXED_PRODUCTS: ProductDefinition[] = [
  { code: '59155', description: 'FT MD_OURO 25KG', unit: '25KG', defaultFardosPerPallet: 50 },
  { code: '59157', description: 'FT FINNA TIPO 1 PPL 1KG', unit: '1 KG', defaultFardosPerPallet: 108 },
  { code: '59159', description: 'FT FINNA FERM PPL 1KG', unit: '1 KG', defaultFardosPerPallet: 108 },
  { code: '10261', description: 'FT IMPERIAL 25KG', unit: '25KG', defaultFardosPerPallet: 50 },
  { code: '59190', description: 'FT D_PADEIRO 25KG', unit: '25KG', defaultFardosPerPallet: 50 },
  { code: '59183', description: 'FT MD_OURO EX_CLARA 25KG', unit: '25KG', defaultFardosPerPallet: 50 },
  { code: '59153', description: 'FT FINNA TIPO 1 PPL 5KG', unit: '5KG', defaultFardosPerPallet: 42 },
  { code: '59151', description: 'FT FINNA PASTEL PPL 5KG', unit: '5KG', defaultFardosPerPallet: 42 },
  { code: '59152', description: 'FT FINNA PIZZA PPL 5KG', unit: '5KG', defaultFardosPerPallet: 42 },
  { code: '59188', description: 'FT MD_OURO PASTEL 50KG', unit: '50KG', defaultFardosPerPallet: 20 },
];

export const createEmptyLine = (): LineEntry => ({
  paletes: '',
  fardos: '',
  updatedAtTime: null,
  updatedAtFull: null,
});

export const createInitialItemState = (product: ProductDefinition): ItemEntryState => ({
  code: product.code,
  fardosPerPallet: product.defaultFardosPerPallet,
  fardosPerPalletUpdatedAt: null,
  estoque: createEmptyLine(),
  entrada: createEmptyLine(),
  saida: createEmptyLine(),
  avaria: createEmptyLine(),
  lastUpdatedAt: null,
});

export const createInitialStateRecord = (): Record<string, ItemEntryState> => {
  const record: Record<string, ItemEntryState> = {};
  for (const product of FIXED_PRODUCTS) {
    record[product.code] = createInitialItemState(product);
  }
  return record;
};

export const STORAGE_KEY_DATA = 'modulo_conferencia_lancamentos_v1';
export const STORAGE_KEY_DATE = 'modulo_conferencia_data_dia_v1';
