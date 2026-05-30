'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import type { Product, Store } from '@/types';

type SearchMode = 'stores' | 'products';
interface SearchProduct extends Product {
  store?: {
    id: string
    name: string
    slug: string
  }
}
const SEARCH_DEBOUNCE_MS = 320;

export const SearchScreen: React.FC = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialMode = (searchParams.get('mode') as SearchMode) || 'stores';

  const [query, setQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar el estado del input y modo cuando los parámetros URL cambien (ej. al presionar otra categoría)
  useEffect(() => {
    const q = searchParams.get('query') || '';
    const m = (searchParams.get('mode') as SearchMode) || 'stores';
    setQuery(q);
    setSearchMode(m);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const cleanedQuery = query.trim();

    if (searchMode === 'products' && !cleanedQuery) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (cleanedQuery) params.set('query', cleanedQuery);
    if (searchMode === 'stores') params.set('onlyOpen', 'true');

    // Cargar la zona activa seleccionada
    const savedZone = typeof window !== 'undefined' ? localStorage.getItem('selectedZone') : null;
    if (savedZone) {
      params.set('zoneId', savedZone);
    }

    const timer = window.setTimeout(() => {
      fetch(`/api/${searchMode === 'stores' ? 'stores' : 'products'}?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('No se pudieron cargar los resultados');
          }
          return res.json();
        })
        .then((data) => {
          if (searchMode === 'stores') {
            setStores(data);
          } else {
            setProducts(data);
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Error loading search results:', err);
            setError('No se pudieron cargar los resultados. Intenta de nuevo.');
          }
        })
        .finally(() => setLoading(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchMode]);

  const results = searchMode === 'stores' ? stores : products;
  const hasResults = results.length > 0;

  const resultsLabel = useMemo(() => {
    if (searchMode === 'stores') {
      return query.trim() ? `Tiendas para “${query.trim()}”` : 'Tiendas abiertas';
    }

    return query.trim() ? `Platos para “${query.trim()}”` : 'Busca tu plato favorito';
  }, [query, searchMode]);

  const noResultsMessage = useMemo(() => {
    if (error) return error;
    if (loading) return 'Buscando...';
    if (searchMode === 'stores') {
      return query.trim()
        ? 'No encontramos tiendas con ese nombre. Prueba otra búsqueda.'
        : 'No hay tiendas abiertas disponibles en este momento.';
    }

    return query.trim()
      ? 'No encontramos platos que coincidan con tu búsqueda.'
      : 'Escribe un nombre de plato para ver resultados.';
  }, [error, loading, query, searchMode]);

  return (
    <div className="w-full max-w-md mx-auto relative h-[100dvh] overflow-hidden flex flex-col bg-background shadow-2xl">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface dark:bg-surface-dim">
        <div className="flex items-center justify-between px-margin-mobile h-16 w-full flat no-shadows bg-surface dark:bg-surface-dim">
          <button className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform flex items-center justify-center">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
          </button>
          <h1 className="font-headline-sm text-headline-sm-mobile text-primary font-bold">Dirección de entrega</h1>
          <button className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform flex items-center justify-center">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pt-16 pb-24 px-margin-mobile flex flex-col gap-stack-lg">
        <div className="bg-background pt-stack-md pb-stack-sm -mx-margin-mobile px-margin-mobile">
          <div className="relative w-full shadow-[0px_4px_12px_rgba(0,0,0,0.06)] rounded-full bg-surface-container-lowest flex items-center px-4 h-14 border border-surface-container-high focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-primary mr-3" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
            <input
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-secondary outline-none h-full"
              placeholder="Buscar comida o locales..."
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                className="p-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors ml-2"
                onClick={() => setQuery('')}
                aria-label="Borrar búsqueda"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-stack-md overflow-x-auto no-scrollbar pb-2">
            <button
              className={`flex-1 flex items-center gap-1 px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                searchMode === 'stores'
                  ? 'border-primary bg-primary-fixed-dim/20 text-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
              }`}
              onClick={() => setSearchMode('stores')}
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              Tiendas
            </button>
            <button
              className={`flex-1 flex items-center gap-1 px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                searchMode === 'products'
                  ? 'border-primary bg-primary-fixed-dim/20 text-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
              }`}
              onClick={() => setSearchMode('products')}
            >
              <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
              Platos
            </button>
            <button className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Filtros
            </button>
          </div>
        </div>

        <section className="flex flex-col gap-stack-md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{resultsLabel}</h2>
              <p className="font-body-sm text-body-sm text-secondary mt-1">
                {searchMode === 'stores'
                  ? 'Restaurantes disponibles en tu zona'
                  : 'Productos disponibles por tienda'}
              </p>
            </div>
            <span className="font-label-sm text-label-sm text-secondary">{results.length} resultados</span>
          </div>

          {loading ? (
            <div className="py-14 flex justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-14">
              <span className="material-symbols-outlined text-4xl text-outline mb-3">search_off</span>
              <p className="font-body-md text-body-md text-on-surface-variant">{noResultsMessage}</p>
            </div>
          ) : searchMode === 'stores' ? (
            <div className="grid grid-cols-2 gap-gutter-mobile">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/azul/restaurant/${store.slug}`}
                  className="bg-surface-container-lowest rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col cursor-pointer hover:opacity-95 transition-opacity"
                >
                  <div className="relative w-full pt-[75%] bg-surface-variant">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${store.banner || store.logo || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'})` }}></div>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface truncate pr-2">{store.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary">
                      <span className="flex items-center text-on-surface">
                        <span className="material-symbols-outlined text-[14px] text-primary mr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        4.6
                      </span>
                      <span>•</span>
                      <span>Envío ${store.deliveryFee.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-stack-md">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/azul/restaurant/${product.store?.slug ?? product.storeId}`}
                  className="bg-surface-container-lowest rounded-lg p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)] flex gap-gutter-mobile items-center hover:opacity-95 transition-opacity"
                >
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-surface-variant">
                    {product.image ? (
                      <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[28px]">restaurant</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2">{product.name}</h3>
                    <p className="font-body-md text-body-md text-secondary line-clamp-2 mt-1">{product.description || 'Producto disponible en esta tienda'}</p>
                    <div className="flex items-center justify-between mt-3 text-label-md text-on-surface-variant">
                      <span>${product.price.toFixed(2)}</span>
                      <span>{product.store?.name ?? 'Tienda'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNavBar activeTab="search" />
    </div>
  );
};
