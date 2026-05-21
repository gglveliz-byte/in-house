'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isAvailable: boolean;
  categoryId: string | null;
  storeId: string;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface StoreDetails {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  whatsapp: string;
  isOpen: boolean;
  minOrder: number;
  deliveryFee: number;
  categories: Category[];
  products: Product[];
}

interface RestaurantScreenProps {
  slug: string;
}

export const RestaurantScreen: React.FC<RestaurantScreenProps> = ({ slug }) => {
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.getItemCount());
  const cartTotal = useCartStore((state) => state.getTotal());

  const handleAddToCart = (product: Product) => {
    if (!store) return;

    const added = addItem(product, 1, {
      storeId: store.id,
      storeName: store.name,
      whatsapp: store.whatsapp ?? '',
      deliveryFee: store.deliveryFee,
    });

    if (added) {
      setToast(`Agregado al carrito: ${product.name}`);
      window.setTimeout(() => setToast(null), 2000);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/stores/${slug}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error('No se encontró el restaurante');
        }
        return res.json();
      })
      .then((data) => {
        setStore(data);
        setActiveCategoryId(data.categories?.[0]?.id ?? null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Error loading restaurant:', err);
          setError('No se pudo cargar el restaurante. Intenta nuevamente.');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [slug]);

  const categories = store?.categories ?? [];
  const hasUncategorized = (store?.products.length ?? 0) > 0;
  const selectedCategory = activeCategoryId
    ? categories.find((category) => category.id === activeCategoryId) || null
    : null;

  const visibleCategories = selectedCategory ? [selectedCategory] : categories;

  const heroImage = store?.banner || store?.logo || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="bg-background text-on-surface font-body-md antialiased pb-24 w-full max-w-md mx-auto relative min-h-screen">
      <header className="relative w-full h-64 bg-surface-variant">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full flex items-center justify-between p-margin-mobile pt-safe-top z-10">
          <Link href="/azul" aria-label="Volver" className="w-10 h-10 rounded-full bg-surface-container-lowest/90 flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex gap-stack-sm">
            <button aria-label="Buscar en restaurante" className="w-10 h-10 rounded-full bg-surface-container-lowest/90 flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button aria-label="Guardar en favoritos" className="w-10 h-10 rounded-full bg-surface-container-lowest/90 flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-outlined">favorite_border</span>
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-margin-mobile -mt-16 mb-stack-lg">
        <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)]">
          {loading ? (
            <div className="py-14 text-center">
              <div className="w-8 h-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-4">Cargando restaurante...</p>
            </div>
          ) : error ? (
            <div className="py-14 text-center">
              <p className="font-headline-sm text-headline-sm text-on-surface mb-3">Ups, algo salió mal</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
            </div>
          ) : store ? (
            <>
              <div className="mb-stack-sm">
                <div className="space-y-2">
                  <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{store.name}</h1>
                  <p className="font-body-md text-body-md text-secondary line-clamp-2">{store.description || 'Encontrarás lo mejor del menú en esta cocina.'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-stack-md">
                {categories.slice(0, 3).map((category) => (
                  <span key={category.id} className="px-2 py-1 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm">
                    {category.name}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-surface-variant pt-stack-sm mt-stack-sm text-center">
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">4.8</div>
                  <div className="font-body-sm text-body-sm text-secondary">Calif.</div>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">20-30</div>
                  <div className="font-body-sm text-body-sm text-secondary">min</div>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">${store.deliveryFee.toFixed(2)}</div>
                  <div className="font-body-sm text-body-sm text-secondary">Envío</div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {!loading && !error && store ? (
        <>
          <nav className="sticky top-0 bg-background z-20 px-margin-mobile py-stack-md overflow-x-auto no-scrollbar flex gap-gutter-mobile border-b border-surface-variant shadow-sm">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${activeCategoryId === null ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'}`}>
              Más vendidos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${activeCategoryId === category.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'}`}>
                {category.name}
              </button>
            ))}
          </nav>

          <main className="px-margin-mobile mt-stack-lg">
            {visibleCategories.map((category) => (
              <section key={category.id} className="mb-stack-lg">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">{category.name}</h2>
                <div className="space-y-stack-md">
                  {category.products.map((product) => (
                    <article key={product.id} className="bg-surface-container-lowest rounded-lg p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)] flex gap-gutter-mobile mb-stack-md relative">
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{product.name}</h3>
                          <p className="font-body-md text-body-md text-secondary line-clamp-2">{product.description || 'Delicioso producto disponible en este restaurante.'}</p>
                        </div>
                        <div className="mt-stack-sm">
                          <span className="font-headline-sm text-headline-sm text-primary">${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="w-28 h-28 shrink-0 relative rounded-md overflow-hidden bg-surface-variant">
                        {product.image ? (
                          <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-[32px]">fastfood</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          aria-label="Añadir al carrito"
                          className="absolute bottom-2 right-2 w-8 h-8 bg-surface-container-lowest rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-surface-container-highest transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {hasUncategorized && selectedCategory === null && (
              <section className="mb-stack-lg">
                <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md">Sin categoría</h2>
                <div className="space-y-stack-md">
                  {store.products.map((product) => (
                    <article key={product.id} className="bg-surface-container-lowest rounded-lg p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)] flex gap-gutter-mobile mb-stack-md relative">
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{product.name}</h3>
                          <p className="font-body-md text-body-md text-secondary line-clamp-2">{product.description || 'Producto disponible sin categoría específica.'}</p>
                        </div>
                        <div className="mt-stack-sm">
                          <span className="font-headline-sm text-headline-sm text-primary">${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="w-28 h-28 shrink-0 relative rounded-md overflow-hidden bg-surface-variant">
                        {product.image ? (
                          <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-[32px]">fastfood</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          aria-label="Añadir al carrito"
                          className="absolute bottom-2 right-2 w-8 h-8 bg-surface-container-lowest rounded-full flex items-center justify-center text-primary shadow-sm hover:bg-surface-container-highest transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>
        </>
      ) : null}

      {toast ? (
        <div className="fixed left-1/2 bottom-28 z-50 -translate-x-1/2 rounded-full bg-surface py-3 px-5 shadow-[0px_10px_30px_rgba(0,0,0,0.12)] text-on-surface font-body-md text-body-md">
          {toast}
        </div>
      ) : null}

      <div className="fixed bottom-margin-mobile left-1/2 -translate-x-1/2 w-full max-w-md px-margin-mobile z-50">
        <Link href="/azul/cart" className="w-full bg-primary text-on-primary rounded-xl p-stack-md flex justify-between items-center shadow-lg active:scale-95 transition-transform hover:opacity-90">
          <div className="flex items-center gap-stack-sm bg-primary-container text-on-primary-container px-2 py-1 rounded-md font-label-md text-label-md">
            <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
            {cartCount}
          </div>
          <span className="font-headline-sm text-headline-sm">Ver carrito</span>
          <span className="font-headline-sm text-headline-sm">${cartTotal.toFixed(2)}</span>
        </Link>
      </div>
    </div>
  );
};
