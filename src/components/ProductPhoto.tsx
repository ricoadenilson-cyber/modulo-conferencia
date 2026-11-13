import { Camera, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { resizeImageToJpeg } from '../utils/storage';

interface ProductPhotoProps {
  codigo: string;
  descricao: string;
  photoUrl?: string;
  onSavePhoto: (codigo: string, dataUrl: string) => void;
  onRemovePhoto: (codigo: string) => void;
}

export function ProductPhoto({
  codigo,
  descricao,
  photoUrl,
  onSavePhoto,
  onRemovePhoto,
}: ProductPhotoProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const removeTimerRef = useRef<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (removeTimerRef.current) window.clearTimeout(removeTimerRef.current);
    };
  }, []);

  const handleOpenPicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear input value so selecting the exact same file later still triggers onChange
    e.target.value = '';
    if (!file) return;

    setIsProcessing(true);
    try {
      const jpegDataUrl = await resizeImageToJpeg(file, 600, 0.8);
      onSavePhoto(codigo, jpegDataUrl);
      setConfirmRemove(false);
    } catch {
      // Silently ignore invalid image files without crashing
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConfirmRemove(false);
    if (removeTimerRef.current) {
      window.clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
  };

  const handleRemoveClick = () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      if (removeTimerRef.current) window.clearTimeout(removeTimerRef.current);
      removeTimerRef.current = window.setTimeout(() => setConfirmRemove(false), 3000);
      return;
    }

    if (removeTimerRef.current) {
      window.clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }
    onRemovePhoto(codigo);
    handleCloseModal();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {photoUrl ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label={`Ver foto do produto ${codigo} ${descricao}`}
          className="w-[72px] h-[72px] shrink-0 rounded-[12px] overflow-hidden border border-[#DDE3EE] dark:border-[#2A3654] bg-[#F3F5F9] dark:bg-[#131B2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A4E] active:scale-[0.97] transition-transform"
        >
          <img
            src={photoUrl}
            alt={`${codigo} ${descricao}`}
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenPicker}
          disabled={isProcessing}
          aria-label={`Adicionar foto do produto ${codigo} ${descricao}`}
          className="w-[72px] h-[72px] shrink-0 rounded-[12px] border-2 border-dashed border-[#C2CCE0] dark:border-[#344366] bg-[#F3F5F9] dark:bg-[#131B2E] text-[#52607A] dark:text-[#98A6C3] flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A4E] active:scale-[0.97] transition-transform"
        >
          <Camera size={20} />
          <span className="text-[11px] font-medium leading-none">
            {isProcessing ? '...' : 'Foto'}
          </span>
        </button>
      )}

      {isModalOpen && photoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto do produto ${codigo}`}
          onClick={handleCloseModal}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[460px] flex flex-col items-center gap-4"
          >
            <div className="text-center text-white px-2">
              <div className="text-[15px] font-bold tabular-nums">{codigo}</div>
              <div className="text-[12px] text-white/80 whitespace-nowrap truncate max-w-[300px]">
                {descricao}
              </div>
            </div>

            <img
              src={photoUrl}
              alt={`${codigo} ${descricao}`}
              className="max-w-full max-h-[60vh] w-auto h-auto rounded-[14px] object-contain shadow-2xl border border-white/15 bg-black"
            />

            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={handleOpenPicker}
                disabled={isProcessing}
                className="min-h-[46px] px-2 rounded-[10px] bg-white text-[#14213D] text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform whitespace-nowrap"
              >
                <RefreshCw size={15} className="shrink-0" />
                <span>Trocar foto</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveClick}
                className={`min-h-[46px] px-2 rounded-[10px] text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-colors whitespace-nowrap ${
                  confirmRemove
                    ? 'bg-[#D33F3F] text-white'
                    : 'bg-white/15 text-white border border-white/25'
                }`}
              >
                <Trash2 size={15} className="shrink-0" />
                <span>{confirmRemove ? 'Confirmar?' : 'Remover'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="min-h-[46px] px-2 rounded-[10px] bg-white/15 text-white border border-white/25 text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform whitespace-nowrap"
              >
                <X size={15} className="shrink-0" />
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
