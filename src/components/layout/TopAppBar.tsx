'use client';

import React, { useState, useEffect } from 'react';
import { useNotificationPermission } from '@/hooks/use-pusher';
import { LocationPicker } from '@/components/ui/location-picker';
import { useCartStore } from '@/stores/cart-store';

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
  const { permission, requestPermission } = useNotificationPermission();

  // Estado persistido de dirección del cliente
  const customerAddress = useCartStore((state) => state.customerAddress);
  const customerLat = useCartStore((state) => state.customerLat);
  const customerLng = useCartStore((state) => state.customerLng);
  const setDeliveryAddress = useCartStore((state) => state.setDeliveryAddress);

  // Estados locales para el modal de GPS interactivo
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [tempAddress, setTempAddress] = useState(customerAddress || '');
  const [tempLat, setTempLat] = useState<number | null>(customerLat || null);
  const [tempLng, setTempLng] = useState<number | null>(customerLng || null);

  // Sincronizar estado local al abrir el modal
  useEffect(() => {
    if (isMapModalOpen) {
      setTempAddress(customerAddress || '');
      setTempLat(customerLat || null);
      setTempLng(customerLng || null);
    }
  }, [isMapModalOpen, customerAddress, customerLat, customerLng]);

  const handleSaveLocation = () => {
    setDeliveryAddress(tempAddress, tempLat, tempLng);
    setIsMapModalOpen(false);
  };

  const handleNotificationClick = async () => {
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        if ('Notification' in window) {
          new Notification('🔔 Notificaciones Activadas', {
            body: '¡Todo listo! Recibirás avisos en tiempo real sobre tus pedidos en BlueExpress.',
            icon: '/logo.png',
          });
        }
      } else if (result === 'denied') {
        alert('⚠️ Las notificaciones están bloqueadas. Habilítalas en los permisos de tu navegador para recibir avisos de tus pedidos.');
      }
    } catch (e) {
      console.warn('Notification prompt failed:', e);
    }
  };

  const showIndicator = permission === 'default';

  return (
    <header 
      className="fixed top-0 left-0 right-0 mx-auto w-full max-w-md z-50 bg-surface dark:bg-surface-dim border-b border-surface-container-high px-margin-mobile h-16 flex items-center justify-between"
    >
      <button 
        onClick={() => setIsMapModalOpen(true)}
        aria-label="Cambiar ubicación" 
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 transition-transform text-primary dark:text-primary-fixed-dim relative shrink-0"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: customerAddress ? "'FILL' 1" : "'FILL' 0" }}>
          location_on
        </span>
        {customerAddress && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-surface"></span>
        )}
      </button>
      
      <div className="flex flex-col items-center justify-center flex-1 mx-4 overflow-hidden">
        <span className="font-label-sm text-label-sm text-on-surface-variant truncate w-full text-center">
          {customerAddress ? '📍 Dirección guardada' : 'Dirección de entrega'}
        </span>
        {zones.length > 0 && onZoneChange ? (
          <select
            value={selectedZone}
            onChange={(e) => onZoneChange(e.target.value)}
            className="bg-transparent border-none text-center font-headline-sm text-headline-sm-mobile text-primary dark:text-primary-fixed-dim truncate max-w-[180px] outline-none cursor-pointer focus:ring-0 py-0"
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
            <span className="font-headline-sm text-headline-sm-mobile text-primary dark:text-primary-fixed-dim truncate max-w-[180px]">Selecciona tu zona</span>
            <span className="material-symbols-outlined text-sm text-primary">expand_more</span>
          </button>
        )}
      </div>

      <button
        onClick={handleNotificationClick}
        aria-label="Notificaciones"
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 transition-transform text-primary dark:text-primary-fixed-dim relative shrink-0"
      >
        <span className="material-symbols-outlined">notifications</span>
        {showIndicator && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
        )}
      </button>

      {/* Modal Interactivo de Geolocalización (Google / Leaflet OpenStreetMap Fallback) */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-outline-variant/30 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">map</span>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Ubicación de entrega</h3>
              </div>
              <button 
                onClick={() => setIsMapModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center text-gray-500"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] pr-1">
              <LocationPicker
                label="Indica tu dirección exacta"
                address={tempAddress}
                latitude={tempLat}
                longitude={tempLng}
                defaultLatitude={-0.180653}
                defaultLongitude={-78.467834}
                onAddressChange={(addr) => setTempAddress(addr)}
                onLocationChange={(lat, lng, addr) => {
                  setTempLat(lat);
                  setTempLng(lng);
                  setTempAddress(addr);
                }}
                required
              />
            </div>
            
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={!tempAddress.trim()}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/95 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

