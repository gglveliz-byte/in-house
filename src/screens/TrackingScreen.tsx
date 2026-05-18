import React from 'react';
import Link from 'next/link';

export const TrackingScreen: React.FC = () => {
  return (
    <div className="bg-background text-on-background min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* Mobile Container */}
      <main className="w-full max-w-md mx-auto min-h-screen bg-surface relative shadow-2xl overflow-hidden flex flex-col">
        {/* TopAppBar */}
        <header className="bg-surface dark:bg-surface-dim fixed top-0 w-full z-50 flex items-center justify-between px-margin-mobile h-16 max-w-md mx-auto left-0 right-0">
          <button type="button" className="text-primary dark:text-primary-fixed-dim hover:bg-surface-container-high transition-colors active:scale-95 flex items-center justify-center p-2 -ml-2 rounded-full">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </button>
          <h1 className="font-headline-sm text-headline-sm-mobile text-primary dark:text-primary-fixed-dim text-center">
            Dirección de entrega
          </h1>
          <button className="text-primary dark:text-primary-fixed-dim hover:bg-surface-container-high transition-colors active:scale-95 flex items-center justify-center p-2 -mr-2 rounded-full">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </header>

        {/* Map Area (Top Half) */}
        <section aria-label="Mapa de seguimiento" className="h-[486px] w-full relative bg-surface-container-low mt-16">
          {/* Map Background Image */}
          <img alt="Mapa de la ciudad" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale contrast-125" data-alt="A stylized, overhead digital map interface showing a city street layout. The style is modern corporate, using a light mode color palette with soft gray roads, subtle blue water features, and clean white landmasses. The lighting is bright, even, and highly legible. The aesthetic is high-tech but accessible, designed for a high-end food delivery app background. No text or labels are visible." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl3Nru8LxGFldYJg8enoWnQo1jWrqrm5FK4FTXaqfx5w6HsvWwqRUxQm50SGKBKRGpKmRFTbZhKbKXJZiJaGcM8FDxGvuxK3TdHy3sO0QPgOCCE14mzxURg6JNS_QRbHQRvV5T0yL9bw6YTRpX885-BfJEikCYEV-_YAOmFPjhLCAWuEwirtZxZ0xgl3Z4iLe3myIC1w3yb7A2WQLUnH80b9sNANni9d_CPTKpD-1i92Q4Fn9t8ie2eCWdEzbK_uKNhRfh_QSWiQg" />
          {/* Map Overlays / Styling */}
          <div className="absolute inset-0 bg-primary/5 mix-blend-multiply pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-transparent to-surface-container-lowest pointer-events-none"></div>
          {/* Route Visualization (Abstract SVG Path) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path className="opacity-80" d="M 25 70 Q 40 40 65 35" fill="none" stroke="#003f87" strokeDasharray="2, 1.5" strokeWidth="0.8"></path>
          </svg>
          {/* Origin Point */}
          <div className="absolute top-[35%] right-[35%] w-4 h-4 bg-surface-container-lowest rounded-full border-4 border-outline-variant shadow-sm flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"></div>
          {/* Driver Pin (Dynamic) */}
          <div className="absolute top-[50%] left-[45%] flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-primary text-on-primary rounded-full p-2.5 shadow-[0px_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center relative z-10">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bike</span>
            </div>
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20 scale-150"></div>
            {/* Connecting line to point */}
            <div className="w-0.5 h-4 bg-primary mt-0.5 shadow-sm"></div>
            <div className="w-2 h-2 bg-primary rounded-full shadow-sm"></div>
          </div>
          {/* Destination Pin */}
          <div className="absolute bottom-[30%] left-[25%] flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-surface-container-lowest text-primary rounded-full p-2 shadow-[0px_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center z-10 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            </div>
            <div className="w-1.5 h-1.5 bg-outline-variant rounded-full mt-1 shadow-sm"></div>
          </div>
        </section>

        {/* Bottom Sheet (Information & Controls) */}
        <section className="flex-1 bg-surface-container-lowest rounded-t-xl -mt-8 relative z-20 px-margin-mobile pt-6 pb-8 shadow-[0px_-8px_24px_rgba(0,0,0,0.06)] flex flex-col gap-stack-lg border-t border-outline-variant/10">
          {/* Drag Handle Indicator */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-surface-container-highest rounded-full"></div>
          
          {/* Status Header */}
          <div className="flex flex-col items-center text-center gap-stack-sm pt-2">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Llega en 15 min</h2>
            <div className="inline-flex items-center gap-2 bg-primary-fixed/50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <p className="font-label-md text-label-md text-primary tracking-wide uppercase">En camino</p>
            </div>
          </div>

          {/* Timeline Tracker */}
          <div className="relative w-full px-6 py-2">
            {/* Track Line */}
            <div className="absolute top-1/2 left-10 right-10 h-[3px] bg-surface-container-highest -translate-y-1/2 rounded-full"></div>
            {/* Active Progress Line */}
            <div className="absolute top-1/2 left-10 w-[50%] h-[3px] bg-primary -translate-y-1/2 rounded-full transition-all duration-1000 ease-out"></div>
            {/* Step Nodes */}
            <div className="flex justify-between relative z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest border-[3px] border-primary text-primary flex items-center justify-center shadow-sm relative">
                  <div className="absolute inset-[-6px] rounded-full border border-primary/30"></div>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bike</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-surface-container text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">home</span>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Card */}
          <div className="bg-surface p-4 rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex flex-col gap-stack-md">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full bg-surface-container-highest flex-shrink-0">
                <img alt="Foto del repartidor" className="w-full h-full rounded-full object-cover border-2 border-surface-container-lowest" data-alt="A close-up portrait of a friendly, professional male delivery driver. He has a warm smile and is wearing a dark corporate jacket over a clean shirt. The lighting is bright, soft, and flattering, typical of high-end corporate headshots. The background is slightly blurred with light tones, maintaining a modern, clean light-mode aesthetic. High resolution and detailed." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZ7fXdmb6nVKXlHaGHFfgAkgG2mTv8YC2_uzDLhnADaf0NI20BilXW6kgmWk7jfzybL833SJ7p2lm4qcwh064aQwZbI7yVDdauie17RFt-OJxyfNx_A2U0vfoVtefb65uEQKAsYF1gREEkFuAsHfn1YiQj8Im7_A_tDbaYTeyh9AX0utIcsLOIK_YIrJJJwi1oAph62j2PGMDnJdquNBY_t8XhRSs9U_KrY-XXeZ0VR8kKqDne7nvJbuqPxqI16bW5Li6zJ_4C9eM" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#10B981] border-2 border-surface-container-lowest rounded-full"></div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Carlos Rivera</h3>
                <p className="font-body-md text-body-md text-secondary">Honda Navi • ABC-123</p>
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
              <button className="flex-1 bg-surface-container-highest hover:bg-surface-container-high transition-colors py-3 rounded-lg flex items-center justify-center gap-2 text-on-surface font-headline-sm text-headline-sm">
                <span className="material-symbols-outlined text-[20px]">call</span>
                Llamar
              </button>
              <button className="flex-1 bg-primary hover:bg-primary-container transition-colors py-3 rounded-lg flex items-center justify-center gap-2 text-on-primary font-headline-sm text-headline-sm shadow-sm">
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Mensaje
              </button>
            </div>
          </div>

          {/* Order Details Teaser */}
          <Link href="/azul/cart" className="w-full bg-surface-container-low hover:bg-surface-container transition-colors p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Pedido #89012</p>
                <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5">Ver detalles del pedido</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </Link>
        </section>
      </main>
    </div>
  );
};
