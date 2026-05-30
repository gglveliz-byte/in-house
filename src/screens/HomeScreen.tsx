import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TopAppBar, Zone } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { useCartStore } from '@/stores/cart-store';
import { CategoriesBottomSheet } from '@/components/layout/CategoriesBottomSheet';
import { CATEGORIES, CategoryItem } from '@/data/categories';


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

const RestaurantCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.06)] border border-surface-variant overflow-hidden flex flex-col">
      <div className="h-36 w-full animate-shimmer"></div>
      <div className="p-stack-md bg-surface-container-lowest space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="h-5 w-2/3 rounded animate-shimmer"></div>
          <div className="h-5 w-16 rounded animate-shimmer"></div>
        </div>
        <div className="h-4 w-5/6 rounded animate-shimmer"></div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-20 rounded animate-shimmer"></div>
          <div className="h-4 w-24 rounded animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

export const HomeScreen: React.FC<{ defaultShowCategories?: boolean }> = ({ defaultShowCategories = false }) => {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(defaultShowCategories);

  // Sincronizar estado con cambios en la propiedad (ej. navegación directa)
  useEffect(() => {
    setIsCategoriesOpen(defaultShowCategories);
  }, [defaultShowCategories]);

  const activeOrderId = useCartStore((state) => state.activeOrderId);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredStores = stores.filter((store) => {
    if (activeFilter === 'Envío Gratis') {
      return store.deliveryFee === 0;
    }
    if (activeFilter === 'Mejor puntuados') {
      // Simular mejor valorados devolviendo los que tienen mejores tarifas de envío
      return store.deliveryFee <= 3.0;
    }
    if (activeFilter === 'Promociones') {
      // Devolver los que tienen órdenes mínimas promocionales
      return store.minOrder <= 10;
    }
    return true;
  });

  // Categorías destacadas para mostrar en el carrusel de la página de inicio
  const homeFeaturedCategories = [
    CATEGORIES.find((c) => c.id === 'super'),
    CATEGORIES.find((c) => c.id === 'farmacia'),
    CATEGORIES.find((c) => c.id === 'encebollado'),
    CATEGORIES.find((c) => c.id === 'ceviche'),
    CATEGORIES.find((c) => c.id === 'pizzas'),
  ].filter(Boolean) as CategoryItem[];

  const handleCategorySelect = (category: CategoryItem) => {
    setIsCategoriesOpen(false);
    // Si estamos físicamente en /azul/categories, limpiamos la ruta de regreso a /azul
    if (window.location.pathname.endsWith('/categories')) {
      router.replace('/azul');
    }

    if (category.type === 'service') {
      // Mandado Especial Express
      router.push(`/azul/encargos?category=${category.target}`);
    } else {
      // Búsqueda de plato con filtro
      router.push(`/azul/search?query=${encodeURIComponent(category.label)}&mode=products`);
    }
  };

  const handleCloseCategories = () => {
    setIsCategoriesOpen(false);
    if (window.location.pathname.endsWith('/categories')) {
      router.push('/azul');
    }
  };

  const handleOpenCategories = () => {
    setIsCategoriesOpen(true);
    // Cambiar la URL estáticamente sin recargar la página para reflejar el estado en la PWA
    window.history.pushState(null, '', '/azul/categories');
  };

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

    const url = selectedZone ? `/api/stores?zoneId=${selectedZone}` : null;

    if (!url) {
      setStores([]);
      setLoading(false);
      return () => controller.abort();
    }

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
    <div className="bg-background text-on-surface antialiased h-screen overflow-hidden flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <TopAppBar zones={zones} selectedZone={selectedZone} onZoneChange={handleZoneChange} />

      <main className="flex-1 overflow-y-auto pt-16 pb-24 w-full max-w-md mx-auto">
        <section className="bg-surface-container-lowest border-b border-surface-container-high px-margin-mobile py-stack-sm">
          <div className="rounded-full bg-surface-container-lowest shadow-[0px_4px_12px_rgba(0,0,0,0.06)] border border-surface-variant flex items-center px-4 h-14 cursor-pointer transition-colors hover:border-primary">
            <span className="material-symbols-outlined text-primary mr-3">search</span>
            <span className="text-body-md text-on-surface-variant">Buscar comida, productos y más...</span>
          </div>
          <div className="mt-stack-md overflow-x-auto no-scrollbar flex gap-3 pb-2">
            {filterOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  if (option.label === 'Filtros') {
                    // Si se pulsa Filtros, activamos Envío Gratis como demostración
                    setActiveFilter(prev => prev === 'Envío Gratis' ? null : 'Envío Gratis');
                  } else {
                    setActiveFilter(prev => prev === option.label ? null : option.label);
                  }
                }}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-label-md transition-colors ${
                  activeFilter === option.label
                    ? 'border-primary bg-primary text-on-primary hover:bg-primary/95 shadow-sm font-bold'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {activeOrderId && (
          <section className="px-margin-mobile mt-4">
            <Link 
              href={`/azul/tracking?orderId=${activeOrderId}`}
              className="bg-primary text-on-primary rounded-xl p-4 flex items-center justify-between shadow-[0px_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-transform w-full border border-primary-container relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-primary-container text-primary rounded-full p-2 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm m-0 leading-tight">Pedido en curso</h3>
                  <p className="font-body-sm text-body-sm text-on-primary/80 m-0">Toca para rastrear tu entrega</p>
                </div>
              </div>
              <span className="material-symbols-outlined relative z-10">chevron_right</span>
            </Link>
          </section>
        )}

        {/* Servicios Especiales Express */}
        <section className="mt-6 px-margin-mobile">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-3">¿Qué necesitas hoy?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                if (!selectedZone) {
                  alert('Por favor, selecciona tu zona en la parte superior primero para activar el servicio de envíos.')
                  return
                }
                router.push('/azul/envios')
              }}
              className="bg-gradient-to-br from-[#003f87] to-blue-700 text-white rounded-2xl p-4 text-left transition-all active:scale-[0.97] hover:shadow-md border border-blue-400/20 flex flex-col justify-between h-36 relative overflow-hidden group shadow-sm cursor-pointer w-full"
            >
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[88px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_post_office</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/10 shrink-0">
                <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_post_office</span>
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-white">Envíos Express</p>
                <p className="text-[10px] text-blue-100 font-medium mt-0.5">Mandar encomiendas</p>
              </div>
            </button>

            <button
              onClick={() => {
                if (!selectedZone) {
                  alert('Por favor, selecciona tu zona en la parte superior primero para activar el servicio de encargos.')
                  return
                }
                router.push('/azul/encargos')
              }}
              className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 text-left transition-all active:scale-[0.97] hover:shadow-md border border-emerald-400/20 flex flex-col justify-between h-36 relative overflow-hidden group shadow-sm cursor-pointer w-full"
            >
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[88px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/10 shrink-0">
                <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <div>
                <p className="font-bold text-sm leading-tight text-white">Encargos y Compras</p>
                <p className="text-[10px] text-emerald-100 font-medium mt-0.5">Medicina, licores y más</p>
              </div>
            </button>
          </div>
        </section>

        {/* Explorar Categorías Bar */}
        <section className="mt-6 px-margin-mobile">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-3 font-bold">Explorar Categorías</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
            {homeFeaturedCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container-low border border-surface-variant flex items-center justify-center shadow-sm">
                  <img src={category.image} className="w-full h-full object-cover" alt={category.label} />
                </div>
                <span className="text-[11px] font-semibold text-on-surface-variant">{category.label}</span>
              </button>
            ))}

            {/* Botón "Otros" */}
            <button
              onClick={handleOpenCategories}
              className="flex flex-col items-center gap-1 shrink-0 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-full bg-surface-container-high border border-surface-variant flex items-center justify-center shadow-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px]">grid_view</span>
              </div>
              <span className="text-[11px] font-bold text-primary">Otros</span>
            </button>
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
            <div className="space-y-stack-md">
              <RestaurantCardSkeleton />
              <RestaurantCardSkeleton />
              <RestaurantCardSkeleton />
            </div>
          ) : isAllZones ? (
            <div className="text-center py-12 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant mt-4">
              <span className="material-symbols-outlined text-5xl text-primary mb-3">location_on</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Selecciona tu ubicación</h3>
              <p className="font-body-md text-on-surface-variant max-w-[280px] mx-auto">
                Por favor selecciona tu zona en la parte superior para ver los restaurantes y promociones disponibles cerca de ti.
              </p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-outline-variant/30 mt-4">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">storefront</span>
              <p className="font-body-md text-on-surface-variant">
                No hay restaurantes que coincidan con el filtro de &quot;{activeFilter}&quot;.
              </p>
              <button
                onClick={() => setActiveFilter(null)}
                className="mt-3 text-primary font-bold font-label-md text-sm hover:underline"
              >
                Mostrar todos
              </button>
            </div>
          ) : (
            <div className="space-y-stack-md">
              {filteredStores.map((store) => (
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

      <CategoriesBottomSheet
        isOpen={isCategoriesOpen}
        onClose={handleCloseCategories}
        onSelectCategory={handleCategorySelect}
      />
    </div>
  );
};
