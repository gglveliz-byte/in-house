import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopAppBar, Zone } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/components/layout/BottomNavBar';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  isOpen: boolean;
  minOrder: number;
  deliveryFee: number;
}

const filterOptions = [
  { label: 'Envío Gratis', icon: 'local_shipping' },
  { label: 'Mejor puntuados', icon: 'star' },
  { label: 'Promociones', icon: 'local_offer' },
  { label: 'Filtros', icon: 'tune' },
];

export const HomeScreen: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/zones')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar zonas');
        return res.json();
      })
      .then((data) => {
        setZones(data);
        const savedZone = localStorage.getItem('selectedZone');
        if (savedZone && data.some((z: Zone) => z.id === savedZone)) {
          setSelectedZone(savedZone);
        }
      })
      .catch((err) => {
        console.error('Error loading zones:', err);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const url = selectedZone ? `/api/stores?zoneId=${selectedZone}` : '/api/stores?onlyOpen=true';

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar tiendas');
        return res.json();
      })
      .then((data) => {
        setStores(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Error loading stores:', err);
          setError('No se pudieron cargar las tiendas. Intenta nuevamente.');
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [selectedZone]);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    if (zoneId) {
      localStorage.setItem('selectedZone', zoneId);
    } else {
      localStorage.removeItem('selectedZone');
    }
  };

  const isAllZones = selectedZone === '';

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <TopAppBar zones={zones} selectedZone={selectedZone} onZoneChange={handleZoneChange} />

      <main className="pt-16 max-w-md mx-auto">
        <section className="bg-surface-container-lowest sticky top-16 z-40 bg-opacity-95 backdrop-blur-md border-b border-surface-container-high px-margin-mobile py-stack-sm">
          <div className="rounded-full bg-surface-container-lowest shadow-[0px_4px_12px_rgba(0,0,0,0.06)] border border-surface-variant flex items-center px-4 h-14 cursor-pointer transition-colors hover:border-primary">
            <span className="material-symbols-outlined text-primary mr-3">search</span>
            <span className="text-body-md text-on-surface-variant">Buscar comida, productos y más...</span>
          </div>
          <div className="mt-stack-md overflow-x-auto no-scrollbar flex gap-3 pb-2">
            {filterOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-stack-lg px-margin-mobile">
          <div className="flex items-center justify-between mb-stack-md">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Restaurantes</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{isAllZones ? 'Tiendas abiertas cerca de ti' : `Zona seleccionada: ${zones.find((zone) => zone.id === selectedZone)?.name ?? 'Todas las zonas'}`}</p>
            </div>
            <span className="font-label-sm text-label-sm text-secondary">{stores.length} resultados</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">storefront</span>
              <p className="font-body-md text-on-surface-variant">
                {error ?? (isAllZones ? 'No hay tiendas abiertas en este momento.' : 'No hay restaurantes disponibles en esta zona todavía.')}
              </p>
            </div>
          ) : (
            <div className="space-y-stack-md">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/azul/restaurant/${store.slug}`}
                  className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.06)] border border-surface-variant overflow-hidden flex flex-col active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className="h-36 w-full relative bg-surface-variant overflow-hidden">
                    {store.banner ? (
                      <img alt={store.name} className="w-full h-full object-cover" src={store.banner} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-4xl">restaurant</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-surface-container-lowest bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[14px] text-[#F4B400]">star</span>
                      <span className="font-label-sm text-label-sm text-on-surface">4.8</span>
                    </div>
                  </div>
                  <div className="p-stack-md relative z-20 bg-surface-container-lowest">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">{store.name}</h4>
                      {store.deliveryFee === 0 && (
                        <div className="flex items-center gap-1 bg-primary-container text-on-primary-container rounded-full px-2 py-1 font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                          Envío Gratis
                        </div>
                      )}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant mb-3 truncate">{store.description || 'Restaurante'}</p>
                    <div className="flex items-center font-label-md text-label-md text-secondary gap-4">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>15-25 min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
                        <span>${store.deliveryFee.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNavBar activeTab="home" />
    </div>
  );
};
