import { PRODUCTS } from '../data/products';
import type { DailyInventoryStorage, ProductItemState } from '../types/inventory';
import { getTodayKey } from './formatters';

const DAILY_STORAGE_KEY = 'modulo_conferencia_dados_v1';
const PHOTO_KEY_PREFIX = 'foto_';

export function createEmptyItemsState(): Record<string, ProductItemState> {
  const items: Record<string, ProductItemState> = {};
  for (const product of PRODUCTS) {
    items[product.codigo] = {
      codigo: product.codigo,
      fardosPorPalete: product.defaultFardosPorPalete,
      estoque: {
        paletes: null,
        fardos: null,
        updatedAt: null,
      },
      movimentos: [],
      lastModifiedAt: null,
    };
  }
  return items;
}

export function loadDailyState(): Record<string, ProductItemState> {
  const today = getTodayKey();
  const empty = createEmptyItemsState();

  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) {
      saveDailyState(empty);
      return empty;
    }

    const parsed = JSON.parse(raw) as Partial<DailyInventoryStorage>;
    if (!parsed || parsed.date !== today || !parsed.items) {
      // New day or invalid payload: clear all daily entries while keeping product photos intact
      saveDailyState(empty);
      return empty;
    }

    const hydrated: Record<string, ProductItemState> = {};
    for (const product of PRODUCTS) {
      const saved = parsed.items[product.codigo];
      if (!saved) {
        hydrated[product.codigo] = empty[product.codigo];
        continue;
      }

      hydrated[product.codigo] = {
        codigo: product.codigo,
        fardosPorPalete:
          typeof saved.fardosPorPalete === 'number' && saved.fardosPorPalete >= 0
            ? saved.fardosPorPalete
            : product.defaultFardosPorPalete,
        estoque: {
          paletes:
            typeof saved.estoque?.paletes === 'number' && saved.estoque.paletes >= 0
              ? saved.estoque.paletes
              : null,
          fardos:
            typeof saved.estoque?.fardos === 'number' && saved.estoque.fardos >= 0
              ? saved.estoque.fardos
              : null,
          updatedAt:
            typeof saved.estoque?.updatedAt === 'number' ? saved.estoque.updatedAt : null,
        },
        movimentos: Array.isArray(saved.movimentos)
          ? saved.movimentos.filter(
              (m) =>
                m &&
                typeof m.id === 'string' &&
                (m.tipo === 'entrada' || m.tipo === 'saida' || m.tipo === 'avaria') &&
                typeof m.paletes === 'number' &&
                typeof m.fardos === 'number' &&
                typeof m.timestamp === 'number',
            )
          : [],
        lastModifiedAt:
          typeof saved.lastModifiedAt === 'number' ? saved.lastModifiedAt : null,
      };
    }

    return hydrated;
  } catch {
    saveDailyState(empty);
    return empty;
  }
}

export function saveDailyState(items: Record<string, ProductItemState>): void {
  try {
    const payload: DailyInventoryStorage = {
      date: getTodayKey(),
      items,
    };
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadAllPhotos(): Record<string, string> {
  const photos: Record<string, string> = {};
  for (const product of PRODUCTS) {
    try {
      const stored = localStorage.getItem(`${PHOTO_KEY_PREFIX}${product.codigo}`);
      if (stored) {
        photos[product.codigo] = stored;
      }
    } catch {
      // Ignore storage access errors
    }
  }
  return photos;
}

export function saveProductPhoto(codigo: string, dataUrl: string): void {
  try {
    localStorage.setItem(`${PHOTO_KEY_PREFIX}${codigo}`, dataUrl);
  } catch {
    // Ignore storage quota errors
  }
}

export function removeProductPhoto(codigo: string): void {
  try {
    localStorage.removeItem(`${PHOTO_KEY_PREFIX}${codigo}`);
  } catch {
    // Ignore storage access errors
  }
}

export function resizeImageToJpeg(file: File, maxSize = 600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const { naturalWidth, naturalHeight } = img;
        if (!naturalWidth || !naturalHeight) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Dimensões inválidas da imagem.'));
          return;
        }

        const longestSide = Math.max(naturalWidth, naturalHeight);
        const scale = longestSide > maxSize ? maxSize / longestSide : 1;
        const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
        const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Contexto canvas indisponível.'));
          return;
        }

        // Fill white background before drawing in case source has transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar imagem.'));
    };

    img.src = objectUrl;
  });
}
