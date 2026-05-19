'use client';

import React, { useEffect, useState } from 'react';
import { usePwaStore } from '@/stores/pwa-store';
import Link from 'next/link';

export default function DownloadPage() {
  const { deferredPrompt, isInstalled, setIsInstalled } = usePwaStore();
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop' | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const handleInstallClick = async () => {
    if (deviceType === 'ios') {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } else if (deviceType === 'android') {
      // Si por alguna razón no hay prompt, sugerir manual
      alert('Toca el menú de opciones (⋮) en tu navegador y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md">
      {/* Navbar Minimalista */}
      <nav className="flex justify-between items-center p-6 border-b border-outline-variant bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <span className="font-headline-sm font-bold text-primary">Azul Entrega</span>
        </div>
        <Link href="/azul" className="text-primary font-bold text-label-md hover:underline">
          Ir a la versión web
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto w-full p-6 md:p-12 gap-12">
        {/* Left Side: Texto y Botones */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="bg-primary-container text-primary px-4 py-1.5 rounded-full font-label-md font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Aplicación Oficial
          </div>
          
          <h1 className="font-headline-lg md:text-[56px] font-bold text-on-surface leading-tight mb-6">
            Lleva Azul Entrega <br/> en tu bolsillo.
          </h1>
          
          <p className="font-body-lg text-secondary md:text-xl max-w-lg mb-10">
            Instala nuestra App ultraligera y disfruta de tiempos de carga más rápidos, notificaciones en tiempo real y una experiencia optimizada.
          </p>

          {isInstalled ? (
            <div className="bg-surface-container-high border border-outline-variant p-6 rounded-2xl w-full max-w-md text-center">
              <span className="material-symbols-outlined text-5xl text-green-500 mb-4">check_circle</span>
              <h3 className="font-headline-sm font-bold text-on-surface mb-2">¡App ya instalada!</h3>
              <p className="text-secondary mb-4">Abre "Azul Entrega" desde tu pantalla de inicio.</p>
            </div>
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-4">
              {deviceType === 'desktop' ? (
                <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant text-center">
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">qr_code_scanner</span>
                  <h3 className="font-bold text-on-surface mb-2">Descarga en tu Móvil</h3>
                  <p className="text-secondary text-sm">Escanea este código o ingresa a <strong>azul-entrega.com/descargar</strong> desde tu celular para instalar la app.</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleInstallClick}
                    className="w-full bg-primary text-white text-headline-sm py-4 rounded-full font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {deviceType === 'ios' ? (
                      <><span className="material-symbols-outlined">apple</span> Instalar para iPhone</>
                    ) : (
                      <><span className="material-symbols-outlined">android</span> Descargar para Android</>
                    )}
                  </button>

                  {deviceType === 'android' && !deferredPrompt && (
                    <p className="text-xs text-secondary mt-2 text-center">
                      Si el botón no funciona, abre el menú (⋮) de Chrome y toca "Instalar aplicación".
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Instrucciones iOS */}
          {showIOSInstructions && deviceType === 'ios' && !isInstalled && (
            <div className="mt-8 bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl w-full max-w-md shadow-md animate-in slide-in-from-bottom-4">
              <h3 className="font-headline-sm font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Pasos para instalar en iPhone
              </h3>
              <ul className="space-y-4 text-left">
                <li className="flex gap-4">
                  <div className="bg-surface-container-high w-8 h-8 rounded-full flex items-center justify-center font-bold text-primary shrink-0">1</div>
                  <p className="text-on-surface">Toca el botón <strong>Compartir</strong> <span className="inline-block align-middle material-symbols-outlined text-xl ml-1">ios_share</span> en la barra inferior de Safari.</p>
                </li>
                <li className="flex gap-4">
                  <div className="bg-surface-container-high w-8 h-8 rounded-full flex items-center justify-center font-bold text-primary shrink-0">2</div>
                  <p className="text-on-surface">Desliza hacia abajo y selecciona <strong>Agregar a inicio</strong> <span className="inline-block align-middle material-symbols-outlined text-xl ml-1">add_box</span>.</p>
                </li>
                <li className="flex gap-4">
                  <div className="bg-surface-container-high w-8 h-8 rounded-full flex items-center justify-center font-bold text-primary shrink-0">3</div>
                  <p className="text-on-surface">Toca <strong>Agregar</strong> en la esquina superior derecha.</p>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Side: Mockup visual */}
        <div className="flex-1 flex justify-center mt-12 md:mt-0">
          <div className="relative w-72 h-[600px] bg-black rounded-[3rem] border-[8px] border-gray-900 shadow-2xl overflow-hidden shadow-primary/20">
            {/* Pantalla del Celular simulada */}
            <div className="absolute top-0 w-full h-full bg-surface">
              {/* Top Bar Fake */}
              <div className="bg-primary h-24 w-full rounded-b-3xl relative">
                <div className="absolute top-4 w-full flex justify-center">
                  <div className="w-20 h-6 bg-black rounded-full"></div> {/* Notch */}
                </div>
                <div className="absolute bottom-4 left-6 right-6 flex justify-between text-white font-bold">
                  <span>Todas las zonas</span>
                  <span className="material-symbols-outlined">search</span>
                </div>
              </div>
              
              <div className="p-4 space-y-4 mt-2">
                <div className="h-32 bg-surface-container-high rounded-xl w-full"></div>
                <div className="h-32 bg-surface-container-high rounded-xl w-full"></div>
                <div className="h-32 bg-surface-container-high rounded-xl w-full"></div>
              </div>

              {/* Install Overlay Simulation */}
              <div className="absolute bottom-0 w-full bg-surface-container-highest p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Azul Entrega</h4>
                    <p className="text-sm text-secondary">Instalar App Oficial</p>
                  </div>
                </div>
                <div className="w-full bg-primary h-12 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
