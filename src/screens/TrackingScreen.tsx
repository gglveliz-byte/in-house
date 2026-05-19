'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { pusherClient, CHANNELS, EVENTS } from '@/lib/pusher';
import { Order, OrderStatus } from '@/types';

interface TrackingOrder extends Order {
  store?: {
    name: string;
  };
  driver?: {
    name: string | null;
    phone: string | null;
  };
}

const STATUS_TEXT: Record<string, string> = {
  PENDING: 'Buscando repartidor',
  CONFIRMED: 'Preparando tu pedido',
  READY: 'Listo para recoger',
  PICKED_UP: 'Llega en 15 min',
  DELIVERED: '¡Pedido entregado!',
  CANCELLED: 'Pedido cancelado'
};

const STATUS_STEP: Record<string, number> = {
  PENDING: 1,
  CONFIRMED: 1,
  READY: 2,
  PICKED_UP: 2,
  DELIVERED: 3,
  CANCELLED: -1
};

export const TrackingScreen: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeOrderId = useCartStore((state) => state.activeOrderId);
  // Priorizar el orderId de la URL, si no, el del store
  const urlOrderId = searchParams.get('orderId');
  const orderId = urlOrderId || activeOrderId;
  const setActiveOrderId = useCartStore((state) => state.setActiveOrderId);
  
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No se proporcionó un ID de pedido válido.');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) throw new Error('No se pudo encontrar el pedido');
        const data = await response.json();
        setOrder(data);
        
        // Si el pedido ya está entregado o cancelado, limpiar el activeOrderId si somos el usuario actual
        if (data.status === 'DELIVERED' || data.status === 'CANCELLED') {
          if (activeOrderId === orderId) {
             setActiveOrderId(null);
          }
        } else {
          // Si está activo y no está guardado, guardarlo (al volver desde otra app por ej)
          if (activeOrderId !== orderId) {
             setActiveOrderId(orderId);
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Ocurrió un error al cargar el pedido.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Suscribirse a actualizaciones de Pusher para este pedido
    if (pusherClient) {
      const channel = pusherClient.subscribe(CHANNELS.ORDER(orderId));
      
      channel.bind(EVENTS.ORDER_UPDATED, (data: { status: OrderStatus }) => {
        setOrder((prev) => prev ? { ...prev, status: data.status } : null);
        if (data.status === 'DELIVERED' || data.status === 'CANCELLED') {
          setActiveOrderId(null);
        }
      });

      channel.bind(EVENTS.ORDER_PICKED_UP, (data: { driverId: string }) => {
        setOrder((prev) => prev ? { ...prev, status: 'PICKED_UP', driverId: data.driverId } : null);
        fetchOrder(); // Refrescar para obtener info del driver
      });

      channel.bind(EVENTS.ORDER_DELIVERED, () => {
        setOrder((prev) => prev ? { ...prev, status: 'DELIVERED' } : null);
        setActiveOrderId(null);
      });

      channel.bind(EVENTS.ORDER_CANCELLED, () => {
        setOrder((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
        setActiveOrderId(null);
      });

      return () => {
        channel.unbind_all();
        pusherClient?.unsubscribe(CHANNELS.ORDER(orderId));
      };
    }
  }, [orderId, activeOrderId, setActiveOrderId]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-background min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">error</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Error</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">{error}</p>
        <Link href="/azul" className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const step = STATUS_STEP[order.status] || 0;
  const progressPercentage = step === 1 ? '10%' : step === 2 ? '50%' : step === 3 ? '100%' : '0%';

  return (
    <div className="bg-background text-on-background min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* Mobile Container */}
      <main className="w-full max-w-md mx-auto min-h-screen bg-surface relative shadow-2xl overflow-hidden flex flex-col">
        {/* TopAppBar */}
        <header className="bg-surface dark:bg-surface-dim fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-between px-margin-mobile h-16 shadow-sm">
          <button type="button" onClick={() => router.push('/azul')} className="text-primary hover:bg-surface-container-high transition-colors active:scale-95 flex items-center justify-center p-2 -ml-2 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-headline-sm-mobile text-primary text-center">
            Estado de entrega
          </h1>
          <button className="text-primary hover:bg-surface-container-high transition-colors active:scale-95 flex items-center justify-center p-2 -mr-2 rounded-full">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </header>

        {/* Map Area (Top Half) */}
        <section aria-label="Mapa de seguimiento" className="h-[486px] w-full relative bg-surface-container-low mt-16">
          <img alt="Mapa de la ciudad" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl3Nru8LxGFldYJg8enoWnQo1jWrqrm5FK4FTXaqfx5w6HsvWwqRUxQm50SGKBKRGpKmRFTbZhKbKXJZiJaGcM8FDxGvuxK3TdHy3sO0QPgOCCE14mzxURg6JNS_QRbHQRvV5T0yL9bw6YTRpX885-BfJEikCYEV-_YAOmFPjhLCAWuEwirtZxZ0xgl3Z4iLe3myIC1w3yb7A2WQLUnH80b9sNANni9d_CPTKpD-1i92Q4Fn9t8ie2eCWdEzbK_uKNhRfh_QSWiQg" />
          <div className="absolute inset-0 bg-primary/5 mix-blend-multiply pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-transparent to-surface-container-lowest pointer-events-none"></div>
          
          {step > 1 && (
            <>
              <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path className="opacity-80" d="M 25 70 Q 40 40 65 35" fill="none" stroke="#003f87" strokeDasharray="2, 1.5" strokeWidth="0.8"></path>
              </svg>
              <div className="absolute top-[50%] left-[45%] flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-primary text-on-primary rounded-full p-2.5 shadow-[0px_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center relative z-10">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bike</span>
                </div>
                {step < 3 && <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20 scale-150"></div>}
                <div className="w-0.5 h-4 bg-primary mt-0.5 shadow-sm"></div>
                <div className="w-2 h-2 bg-primary rounded-full shadow-sm"></div>
              </div>
            </>
          )}

          <div className="absolute bottom-[30%] left-[25%] flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-surface-container-lowest text-primary rounded-full p-2 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center z-10 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            </div>
            <div className="w-1.5 h-1.5 bg-outline-variant rounded-full mt-1 shadow-sm"></div>
          </div>
        </section>

        {/* Bottom Sheet (Information & Controls) */}
        <section className="flex-1 bg-surface-container-lowest rounded-t-xl -mt-8 relative z-20 px-margin-mobile pt-6 pb-8 shadow-[0px_-8px_24px_rgba(0,0,0,0.06)] flex flex-col gap-stack-lg border-t border-outline-variant/10">
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-surface-container-highest rounded-full"></div>
          
          <div className="flex flex-col items-center text-center gap-stack-sm pt-2">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {STATUS_TEXT[order.status] || 'Actualizando estado...'}
            </h2>
            <div className="inline-flex items-center gap-2 bg-primary-fixed/50 px-3 py-1.5 rounded-full">
              {step < 3 && order.status !== 'CANCELLED' && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              )}
              <p className="font-label-md text-label-md text-primary tracking-wide uppercase">
                {order.status === 'DELIVERED' ? 'COMPLETADO' : order.status === 'CANCELLED' ? 'CANCELADO' : 'EN PROCESO'}
              </p>
            </div>
          </div>

          {order.status !== 'CANCELLED' && (
            <div className="relative w-full px-6 py-2">
              <div className="absolute top-1/2 left-10 right-10 h-[3px] bg-surface-container-highest -translate-y-1/2 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-10 h-[3px] bg-primary -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: progressPercentage }}
              ></div>
              <div className="flex justify-between relative z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative ${step >= 2 ? 'bg-surface-container-lowest border-[3px] border-primary text-primary' : 'bg-surface-container text-secondary border-none'}`}>
                    {step === 2 && <div className="absolute inset-[-6px] rounded-full border border-primary/30"></div>}
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bike</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-secondary'}`}>
                    <span className="material-symbols-outlined text-[16px]">home</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Info or Store Info */}
          {step >= 2 && order.driver ? (
            <div className="bg-surface p-4 rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex flex-col gap-stack-md">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full bg-surface-container-highest flex-shrink-0">
                  <img alt="Foto del repartidor" className="w-full h-full rounded-full object-cover border-2 border-surface-container-lowest" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZ7fXdmb6nVKXlHaGHFfgAkgG2mTv8YC2_uzDLhnADaf0NI20BilXW6kgmWk7jfzybL833SJ7p2lm4qcwh064aQwZbI7yVDdauie17RFt-OJxyfNx_A2U0vfoVtefb65uEQKAsYF1gREEkFuAsHfn1YiQj8Im7_A_tDbaYTeyh9AX0utIcsLOIK_YIrJJJwi1oAph62j2PGMDnJdquNBY_t8XhRSs9U_KrY-XXeZ0VR8kKqDne7nvJbuqPxqI16bW5Li6zJ_4C9eM" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#10B981] border-2 border-surface-container-lowest rounded-full"></div>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{order.driver.name || 'Repartidor'}</h3>
                  <p className="font-body-md text-body-md text-secondary">Vehículo asignado</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-surface-container-lowest px-2 py-1 rounded-lg border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-label-md text-label-md text-on-surface">4.9</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-[1px] bg-outline-variant/20"></div>
              <div className="flex gap-gutter-mobile">
                <a href={`tel:${order.driver.phone || '000'}`} className="flex-1 bg-surface-container-highest hover:bg-surface-container-high transition-colors py-3 rounded-lg flex items-center justify-center gap-2 text-on-surface font-headline-sm text-headline-sm">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  Llamar
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-surface p-4 rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex flex-col gap-stack-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">storefront</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{order.store?.name || 'Restaurante'}</h3>
                  <p className="font-body-md text-body-md text-secondary">Preparando pedido...</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Teaser */}
          <div className="w-full bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Pedido #{order.orderNumber}</p>
                <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5">${(order.total || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
            <button 
              onClick={() => {
                setActiveOrderId(null);
                router.push('/azul');
              }}
              className="mt-2 w-full py-4 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform"
            >
              Volver al inicio
            </button>
          )}
        </section>
      </main>
    </div>
  );
};
