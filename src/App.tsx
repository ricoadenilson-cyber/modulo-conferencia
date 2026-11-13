import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { Toolbar } from './components/Toolbar';
import { PRODUCTS } from './data/products';
import type { MovementType, ProductItemState } from './types/inventory';
import { buildCopySummary, copyTextToClipboard, exportToExcel } from './utils/export';
import { computeItemTotals, getTodayKey } from './utils/formatters';
import {
  createEmptyItemsState,
  loadAllPhotos,
  loadDailyState,
  removeProductPhoto,
  saveDailyState,
  saveProductPhoto,
} from './utils/storage';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [dateKey, setDateKey] = useState<string>(() => getTodayKey());
  const [items, setItems] = useState<Record<string, ProductItemState>>(() =>
    loadDailyState(),
  );
  const [photos, setPhotos] = useState<Record<string, string>>(() => loadAllPhotos());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resetSignal, setResetSignal] = useState<number>(0);

  // Persist daily entries whenever items change
  useEffect(() => {
    saveDailyState(items);
  }, [items]);

  // Automatically wipe daily entries if the calendar date changes while app stays open
  useEffect(() => {
    const checkDayRollover = () => {
      const today = getTodayKey();
      if (today !== dateKey) {
        const fresh = createEmptyItemsState();
        setDateKey(today);
        setItems(fresh);
        saveDailyState(fresh);
        setSearchQuery('');
        setResetSignal((prev) => prev + 1);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDayRollover();
      }
    };

    window.addEventListener('focus', checkDayRollover);
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(checkDayRollover, 60_000);

    return () => {
      window.removeEventListener('focus', checkDayRollover);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [dateKey]);

  const grandTotals = useMemo(() => {
    let totalFardos = 0;
    let entradasFardos = 0;
    let saidasFardos = 0;
    let avariasFardos = 0;

    for (const product of PRODUCTS) {
      const item = items[product.codigo];
      if (!item) continue;
      const t = computeItemTotals(item);
      totalFardos += t.totalFardos;
      entradasFardos += t.entradasFardos;
      saidasFardos += t.saidasFardos;
      avariasFardos += t.avariasFardos;
    }

    return { totalFardos, entradasFardos, saidasFardos, avariasFardos };
  }, [items]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const handleUpdateFardosPorPalete = (codigo: string, value: number | null) => {
    const now = Date.now();
    setItems((prev) => {
      const current = prev[codigo];
      if (!current) return prev;
      return {
        ...prev,
        [codigo]: {
          ...current,
          fardosPorPalete: value,
          lastModifiedAt: now,
        },
      };
    });
  };

  const handleUpdateEstoque = (
    codigo: string,
    field: 'paletes' | 'fardos',
    value: number | null,
  ) => {
    const now = Date.now();
    setItems((prev) => {
      const current = prev[codigo];
      if (!current) return prev;
      return {
        ...prev,
        [codigo]: {
          ...current,
          estoque: {
            ...current.estoque,
            [field]: value,
            updatedAt: now,
          },
          lastModifiedAt: now,
        },
      };
    });
  };

  const handleAddMovement = (
    codigo: string,
    tipo: MovementType,
    paletes: number,
    fardos: number,
  ) => {
    const now = Date.now();
    setItems((prev) => {
      const current = prev[codigo];
      if (!current) return prev;
      return {
        ...prev,
        [codigo]: {
          ...current,
          movimentos: [
            ...current.movimentos,
            {
              id: generateId(),
              tipo,
              paletes,
              fardos,
              timestamp: now,
            },
          ],
          lastModifiedAt: now,
        },
      };
    });
  };

  const handleUpdateMovement = (
    codigo: string,
    movementId: string,
    tipo: MovementType,
    paletes: number,
    fardos: number,
  ) => {
    const now = Date.now();
    setItems((prev) => {
      const current = prev[codigo];
      if (!current) return prev;
      return {
        ...prev,
        [codigo]: {
          ...current,
          movimentos: current.movimentos.map((m) =>
            m.id === movementId ? { ...m, tipo, paletes, fardos, timestamp: now } : m,
          ),
          lastModifiedAt: now,
        },
      };
    });
  };

  const handleDeleteMovement = (codigo: string, movementId: string) => {
    const now = Date.now();
    setItems((prev) => {
      const current = prev[codigo];
      if (!current) return prev;
      return {
        ...prev,
        [codigo]: {
          ...current,
          movimentos: current.movimentos.filter((m) => m.id !== movementId),
          lastModifiedAt: now,
        },
      };
    });
  };

  const handleSavePhoto = (codigo: string, dataUrl: string) => {
    saveProductPhoto(codigo, dataUrl);
    setPhotos((prev) => ({
      ...prev,
      [codigo]: dataUrl,
    }));
  };

  const handleRemovePhoto = (codigo: string) => {
    removeProductPhoto(codigo);
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[codigo];
      return next;
    });
  };

  const handleResetAll = () => {
    const fresh = createEmptyItemsState();
    setItems(fresh);
    saveDailyState(fresh);
    setSearchQuery('');
    setResetSignal((prev) => prev + 1);
  };

  const handleCopy = async (): Promise<boolean> => {
    const summary = buildCopySummary(PRODUCTS, items);
    return copyTextToClipboard(summary);
  };

  const handleDownload = async (): Promise<void> => {
    await exportToExcel(PRODUCTS, items);
  };

  return (
    <div className="min-h-dvh bg-[#F3F5F9] dark:bg-[#0F1524] text-[#14213D] dark:text-[#E8EDF8] pb-[max(24px,env(safe-area-inset-bottom))]">
      <Header
        totalFardos={grandTotals.totalFardos}
        entradasFardos={grandTotals.entradasFardos}
        saidasFardos={grandTotals.saidasFardos}
        avariasFardos={grandTotals.avariasFardos}
      />

      <main className="max-w-[520px] mx-auto px-2.5 sm:px-3 pt-3 space-y-3">
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onResetAll={handleResetAll}
        />

        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-[#192238] border border-[#DDE3EE] dark:border-[#2A3654] rounded-[14px] py-10 px-4 text-center text-[14px] font-medium text-[#52607A] dark:text-[#98A6C3]">
            Nenhum item encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.codigo}
                product={product}
                item={items[product.codigo]}
                photoUrl={photos[product.codigo]}
                resetSignal={resetSignal}
                onUpdateFardosPorPalete={handleUpdateFardosPorPalete}
                onUpdateEstoque={handleUpdateEstoque}
                onAddMovement={handleAddMovement}
                onUpdateMovement={handleUpdateMovement}
                onDeleteMovement={handleDeleteMovement}
                onSavePhoto={handleSavePhoto}
                onRemovePhoto={handleRemovePhoto}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
