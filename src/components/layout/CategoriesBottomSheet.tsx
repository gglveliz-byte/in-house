import React, { useEffect, useState } from 'react';
import { CATEGORIES, CategoryItem } from '@/data/categories';

interface CategoriesBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: CategoryItem) => void;
}

export const CategoriesBottomSheet: React.FC<CategoriesBottomSheetProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      // Permite que el DOM registre el estado montado antes de animar
      const timer = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = '';
      }, 350); // Duración de transición de salida en ms
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end">
      {/* Backdrop con desenfoque de fondo y animación */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Contenedor Bottom Sheet */}
      <section
        className={`bg-surface-container-lowest w-full max-w-md h-[795px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden z-10 transition-transform duration-350 ease-out border-t border-surface-variant ${
          animate ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Barra superior de arrastre (Handle) & Encabezado */}
        <div className="flex flex-col items-center pt-3 pb-6 shrink-0">
          <div className="w-12 h-1.5 bg-outline-variant rounded-full mb-6"></div>
          <div className="flex justify-between items-center w-full px-margin-mobile">
            <h1 className="font-headline-lg-mobile text-headline-sm text-on-surface font-bold">
              Todas las categorías
            </h1>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Listado / Grid de Categorías Scrollable */}
        <div className="flex-1 overflow-y-auto px-margin-mobile pb-32 no-scrollbar">
          <div className="grid grid-cols-4 gap-y-6 gap-x-4">
            {CATEGORIES.map((category) => (
              <div
                key={category.id}
                onClick={() => onSelectCategory(category)}
                className="flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer group"
              >
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition-all shadow-[0px_2px_8px_rgba(0,0,0,0.06)] bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    src={category.image}
                    alt={category.label}
                    loading="lazy"
                  />
                </div>
                <span className="font-label-md text-[11px] leading-tight text-center text-on-surface font-medium max-w-[75px] truncate">
                  {category.label}
                </span>
              </div>
            ))}

            {/* Categoría Especial "Otros" para cerrar y volver */}
            <div
              onClick={onClose}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform cursor-pointer group"
            >
              <div className="relative w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary transition-all shadow-[0px_2px_8px_rgba(0,0,0,0.06)] text-on-surface-variant">
                <span className="material-symbols-outlined text-[30px]">grid_view</span>
              </div>
              <span className="font-label-md text-[11px] leading-tight text-center text-on-surface font-medium">
                Otros
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
