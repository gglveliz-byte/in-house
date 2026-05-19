'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LocationPicker } from '@/components/ui/location-picker';
import { useCartStore } from '@/stores/cart-store';

export const PaymentScreen: React.FC = () => {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const storeName = useCartStore((state) => state.storeName);
  const storeId = useCartStore((state) => state.storeId);
  const deliveryFee = useCartStore((state) => state.deliveryFee);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getTotal = useCartStore((state) => state.getTotal);
  const clearCart = useCartStore((state) => state.clearCart);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('Av. Paseo de la Reforma 250, Torre B, Piso 12');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();
  const hasItems = items.length > 0;
  const isReady = hasItems && customerName.trim() && customerPhone.trim() && address.trim();

  const handleApplyCoupon = () => {
    if (!coupon.trim()) {
      setError('Ingresa un código de cupón válido.');
      return;
    }
    setCouponApplied(true);
    setError(null);
    setSuccess('Cupón aplicado correctamente.');
  };

  const handlePlaceOrder = async () => {
    if (!isReady || !storeId) {
      setError('Completa los datos de entrega y asegúrate de tener productos en el carrito.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          customerName,
          customerPhone,
          customerAddress: address,
          customerLat: latitude,
          customerLng: longitude,
          customerNotes: notes,
          paymentMethod: paymentMethod,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Error al procesar el pedido. Intenta nuevamente.');
        return;
      }

      useCartStore.getState().setActiveOrderId(data.id);
      clearCart();
      router.push(`/azul/tracking?orderId=${data.id}`);
    } catch (err) {
      console.error('Error creating order:', err);
      setError('No se pudo completar el pedido. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasItems) {
    return (
      <div className="bg-background min-h-screen pb-32 font-body-md text-on-surface antialiased max-w-md mx-auto relative">
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface h-16 flex items-center px-margin-mobile">
          <Link href="/azul" aria-label="Volver" className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <h1 className="ml-4 font-headline-md text-headline-md text-on-surface">Pago</h1>
        </header>

        <main className="pt-20 px-margin-mobile max-w-md mx-auto text-center">
          <div className="bg-surface-container-lowest rounded-3xl p-stack-lg shadow-[0px_4px_12px_rgba(0,0,0,0.06)] mt-stack-xl">
            <span className="material-symbols-outlined text-5xl text-outline">shopping_cart</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface mt-stack-md">No hay productos en tu carrito</h2>
            <p className="font-body-md text-body-md text-secondary mt-2">Agrega productos desde un restaurante antes de continuar con el pago.</p>
            <Link href="/azul" className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary text-on-primary px-6 py-3 font-label-md text-label-md transition-colors hover:bg-primary-container">
              Volver a restaurantes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background antialiased max-w-md mx-auto relative min-h-screen pb-32">
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface flex items-center justify-between px-margin-mobile h-16">
        <div className="flex items-center gap-3">
          <button type="button" className="text-primary hover:bg-surface-container-high transition-colors active:scale-95 p-2 -ml-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </button>
          <span className="font-headline-sm text-headline-sm text-primary font-bold">Pago</span>
        </div>
        <button className="text-primary hover:bg-surface-container-high transition-colors active:scale-95 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="pt-20 pb-28 px-margin-mobile flex flex-col gap-stack-lg max-w-md mx-auto">
        <section className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Dirección de entrega</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Selecciona tu dirección o marca una ubicación con el mapa.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-label-sm font-semibold">
                <span className="material-symbols-outlined">location_on</span>
                Google Maps
              </span>
            </div>

            <LocationPicker
              label="Ubicación de entrega"
              address={address}
              latitude={latitude}
              longitude={longitude}
              defaultLatitude={-0.180653}
              defaultLongitude={-78.467834}
              onAddressChange={(value) => setAddress(value)}
              onLocationChange={(lat, lng, value) => {
                setAddress(value)
                setLatitude(lat)
                setLongitude(lng)
              }}
              required
            />

            <div className="grid gap-3 mt-4">
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary">Nombre</span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary">Teléfono</span>
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="10 dígitos"
                  type="tel"
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary">Notas para el repartidor</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Por ejemplo: deja el pedido en la puerta"
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-stack-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Método de pago</h3>
          <div className="flex flex-col gap-stack-sm">
            <div 
              onClick={() => setPaymentMethod('CARD')}
              className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.06)] cursor-pointer transition-colors ${paymentMethod === 'CARD' ? 'border-2 border-primary' : 'border border-transparent hover:border-outline-variant'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`${paymentMethod === 'CARD' ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-secondary'} p-2 rounded-lg flex items-center justify-center transition-colors`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                </div>
                <div>
                  <p className="font-body-md text-body-md text-on-surface font-semibold">Tarjeta</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Pago seguro</p>
                </div>
              </div>
              <span className={paymentMethod === 'CARD' ? 'text-primary' : 'text-outline-variant'}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: paymentMethod === 'CARD' ? "'FILL' 1" : "'FILL' 0" }}>
                  {paymentMethod === 'CARD' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </span>
            </div>
            
            <div 
              onClick={() => setPaymentMethod('CASH')}
              className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.06)] cursor-pointer transition-colors ${paymentMethod === 'CASH' ? 'border-2 border-primary' : 'border border-transparent hover:border-outline-variant'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`${paymentMethod === 'CASH' ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-secondary'} p-2 rounded-lg flex items-center justify-center transition-colors`}>
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <p className="font-body-md text-body-md text-on-surface font-semibold">Efectivo</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Paga en el momento</p>
                </div>
              </div>
              <span className={paymentMethod === 'CASH' ? 'text-primary' : 'text-outline-variant'}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: paymentMethod === 'CASH' ? "'FILL' 1" : "'FILL' 0" }}>
                  {paymentMethod === 'CASH' ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-stack-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Cupón de descuento</h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">local_offer</span>
              <input
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow shadow-[0px_4px_12px_rgba(0,0,0,0.02)]"
                placeholder="Ingresa tu código"
                type="text"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="bg-primary text-on-primary font-label-md text-label-md px-5 py-3 rounded-lg font-semibold hover:bg-primary-container transition-colors"
            >
              Aplicar
            </button>
          </div>
          {couponApplied && (
            <p className="text-success font-body-sm text-body-sm mt-2">Cupón aplicado correctamente.</p>
          )}
        </section>

        <section className="bg-surface-container-lowest p-5 rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.06)] flex flex-col gap-stack-md">
          <div className="bg-surface-container rounded-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body-md text-body-md text-secondary">Restaurante</span>
              <span className="font-body-md text-body-md text-on-surface font-medium">{storeName || 'Tienda seleccionada'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md text-secondary">Subtotal</span>
              <span className="font-body-md text-body-md text-on-surface font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="font-body-md text-body-md text-secondary">Envío</span>
              <span className="font-body-md text-body-md text-on-surface font-medium">${deliveryFee.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid gap-3">
            {items.map((item) => (
              <div key={item.productId} className="rounded-3xl bg-surface-container-highest p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-body-sm text-body-sm text-secondary">{item.product.name}</p>
                    <p className="font-label-sm text-label-sm text-secondary">x{item.quantity}</p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <hr className="border-outline-variant border-t mt-1" />
          <div className="flex justify-between items-center">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Total a pagar</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">${total.toFixed(2)}</span>
          </div>
          {error && <p className="text-error font-body-sm text-body-sm mt-2">{error}</p>}
          {success && <p className="text-success font-body-sm text-body-sm mt-2">{success}</p>}
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface-container-lowest px-margin-mobile pt-4 pb-8 shadow-[0px_-4px_12px_rgba(0,0,0,0.06)] rounded-t-2xl z-50">
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!isReady || submitting}
          className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-4 rounded-xl font-bold hover:bg-on-primary-fixed-variant active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined">lock</span>
          {submitting ? 'Procesando...' : 'Realizar Pedido'}
        </button>
        <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-3 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">shield</span> Pago procesado de forma segura
        </p>
      </div>
    </div>
  );
};
