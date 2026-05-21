'use client';
import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';

export const CartScreen: React.FC = () => {
  const items = useCartStore((state) => state.items);
  const storeName = useCartStore((state) => state.storeName);
  const deliveryFee = useCartStore((state) => state.deliveryFee);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotal = useCartStore((state) => state.getTotal);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const subtotal = getSubtotal();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="bg-background min-h-screen pb-32 font-body-md text-on-surface antialiased w-full max-w-md mx-auto relative">
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface h-16 flex items-center px-margin-mobile">
          <Link href="/azul" aria-label="Volver" className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <h1 className="ml-4 font-headline-md text-headline-md text-on-surface">Tu Carrito</h1>
        </header>

        <main className="pt-20 px-margin-mobile w-full max-w-md mx-auto text-center">
          <div className="bg-surface-container-lowest rounded-3xl p-stack-lg shadow-[0px_4px_12px_rgba(0,0,0,0.06)] mt-stack-xl">
            <span className="material-symbols-outlined text-5xl text-outline">shopping_cart</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mt-stack-md">Tu carrito está vacío</h2>
            <p className="font-body-md text-body-md text-secondary mt-2">Agrega productos desde un restaurante para comenzar tu pedido.</p>
            <Link href="/azul" className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary text-on-primary px-6 py-3 font-label-md text-label-md transition-colors hover:bg-primary-container">
              Explorar restaurantes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-32 font-body-md text-on-surface antialiased w-full max-w-md mx-auto relative">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface h-16 flex items-center px-margin-mobile">
        <Link href="/azul" aria-label="Volver" className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-on-surface">arrow_back</span>
        </Link>
        <h1 className="ml-4 font-headline-md text-headline-md text-on-surface">Tu Carrito</h1>
      </header>

      <main className="pt-20 px-margin-mobile w-full max-w-md mx-auto">
        <section aria-label="Productos en el carrito" className="flex flex-col gap-stack-md">
          <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-stack-md">
              <div>
                <p className="font-label-sm text-label-sm text-secondary">Restaurante</p>
                <p className="font-headline-sm text-headline-sm text-on-surface">{storeName}</p>
              </div>
              <button
                type="button"
                className="text-error font-label-sm text-label-sm hover:underline"
                onClick={() => clearCart()}
              >
                Vaciar carrito
              </button>
            </div>

            {items.map((item) => (
              <div key={item.productId} className="bg-surface-container-lowest rounded-lg p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)] flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-variant">
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[28px]">restaurant</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">{item.product.name}</h3>
                        <p className="font-body-md text-body-md text-secondary mt-1">{item.product.description || 'Sin descripción adicional'}</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Eliminar"
                        className="text-outline hover:text-error transition-colors"
                        onClick={() => removeItem(item.productId)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-headline-sm text-headline-sm text-primary">${(item.product.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center gap-3 bg-surface-container rounded-full px-2 py-1">
                      <button
                        type="button"
                        aria-label="Disminuir cantidad"
                        className="w-6 h-6 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove</span>
                      </button>
                      <span className="font-body-md text-body-md text-on-surface font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Aumentar cantidad"
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary-container text-on-secondary-container"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className="mt-stack-lg bg-surface-container-lowest rounded-xl p-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)]">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Resumen</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center font-body-md text-body-md text-secondary">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-body-md text-body-md text-secondary">
                <span>Envío</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            </div>
            <hr className="border-t border-outline-variant my-4" />
            <div className="flex justify-between items-center">
              <span className="font-headline-md text-headline-md text-on-surface">Total</span>
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">${total.toFixed(2)}</span>
            </div>
          </section>
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface-container-lowest px-margin-mobile py-4 shadow-[0px_-4px_12px_rgba(0,0,0,0.06)] z-50 pb-safe">
        <Link
          href="/azul/payment"
          className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-3.5 rounded-lg active:scale-[0.98] transition-transform shadow-sm flex justify-center items-center gap-2"
        >
          Continuar al pago
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
};
