import React from 'react';

export interface Zone {
  id: string;
  name: string;
  currency: string;
}

interface TopAppBarProps {
  zones?: Zone[];
  selectedZone?: string;
  onZoneChange?: (zoneId: string) => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ zones = [], selectedZone = '', onZoneChange }) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface dark:bg-surface-dim flat no-shadows max-w-md mx-auto left-0 right-0">
      <div className="flex items-center justify-between px-margin-mobile h-16 w-full">
        <button aria-label="Cambiar ubicación" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 transition-transform text-primary dark:text-primary-fixed-dim">
          <span className="material-symbols-outlined">location_on</span>
        </button>
        <div className="flex flex-col items-center justify-center flex-1 mx-4 overflow-hidden">
          <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-full text-center">Dirección de entrega</span>
          {zones.length > 0 && onZoneChange ? (
            <select
              value={selectedZone}
              onChange={(e) => onZoneChange(e.target.value)}
              className="bg-transparent border-none text-center font-headline-sm text-headline-sm-mobile text-primary dark:text-primary-fixed-dim truncate max-w-[200px] outline-none cursor-pointer focus:ring-0"
            >
              <option value="">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="text-on-surface">
                  {z.name}
                </option>
              ))}
            </select>
          ) : (
            <button className="flex items-center gap-1 active:scale-95 transition-transform">
              <span className="font-headline-sm text-headline-sm-mobile text-primary dark:text-primary-fixed-dim truncate max-w-[200px]">Selecciona tu zona</span>
              <span className="material-symbols-outlined text-sm text-primary">expand_more</span>
            </button>
          )}
        </div>
        <button aria-label="Notificaciones" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 transition-transform text-primary dark:text-primary-fixed-dim relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>
      </div>
    </header>
  );
};
