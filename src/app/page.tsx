'use client';

import React from 'react';
import Link from 'next/link';

export default function BlueExpressLandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-[0px_4px_16px_rgba(0,63,135,0.3)]">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm font-bold text-primary leading-none">BlueExpress</span>
              <span className="text-[10px] text-secondary tracking-widest uppercase font-bold mt-1">Plataforma Logística</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-secondary hover:text-primary font-label-md transition-colors">Beneficios</a>
            <a href="#partners" className="text-secondary hover:text-primary font-label-md transition-colors">Para Negocios</a>
            <Link href="/descargar" className="text-secondary hover:text-primary font-label-md transition-colors">Descargar App</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden sm:flex text-primary font-bold text-label-md hover:bg-primary-container/10 px-4 py-2.5 rounded-full transition-colors"
            >
              Acceso Socios
            </Link>
            <Link 
              href="/azul" 
              className="bg-primary text-white font-headline-sm text-headline-sm px-6 py-3 rounded-full font-bold shadow-[0px_4px_14px_rgba(0,63,135,0.25)] hover:scale-[1.03] active:scale-95 transition-all"
            >
              Pedir Ahora
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:py-32 overflow-hidden bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        {/* Decorative Blurred Circles */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/10 w-80 h-80 bg-secondary-fixed/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          {/* Left Column: Text & CTA */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-label-md font-bold mb-6">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              Entregas Ultra Rápidas en tu Ciudad
            </div>

            <h1 className="font-headline-lg text-[40px] sm:text-[56px] lg:text-[64px] font-extrabold text-on-surface leading-tight mb-6">
              Tus antojos a la <br className="hidden md:block"/> velocidad de un <span className="text-primary bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">clic</span>.
            </h1>

            <p className="font-body-lg text-secondary text-lg sm:text-xl max-w-xl mb-10 leading-relaxed">
              Pide de tus restaurantes favoritos, realiza el seguimiento en tiempo real y recibe tus pedidos con la mayor seguridad con <strong>BlueExpress</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/azul" 
                className="bg-primary text-white text-headline-sm py-4 px-8 rounded-full font-bold flex items-center justify-center gap-3 shadow-[0px_8px_24px_rgba(0,63,135,0.3)] hover:scale-[1.03] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">shopping_basket</span>
                Explorar Restaurantes
              </Link>
              <Link 
                href="/descargar" 
                className="bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface text-headline-sm py-4 px-8 rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">download</span>
                Descargar Aplicación
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 sm:gap-10 mt-16 pt-8 border-t border-outline-variant w-full max-w-md lg:max-w-none">
              <div>
                <h3 className="text-3xl font-bold text-primary">15 min</h3>
                <p className="text-sm text-secondary mt-1">Tiempo prom. entrega</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-primary">99.8%</h3>
                <p className="text-sm text-secondary mt-1">Órdenes exitosas</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-primary">4.9 ★</h3>
                <p className="text-sm text-secondary mt-1">Calificación promedio</p>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center relative">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary-fixed/20 rounded-full blur-3xl opacity-50 scale-90"></div>

            {/* Mockup Frame */}
            <div className="relative w-80 h-[560px] bg-black rounded-[3rem] border-[10px] border-gray-900 shadow-[0px_24px_64px_rgba(0,0,0,0.15)] overflow-hidden">
              {/* Phone Content Screen */}
              <div className="absolute inset-0 bg-surface flex flex-col">
                {/* Fake Phone Header */}
                <div className="bg-primary h-20 w-full rounded-b-2xl relative flex items-end p-4">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full"></div>
                  <div className="w-full flex justify-between items-center text-white">
                    <span className="font-bold text-xs">BlueExpress App</span>
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                  </div>
                </div>

                {/* Map/Order Tracking Simulation */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto no-scrollbar">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">Tu pedido está en camino</h4>
                        <p className="text-[10px] text-secondary">Llega en 8 minutos</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
                  </div>

                  {/* Dummy Stores */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold text-secondary tracking-wider block">Restaurantes Destacados</span>
                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined">restaurant</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs">Burger Palace</h5>
                        <p className="text-[10px] text-secondary">Hamburguesas Premium</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-primary-container text-primary font-bold text-[8px] px-1.5 py-0.5 rounded-full">Envío Gratis</span>
                          <span className="text-[8px] text-secondary">4.8 ★</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined">local_pizza</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-xs">La Piazza</h5>
                        <p className="text-[10px] text-secondary">Pizzas Artesanales</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-primary-container text-primary font-bold text-[8px] px-1.5 py-0.5 rounded-full">15-20 min</span>
                          <span className="text-[8px] text-secondary">4.9 ★</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Fake */}
                <div className="h-16 border-t border-outline-variant bg-surface flex justify-around items-center px-4">
                  <span className="material-symbols-outlined text-primary">home</span>
                  <span className="material-symbols-outlined text-secondary">search</span>
                  <span className="material-symbols-outlined text-secondary">shopping_cart</span>
                  <span className="material-symbols-outlined text-secondary">person</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface-container-lowest border-y border-outline-variant">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface mb-4">¿Por qué usar BlueExpress?</h2>
            <p className="font-body-md text-secondary text-lg">Creamos la mejor experiencia logística para que disfrutes de tu comida favorita sin preocupaciones.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">timer</span>
              </div>
              <h3 className="font-headline-sm font-bold text-on-surface mb-3">Velocidad Incomparable</h3>
              <p className="font-body-md text-secondary leading-relaxed">
                Nuestros algoritmos de ruta inteligentes y la flota dedicada garantizan que tu comida llegue en un tiempo récord de 15 a 25 minutos.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">map</span>
              </div>
              <h3 className="font-headline-sm font-bold text-on-surface mb-3">Seguimiento Real-Time</h3>
              <p className="font-body-md text-secondary leading-relaxed">
                Observa a tu repartidor en vivo en el mapa. Recibe notificaciones automáticas en cada etapa, desde la preparación hasta la puerta de tu casa.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl">shield</span>
              </div>
              <h3 className="font-headline-sm font-bold text-on-surface mb-3">Seguridad Garantizada</h3>
              <p className="font-body-md text-secondary leading-relaxed">
                Monitoreamos cada entrega. Los conductores siguen estrictos protocolos de higiene y tu comida se entrega perfectamente sellada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners / B2B Section */}
      <section id="partners" className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary-container text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <span className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full font-label-md font-bold mb-6 inline-block">
              Crece con Nosotros
            </span>
            <h2 className="font-headline-lg text-3xl sm:text-5xl font-extrabold mb-6 leading-tight">
              ¿Tienes un restaurante o eres repartidor?
            </h2>
            <p className="font-body-lg text-white/80 text-lg sm:text-xl mb-10 leading-relaxed">
              Únete a la red de logística más grande. Incrementa las ventas de tu negocio u obtén ingresos excelentes y maneja tu propio tiempo como conductor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/login" 
                className="bg-white text-primary text-headline-sm py-4 px-8 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
              >
                Registrar mi Tienda
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link 
                href="/login" 
                className="bg-transparent border-2 border-white/30 hover:border-white text-white text-headline-sm py-4 px-8 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all"
              >
                Ser Repartidor
                <span className="material-symbols-outlined">sports_motorsports</span>
              </Link>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-6 w-full max-w-md lg:max-w-none">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h4 className="text-3xl font-bold mb-2">+45%</h4>
              <p className="text-sm text-white/70">Aumento de ventas promedio en tiendas aliadas.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <h4 className="text-3xl font-bold mb-2">100%</h4>
              <p className="text-sm text-white/70">Flexibilidad horaria completa para los conductores.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md col-span-2">
              <h4 className="text-xl font-bold mb-2">Plataforma Auto-Gestionable</h4>
              <p className="text-sm text-white/70">Administra inventario, promociones y visualiza métricas del día de forma interactiva.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-high border-t border-outline-variant py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <span className="font-headline-sm font-bold text-primary">BlueExpress</span>
            </div>
            <p className="text-secondary text-sm max-w-sm leading-relaxed">
              La plataforma de delivery número uno diseñada bajo el sistema de diseño Stitch para ofrecerte la experiencia definitiva.
            </p>
            <div className="text-xs text-outline">
              © {new Date().getFullYear()} BlueExpress Inc. Todos los derechos reservados.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-on-surface mb-4">Servicios</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><Link href="/azul" className="hover:text-primary transition-colors">Pedir Comida</Link></li>
              <li><Link href="/descargar" className="hover:text-primary transition-colors">Instalar App</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Acceso Socios</Link></li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="font-bold text-on-surface mb-4">Contacto y Soporte</h4>
            <ul className="space-y-3 text-sm text-secondary">
              <li><span className="hover:text-primary transition-colors cursor-pointer">Soporte Técnico</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Términos de Servicio</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Privacidad</span></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
