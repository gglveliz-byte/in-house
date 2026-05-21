'use client';

import React, { useState, useEffect } from 'react';
import LinkComponent from 'next/link';
import { 
  Bike, 
  Shield, 
  Clock, 
  Smartphone, 
  ChevronDown, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Star,
  MapPin,
  UtensilsCrossed,
  Send,
  Loader2,
  Lock,
  Zap,
  DollarSign,
  Maximize2
} from 'lucide-react';

export default function BlueExpressArtisanalLanding() {
  // Phone Screen Tab Controller (User controlled + Auto fallback)
  const [activeScreen, setActiveScreen] = useState<0 | 1 | 2>(0);
  const [isHoveredPhone, setIsHoveredPhone] = useState(false);

  // Auto transition phone screen if user is not interacting
  useEffect(() => {
    if (isHoveredPhone) return;
    const interval = setInterval(() => {
      setActiveScreen((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHoveredPhone]);

  // Earnings Calculator State
  const [partnerRole, setPartnerRole] = useState<'restaurant' | 'driver'>('restaurant');
  const [ordersPerDay, setOrdersPerDay] = useState(30);
  const [avgTicket, setAvgTicket] = useState(18);
  const [deliveriesPerDay, setDeliveriesPerDay] = useState(15);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // App Link Sender State
  const [contactInput, setContactInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setContactInput('');
      setTimeout(() => setSendSuccess(false), 5000);
    }, 1800);
  };

  // Profit calculations
  const calculatedRestaurantSales = ordersPerDay * avgTicket * 30;
  const calculatedRestaurantProfit = Math.round(calculatedRestaurantSales * 0.35); // 35% net margin
  const calculatedDriverProfit = Math.round(deliveriesPerDay * 5.0 * 30 + (deliveriesPerDay > 12 ? 200 : 0));

  const faqs = [
    {
      q: '¿Cómo garantiza la app el rastreo en tiempo real?',
      a: 'BlueExpress utiliza una infraestructura de websockets en tiempo real combinada con actualizaciones de GPS nativas del móvil de cada conductor. Esto permite que el cliente vea el movimiento fluido del repartidor sobre el mapa de Google Maps con una latencia inferior a un segundo.'
    },
    {
      q: '¿Cuáles son las comisiones para las tiendas asociadas?',
      a: 'Nuestra política comercial es sumamente transparente: cobramos un esquema de tarifa fija basado únicamente en el éxito de cada orden completada. No existen suscripciones mensuales, tarifas fijas de listado ni costos ocultos. Si tú no vendes, nosotros no ganamos.'
    },
    {
      q: '¿Cómo funciona la instalación PWA sin ir a Play Store?',
      a: 'Las Progressive Web Apps (PWA) son la tecnología del futuro. Al entrar a nuestra web desde el navegador de tu celular, el sistema te invitará a "Instalar la aplicación". Se guardará directamente en tu pantalla de inicio como una app nativa, pesando menos de 5MB, consumiendo menos batería y actualizándose solas en segundo plano.'
    },
    {
      q: '¿Cómo se procesan los pagos y las liquidaciones?',
      a: 'Ofrecemos soporte completo para múltiples métodos de pago locales y tarjetas internacionales de crédito/débito. Las liquidaciones de ingresos a las tiendas asociadas se realizan de forma automatizada cada 24 horas hábiles directamente a su cuenta bancaria registrada.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col font-sans overflow-x-hidden selection:bg-[#003f87] selection:text-white relative">
      
      {/* Handcrafted Geometrical SVG Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative Radial Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-[#003f87]/40 to-blue-500/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] bg-gradient-to-br from-emerald-500/20 to-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* Header / Premium Glassmorphic Navbar */}
      <header className="bg-[#0b0f19]/80 backdrop-blur-lg border-b border-slate-800/80 sticky top-0 z-50 w-full transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
          
          {/* Logo with Tech Vibe */}
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#003f87] to-blue-600 flex items-center justify-center text-white shadow-[0px_8px_24px_rgba(0,63,135,0.4)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0px_8px_32px_rgba(0,63,135,0.6)] border border-blue-400/20">
              <Bike className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                BlueExpress
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  LIVE
                </span>
              </span>
              <span className="text-[9px] text-slate-400 tracking-widest font-black uppercase hidden sm:block">LOGÍSTICA URBANA E2E</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#interactive-suite" className="text-slate-400 hover:text-white font-semibold text-sm transition-colors">¿Cómo Funciona?</a>
            <a href="#earnings-calc" className="text-slate-400 hover:text-white font-semibold text-sm transition-colors">Calculadora de Ganancias</a>
            <a href="#tech-stack" className="text-slate-400 hover:text-white font-semibold text-sm transition-colors">Infraestructura</a>
            <a href="#faq-section" className="text-slate-400 hover:text-white font-semibold text-sm transition-colors">Soporte</a>
          </nav>

          {/* Action Links */}
          <div className="flex items-center gap-2 sm:gap-4">
            <LinkComponent 
              href="/login" 
              className="hidden sm:flex text-slate-300 font-bold text-sm hover:text-white hover:bg-slate-800/60 border border-slate-800/80 px-4 py-2 rounded-full transition-all"
            >
              Acceso Socios
            </LinkComponent>
            <LinkComponent 
              href="/azul" 
              className="bg-gradient-to-r from-[#003f87] to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-[0px_10px_24px_rgba(0,63,135,0.3)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 border border-blue-400/20"
            >
              Pedir Ahora
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </LinkComponent>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-36 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          
          {/* Hero Left Content */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start relative">
            
            {/* Interactive Glare Badge */}
            <div className="inline-flex items-center gap-2 bg-[#003f87]/20 text-blue-400 border border-[#003f87]/50 px-4 py-2 rounded-full text-xs font-black mb-6 uppercase tracking-wider shadow-inner">
              <Zap className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
              Estructura PWA e Infraestructura en Tiempo Real
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[72px] font-black text-white leading-[1.02] tracking-tighter mb-8">
              La Red de Delivery <br />
              más rápida e <br />
              <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                inteligente.
              </span>
            </h1>

            <p className="text-slate-400 text-lg sm:text-xl max-w-xl mb-12 leading-relaxed">
              Diseñada artesanalmente para optimizar tus tiempos. Conexión de sockets en vivo, mapas integrados resilientes y una interfaz rápida que se instala al instante.
            </p>

            {/* App Download Link Sender Box */}
            <form onSubmit={handleSendLink} className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-xl backdrop-blur-md mb-12">
              <input 
                type="text" 
                placeholder="Ingresa tu email o móvil..." 
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                disabled={isSending || sendSuccess}
                className="bg-transparent border-0 outline-none ring-0 text-sm text-white placeholder-slate-500 px-4 py-3 flex-1 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isSending || sendSuccess}
                className="bg-[#003f87] hover:bg-blue-600 text-white font-bold text-xs py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg disabled:opacity-70 border border-blue-400/20"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : sendSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                ) : (
                  <>
                    <span>Enviar App</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Dynamic Success Notice */}
            {sendSuccess && (
              <p className="text-emerald-400 text-xs font-bold mb-8 animate-pulse text-left w-full max-w-md">
                ✓ ¡Enlace enviado! Revisa tu bandeja de entrada para instalar BlueExpress.
              </p>
            )}

            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-12 border-t border-slate-800 pt-8 w-full max-w-lg lg:max-w-none text-left">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-1">
                  18m <Sparkles className="w-4 h-4 text-teal-400" />
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tiempo de Entrega</p>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">0% Fijo</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Costo de Registro</p>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">99.9%</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">SLA Operativo</p>
              </div>
            </div>

          </div>

          {/* Hero Right Visual: The Dynamic Hands-on Phone */}
          <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center relative">
            
            {/* Phone Case Frame */}
            <div 
              onMouseEnter={() => setIsHoveredPhone(true)}
              onMouseLeave={() => setIsHoveredPhone(false)}
              className="relative w-80 h-[620px] bg-[#0c1220] rounded-[3.2rem] border-[10px] border-slate-900 shadow-[0px_32px_96px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-[0px_32px_96px_rgba(0,63,135,0.2)] group"
            >
              
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-7 bg-black z-30 flex justify-center items-center">
                <div className="w-24 h-4 bg-black rounded-b-xl"></div>
              </div>

              {/* Dynamic Screen Content Wrapper */}
              <div className="absolute inset-0 bg-[#070b13] flex flex-col pt-7">
                
                {/* State 0: Tracking screen */}
                {activeScreen === 0 && (
                  <div className="flex-1 p-4 flex flex-col justify-between text-white animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-[#003f87] tracking-widest">RASTREO EN TIEMPO REAL</span>
                      <span className="bg-emerald-500/20 text-emerald-400 font-extrabold text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        ACTIVO
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-3 my-2">
                      <div className="w-9 h-9 rounded-full bg-[#003f87] text-white flex items-center justify-center">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-black text-xs text-white">Carlos Mendoza</h5>
                        <p className="text-[8px] text-slate-400">Repartidor en camino</p>
                      </div>
                    </div>

                    {/* Geolocation Graphic Area */}
                    <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl my-3 relative overflow-hidden flex items-center justify-center p-4">
                      {/* Grid representation */}
                      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10">
                        <div className="border-r border-b border-slate-700"></div>
                        <div className="border-r border-b border-slate-700"></div>
                        <div className="border-r border-b border-slate-700"></div>
                        <div className="border-b border-slate-700"></div>
                      </div>
                      {/* Live Path */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                        <path d="M 30,170 Q 100,100 170,30" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5 3" />
                      </svg>
                      {/* Map Pins */}
                      <div className="absolute bottom-6 left-6 bg-[#003f87] text-white p-1 rounded-full shadow-md">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <div className="absolute top-6 right-6 bg-emerald-500 text-white p-1.5 rounded-full shadow-md animate-bounce">
                        <Bike className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="bg-[#003f87] p-3 rounded-xl text-center">
                      <p className="font-black text-xs">Llega en aproximadamente 12 mins</p>
                    </div>
                  </div>
                )}

                {/* State 1: Shop Menu */}
                {activeScreen === 1 && (
                  <div className="flex-1 p-4 flex flex-col justify-between text-white animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-blue-400 tracking-widest">COMERCIOS DISPONIBLES</span>
                      <ShoppingBag className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-lg">🍔</div>
                        <div className="flex-1">
                          <h5 className="font-black text-xs text-white">Gourmet Burger</h5>
                          <p className="text-[8px] text-slate-400">Hamburguesas Premium</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-[#003f87]/20 text-blue-400 font-bold text-[7px] px-1.5 py-0.5 rounded-full">Envío Gratis</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-lg">🍕</div>
                        <div className="flex-1">
                          <h5 className="font-black text-xs text-white">La Nonna Pizza</h5>
                          <p className="text-[8px] text-slate-400">Pizzas napolitanas</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-[#003f87]/20 text-blue-400 font-bold text-[7px] px-1.5 py-0.5 rounded-full">15-20 min</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center text-[10px] font-bold text-slate-400">
                      Más de 48 restaurantes activos
                    </div>
                  </div>
                )}

                {/* State 2: Driver Portal */}
                {activeScreen === 2 && (
                  <div className="flex-1 p-4 flex flex-col justify-between text-white animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-teal-400 tracking-widest">CONSOLA DEL CONDUCTOR</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>

                    <div className="my-auto text-center py-4">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ganancias Estimadas de Hoy</p>
                      <h3 className="text-4xl font-black text-emerald-400 mt-1.5">$54.80</h3>
                      <p className="text-[8px] text-slate-400 mt-1">12 despachos finalizados</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 text-left">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-[9px] font-bold text-slate-400">Próximo despacho</span>
                        <span className="text-[9px] font-black text-emerald-400">+$6.50</span>
                      </div>
                      <p className="font-bold text-xs text-white">Recoger en Burger Co</p>
                      <p className="text-[8px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-blue-400" />
                        A menos de 600m de tu posición
                      </p>
                    </div>
                  </div>
                )}

                {/* Fake Home Indicator */}
                <div className="h-4 flex items-center justify-center bg-black/40 z-30">
                  <div className="w-24 h-1 bg-slate-700 rounded-full"></div>
                </div>

              </div>

              {/* Absolute Glassmorphic controller on hover */}
              <div className="absolute bottom-6 inset-x-4 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 flex justify-around items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40">
                <button 
                  onClick={() => setActiveScreen(0)}
                  className={`p-2 rounded-lg text-xs font-black transition-colors ${activeScreen === 0 ? 'bg-[#003f87] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Rastreo
                </button>
                <button 
                  onClick={() => setActiveScreen(1)}
                  className={`p-2 rounded-lg text-xs font-black transition-colors ${activeScreen === 1 ? 'bg-[#003f87] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Comercios
                </button>
                <button 
                  onClick={() => setActiveScreen(2)}
                  className={`p-2 rounded-lg text-xs font-black transition-colors ${activeScreen === 2 ? 'bg-[#003f87] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Conductor
                </button>
              </div>

            </div>

            {/* Premium Absolute Float Badges */}
            <div className="hidden sm:flex absolute top-1/4 right-0 lg:-right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl shadow-2xl items-center gap-3 animate-float max-w-[190px] z-20">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h5 className="font-bold text-xs text-white">Encriptación E2E</h5>
                <p className="text-[8px] text-slate-500">Datos protegidos con Bcrypt.</p>
              </div>
            </div>

            <div className="hidden sm:flex absolute bottom-1/4 left-0 lg:-left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-4 rounded-2xl shadow-2xl items-center gap-3 animate-float max-w-[190px] z-20" style={{ animationDelay: '2s' }}>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h5 className="font-bold text-xs text-white">99.8% Éxito</h5>
                <p className="text-[8px] text-slate-500">Órdenes perfectas sin fallos.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Interactive Flow Suite (Non-AI, very professional, hands-on step layout) */}
      <section id="interactive-suite" className="py-28 bg-[#070b13] border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="text-[#003f87] text-xs font-black uppercase tracking-widest">CÓMO SE ORQUESTA</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">La sincronía perfecta de la logística</h2>
            <p className="text-slate-400 mt-4 text-base">Un flujo continuo y automatizado donde cada componente se entera del estado del pedido al instante sin demoras manuales.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Step 1: Client */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-8 hover:border-blue-500/30 transition-all group relative">
              <div className="absolute top-4 right-4 text-5xl font-black text-slate-800/60">01</div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-8 border border-blue-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">1. El Cliente Ordena</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                El usuario final busca y selecciona platos desde el navegador móvil o PWA. Al pagar, el carrito interactivo se almacena localmente y la orden se escribe directamente en la base de datos de producción.
              </p>
              <div className="border-t border-slate-800/60 pt-4 text-xs text-slate-500">
                ✓ Sockets Pusher listos para notificar cambios.
              </div>
            </div>

            {/* Step 2: Vendor */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-8 hover:border-orange-500/30 transition-all group relative">
              <div className="absolute top-4 right-4 text-5xl font-black text-slate-800/60">02</div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-8 border border-orange-500/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">2. El Comercio Prepara</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                El Dashboard del Vendedor recibe la alerta auditiva y visual al instante. El local acepta, procesa y marca la comanda como &quot;Lista para enviar&quot;, lo que dispara un evento Pusher global a los repartidores cercanos.
              </p>
              <div className="border-t border-slate-800/60 pt-4 text-xs text-slate-500">
                ✓ Impresión de comandas e inventario dinámico.
              </div>
            </div>

            {/* Step 3: Driver */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-8 hover:border-emerald-500/30 transition-all group relative">
              <div className="absolute top-4 right-4 text-5xl font-black text-slate-800/60">03</div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-8 border border-emerald-500/20">
                <Bike className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">3. El Conductor Despacha</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                La aplicación móvil del repartidor asigna la orden por GPS. El conductor recoge el pedido sellado y su posición en mapa de Google Maps se comparte de forma segura hasta finalizar la entrega exitosamente.
              </p>
              <div className="border-t border-slate-800/60 pt-4 text-xs text-slate-500">
                ✓ Tarifa cobrada por kilómetro recorrido.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Dynamic Partner Earnings Calculator Section */}
      <section id="earnings-calc" className="py-28 bg-[#0b0f19] border-b border-slate-900 relative">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#003f87] text-xs font-black uppercase tracking-widest">SIMULADOR OPERATIVO</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">Calcula tus ganancias netas</h2>
            <p className="text-slate-400 mt-4 text-base">Ajusta los sliders según tu volumen proyectado para calcular tus ingresos netos mensuales.</p>
          </div>

          <div className="bg-[#0e1424] rounded-3xl border border-slate-800 p-5 sm:p-8 md:p-12 flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left: Interactive Controls */}
            <div className="flex-1 space-y-8 w-full">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Elige tu rol en el ecosistema</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
                  <button 
                    onClick={() => setPartnerRole('restaurant')}
                    className={`py-3 rounded-xl font-bold text-xs uppercase transition-all ${partnerRole === 'restaurant' ? 'bg-[#003f87] text-white shadow-lg border border-blue-400/20' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🏪 Tienda Aliada
                  </button>
                  <button 
                    onClick={() => setPartnerRole('driver')}
                    className={`py-3 rounded-xl font-bold text-xs uppercase transition-all ${partnerRole === 'driver' ? 'bg-[#003f87] text-white shadow-lg border border-blue-400/20' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🏍️ Repartidor Activo
                  </button>
                </div>
              </div>

              {partnerRole === 'restaurant' ? (
                <div className="space-y-6">
                  {/* Slider 1 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">Pedidos Diarios Estimados</span>
                      <span className="text-blue-400 text-sm font-black">{ordersPerDay} órdenes/día</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={ordersPerDay}
                      onChange={(e) => setOrdersPerDay(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#003f87]"
                    />
                  </div>
                  {/* Slider 2 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">Ticket Promedio de Venta</span>
                      <span className="text-blue-400 text-sm font-black">${avgTicket} USD</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      value={avgTicket}
                      onChange={(e) => setAvgTicket(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#003f87]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Slider 1 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">Entregas Diarias Completadas</span>
                      <span className="text-blue-400 text-sm font-black">{deliveriesPerDay} entregas/día</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="30" 
                      value={deliveriesPerDay}
                      onChange={(e) => setDeliveriesPerDay(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#003f87]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Custom dynamic meter visual */}
            <div className="w-full lg:w-[350px] bg-gradient-to-br from-[#003f87] to-slate-950 text-white rounded-3xl p-5 sm:p-8 border border-slate-800 flex flex-col justify-between min-h-[320px] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent)] pointer-events-none"></div>

              <div>
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block mb-1">PROYECCIÓN MENSUAL NETO</span>
                <p className="text-[11px] text-slate-400">Calculado bajo márgenes estables de mercado.</p>
              </div>

              <div className="my-6">
                <span className="text-5xl font-black text-emerald-400 tracking-tight flex items-baseline">
                  ${partnerRole === 'restaurant' ? calculatedRestaurantProfit.toLocaleString('es-ES') : calculatedDriverProfit.toLocaleString('es-ES')}
                  <span className="text-lg font-bold text-white/70 ml-1.5">USD</span>
                </span>
                
                {/* Custom Visual Meter Progress Bar */}
                <div className="mt-4 w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ 
                      width: partnerRole === 'restaurant' 
                        ? `${Math.min((calculatedRestaurantProfit / 6300) * 100, 100)}%` 
                        : `${Math.min((calculatedDriverProfit / 4700) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sin tarifas ni suscripciones fijas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Liquidaciones bancarias cada 24 horas</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Tech Stack Bento Grid */}
      <section id="tech-stack" className="py-28 bg-[#070b13]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="text-[#003f87] text-xs font-black uppercase tracking-widest">INFRAESTRUCTURA TÉCNICA</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">Tecnología de última generación</h2>
            <p className="text-slate-400 mt-4 text-base">Un backend rápido optimizado para alta concurrencia y tolerancia a fallos en producción.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tech 1 */}
            <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-8 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Sockets en Tiempo Real vía Pusher</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Evita consultas manuales innecesarias. Todo el ecosistema (cliente, tienda y repartidor) se comunica en vivo. Los cambios de estado de las órdenes actualizan las pantallas del cliente en milisegundos de forma transparente.
                </p>
              </div>
              <div className="mt-8 flex gap-2 flex-wrap">
                <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase px-3 py-1 rounded-md">Websockets</span>
                <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase px-3 py-1 rounded-md">Latencia Baja</span>
              </div>
            </div>

            {/* Tech 2 */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-8 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Google Maps &amp; Fallbacks</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Mapas en vivo interactivos de alta precisión. En caso de fallas de conexión o API, el sistema activa un modo de fallback de coordenadas manual para no interrumpir el flujo.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 block">Resiliencia activa.</span>
            </div>

            {/* Tech 3 */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-8 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Base de Datos PostgreSQL</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Base de datos relacional robusta en la nube operada con Prisma ORM. Control transaccional completo, seguridad estricta y contraseñas cifradas bajo BcryptJS.
                </p>
              </div>
              <span className="text-[10px] text-slate-500 mt-6 block">Encriptación robusta.</span>
            </div>

            {/* Tech 4 */}
            <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-8 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Instalación PWA Ultraligera</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Olvídate de las tiendas de aplicaciones y los procesos de aprobación lentos. Nuestra aplicación se descarga directamente del navegador con un solo botón en tu pantalla principal en menos de 3 segundos, pesando apenas 3MB de almacenamiento.
                </p>
              </div>
              <div className="mt-8 flex gap-2 flex-wrap">
                <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase px-3 py-1 rounded-md">Instalación Instantánea</span>
                <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[9px] font-black uppercase px-3 py-1 rounded-md">Cero Play Store</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faq-section" className="py-28 bg-[#0b0f19] border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[#003f87] text-xs font-black uppercase tracking-widest">SOPORTE AL CLIENTE Y SOCIO</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">Preguntas Frecuentes</h2>
            <p className="text-slate-400 mt-4 text-base">Todo lo que necesitas saber acerca del funcionamiento de nuestra red logística.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-6 text-left flex justify-between items-center font-bold text-white text-sm sm:text-base gap-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="flex items-center gap-2 sm:gap-3">
                      <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                  </button>
                  
                  {/* Dynamic Slide Transition */}
                  <div 
                    className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 border-t border-slate-800/80 p-4 sm:p-6 bg-slate-950/20' : 'max-h-0 opacity-0 pointer-events-none'}`}
                  >
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Production Final CTA Banner */}
      <section className="py-28 bg-gradient-to-br from-[#003f87] via-[#0b101f] to-slate-950 text-white relative overflow-hidden border-t border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <span className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-6">
            ETAPA DE PRODUCCIÓN ACTIVA
          </span>
          <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight max-w-2xl">
            Lanza tu plataforma al mercado hoy mismo
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mb-12 leading-relaxed">
            Pide en vivo con el sistema de rastreo Pusher activo, o registra tu local de comida local para potenciar tus ingresos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <LinkComponent 
              href="/azul" 
              className="bg-white text-slate-950 text-md py-4 px-8 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
            >
              Pedir Comida Ahora
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </LinkComponent>
            <LinkComponent 
              href="/login" 
              className="bg-transparent border-2 border-white/25 hover:border-white text-white text-md py-4 px-8 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all"
            >
              Consola del Comercio
            </LinkComponent>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-[#070b13] border-t border-slate-900 py-16 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Logo & description */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003f87] flex items-center justify-center text-white">
                <Bike className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white">BlueExpress</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Infraestructura y distribución comercial robusta de alto rendimiento bajo el sistema de diseño Stitch.
            </p>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} BlueExpress Inc. Todos los derechos reservados.
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Servicios</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><LinkComponent href="/azul" className="hover:text-white transition-colors">Pedir Comida</LinkComponent></li>
              <li><LinkComponent href="/descargar" className="hover:text-white transition-colors">Instalar App</LinkComponent></li>
              <li><LinkComponent href="/login" className="hover:text-white transition-colors">Consola Socios</LinkComponent></li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Soporte y Contacto</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">Soporte Técnico</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Términos de Servicio</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacidad de Datos</span></li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}
