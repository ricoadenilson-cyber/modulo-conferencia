import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { PhotoModal } from './components/PhotoModal';
import { ProductCard } from './components/ProductCard';
import { Toolbar } from './components/Toolbar';
import {
  createInitialItemState,
  createInitialStateRecord,
  FIXED_PRODUCTS,
  STORAGE_KEY_DATA,
  STORAGE_KEY_DATE,
} from './constants';
import { ItemEntryState, LineType } from './types';
import { copyToClipboard, generateSummaryText } from './utils/clipboard';
import { exportToExcel } from './utils/excelExport';
import {
  calculateItemTotals,
  getCurrentDateTimeFormatted,
  getCurrentTimeHHMM,
  getTodayDateString,
} from './utils/formatters';
import { resizeImageToDataUrl } from './utils/imageResize';
import {
  deleteProductPhoto,
  getAllProductPhotos,
  saveProductPhoto,
} from './utils/photoStorage';

export default function App() {
  const [items, setItems] = useState<Record<string, ItemEntryState>>(() => {
    // Check day rollover on load
    const today = getTodayDateString();
    try {
      const storedDate = localStorage.getItem(STORAGE_KEY_DATE);
      const storedData = localStorage.getItem(STORAGE_KEY_DATA);

      if (storedDate !== today) {
        // Different day or first run: initialize clean state
        const initial = createInitialStateRecord();
        localStorage.setItem(STORAGE_KEY_DATE, today);
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(initial));
        return initial;
      }

      if (storedData) {
        const parsed = JSON.parse(storedData) as Record<string, ItemEntryState>;
        // Ensure all fixed products exist
        const result: Record<string, ItemEntryState> = {};
        for (const prod of FIXED_PRODUCTS) {
          result[prod.code] = parsed[prod.code] || createInitialItemState(prod);
        }
        return result;
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage:', e);
    }

    const fallback = createInitialStateRecord();
    localStorage.setItem(STORAGE_KEY_DATE, today);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(fallback));
    return fallback;
  });

  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activePhotoCode, setActivePhotoCode] = useState<string | null>(null);

  // Load permanent photos from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    const codes = FIXED_PRODUCTS.map((p) => p.code);
    getAllProductPhotos(codes)
      .then((loadedPhotos) => {
        if (isMounted) {
          setPhotos(loadedPhotos);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar fotos:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save entries to localStorage whenever items change
  const persistItems = (newItems: Record<string, ItemEntryState>) => {
    try {
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newItems));
      localStorage.setItem(STORAGE_KEY_DATE, getTodayDateString());
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  };

  // Grand totals across all 10 items
  const grandTotals = useMemo(() => {
    let total = 0;
    let entradas = 0;
    let saidas = 0;
    let avarias = 0;

    for (const prod of FIXED_PRODUCTS) {
      const it = items[prod.code];
      if (it) {
        const t = calculateItemTotals(it);
        total += t.totalFardos;
        entradas += t.entradaFardos;
        saidas += t.saidaFardos;
        avarias += t.avariaFardos;
      }
    }

    return { total, entradas, saidas, avarias };
  }, [items]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FIXED_PRODUCTS;
    return FIXED_PRODUCTS.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle line input changes (paletes or fardos)
  const handleLineChange = (
    code: string,
    line: LineType,
    field: 'paletes' | 'fardos',
    val: string
  ) => {
    const numVal = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    const timeHHMM = getCurrentTimeHHMM();
    const fullTime = getCurrentDateTimeFormatted();

    setItems((prev) => {
      const currentItem = prev[code] || createInitialItemState(
        FIXED_PRODUCTS.find((p) => p.code === code)!
      );

      const updatedLine = {
        ...currentItem[line],
        [field]: numVal,
        updatedAtTime: timeHHMM,
        updatedAtFull: fullTime,
      };

      const updatedItem: ItemEntryState = {
        ...currentItem,
        [line]: updatedLine,
        lastUpdatedAt: fullTime,
      };

      const next = { ...prev, [code]: updatedItem };
      persistItems(next);
      return next;
    });
  };

  // Handle edit of fardos per pallet
  const handleFardosPerPalletChange = (code: string, val: string) => {
    const numVal = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    const fullTime = getCurrentDateTimeFormatted();

    setItems((prev) => {
      const currentItem = prev[code] || createInitialItemState(
        FIXED_PRODUCTS.find((p) => p.code === code)!
      );

      const updatedItem: ItemEntryState = {
        ...currentItem,
        fardosPerPallet: numVal,
        fardosPerPalletUpdatedAt: fullTime,
        lastUpdatedAt: fullTime, // only updates item lastUpdatedAt
      };

      const next = { ...prev, [code]: updatedItem };
      persistItems(next);
      return next;
    });
  };

  // Handle photo picked
  const handlePhotoSelected = async (code: string, file: File) => {
    try {
      const resized = await resizeImageToDataUrl(file);
      await saveProductPhoto(code, resized);
      setPhotos((prev) => ({ ...prev, [code]: resized }));
    } catch (err) {
      console.error('Falha ao processar foto:', err);
    }
  };

  // Handle photo removed
  const handleRemovePhoto = async (code: string) => {
    try {
      await deleteProductPhoto(code);
      setPhotos((prev) => {
        const copy = { ...prev };
        delete copy[code];
        return copy;
      });
    } catch (err) {
      console.error('Falha ao remover foto:', err);
    }
  };

  // Zerar: reset entries, keep photos, clear search
  const handleReset = () => {
    const fresh = createInitialStateRecord();
    setItems(fresh);
    setSearchQuery('');
    persistItems(fresh);
  };

  // Copiar: generate text summary and copy to clipboard
  const handleCopy = async () => {
    const summary = generateSummaryText(items);
    await copyToClipboard(summary);
  };

  // Baixar: export to ExcelJS (.xlsx)
  const handleDownload = async () => {
    await exportToExcel(items);
  };

  const activeProduct = FIXED_PRODUCTS.find((p) => p.code === activePhotoCode);

  return (
    <div className="min-h-screen bg-[#F3F5F9] dark:bg-[#0F1524] text-[#14213D] dark:text-[#E8EDF8] transition-colors selection:bg-[#1B2A4E] selection:text-white">
      {/* Centered mobile-first container (max-w-[520px]) */}
      <div className="max-w-[520px] mx-auto min-h-screen flex flex-col bg-[#F3F5F9] dark:bg-[#0F1524] shadow-2xl relative">
        {/* CABEÇALHO FIXO */}
        <Header
          grandTotal={grandTotals.total}
          grandEntradas={grandTotals.entradas}
          grandSaidas={grandTotals.saidas}
          grandAvarias={grandTotals.avarias}
        />

        {/* BARRA DE FERRAMENTAS */}
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onReset={handleReset}
        />

        {/* LISTA DE CARDS */}
        <main className="flex-1 px-4 py-2 space-y-3 pb-[max(env(safe-area-inset-bottom),2rem)]">
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#192238] border border-[#DDE3EE] dark:border-[#2A3654] rounded-[14px] p-8 text-center my-6">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Nenhum item encontrado
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Tente buscar por outro código ou descrição.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 rounded-lg bg-[#1B2A4E] text-white text-xs font-semibold hover:bg-[#243763] transition-colors"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const itemState =
                items[product.code] || createInitialItemState(product);
              const photoUrl = photos[product.code] || null;

              return (
                <ProductCard
                  key={product.code}
                  product={product}
                  itemState={itemState}
                  photoUrl={photoUrl}
                  onLineChange={handleLineChange}
                  onFardosPerPalletChange={handleFardosPerPalletChange}
                  onPhotoSelected={handlePhotoSelected}
                  onOpenPhotoModal={setActivePhotoCode}
                />
              );
            })
          )}
        </main>
      </div>

      {/* FULLSCREEN PHOTO MODAL */}
      {activeProduct && (
        <PhotoModal
          isOpen={Boolean(activePhotoCode)}
          code={activeProduct.code}
          description={activeProduct.description}
          photoUrl={activePhotoCode ? photos[activePhotoCode] || null : null}
          onClose={() => setActivePhotoCode(null)}
          onPhotoSelected={(file) => {
            if (activePhotoCode) {
              handlePhotoSelected(activePhotoCode, file);
            }
          }}
          onRemovePhoto={() => {
            if (activePhotoCode) {
              handleRemovePhoto(activePhotoCode);
            }
          }}
        />
      )}
    </div>
  );
}
