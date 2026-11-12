import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, X } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  code: string;
  description: string;
  photoUrl: string | null;
  onClose: () => void;
  onPhotoSelected: (file: File) => void;
  onRemovePhoto: () => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  code,
  description,
  photoUrl,
  onClose,
  onPhotoSelected,
  onRemovePhoto,
}) => {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const removeTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Reset confirmation state whenever modal opens or closes
    setConfirmingRemove(false);
    if (removeTimerRef.current) {
      window.clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (removeTimerRef.current) {
        window.clearTimeout(removeTimerRef.current);
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || !photoUrl) return null;

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      removeTimerRef.current = window.setTimeout(() => {
        setConfirmingRemove(false);
        removeTimerRef.current = null;
      }, 3000);
    } else {
      if (removeTimerRef.current) {
        window.clearTimeout(removeTimerRef.current);
        removeTimerRef.current = null;
      }
      setConfirmingRemove(false);
      onRemovePhoto();
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
    }
    e.target.value = '';
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/85 flex flex-col justify-between items-center p-4 sm:p-6 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top bar with close button & product info */}
      <div className="w-full max-w-[500px] flex items-center justify-between text-white pb-2">
        <div className="flex-1 pr-2">
          <p className="text-base font-bold">{code}</p>
          <p className="text-xs text-slate-300 truncate">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main photo container */}
      <div
        onClick={handleBackdropClick}
        className="flex-1 w-full max-w-[500px] flex items-center justify-center my-auto p-2"
      >
        <img
          src={photoUrl}
          alt={`Foto do produto ${code}`}
          className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
        />
      </div>

      {/* Bottom Action Buttons */}
      <div className="w-full max-w-[500px] grid grid-cols-3 gap-2.5 pt-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {/* Trocar foto */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="h-12 rounded-[10px] bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
        >
          <Camera size={18} />
          <span>Trocar foto</span>
        </button>

        {/* Remover (dois toques) */}
        <button
          type="button"
          onClick={handleRemoveClick}
          className={`h-12 rounded-[10px] font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
            confirmingRemove
              ? 'bg-[#D33F3F] text-white ring-2 ring-red-400 animate-pulse'
              : 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40'
          }`}
        >
          <Trash2 size={18} />
          <span>{confirmingRemove ? 'Confirmar?' : 'Remover'}</span>
        </button>

        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-[10px] bg-white text-slate-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all active:scale-[0.98]"
        >
          <span>Fechar</span>
        </button>
      </div>
    </div>
  );
};
