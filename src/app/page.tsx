'use client';

import React, { useState, useEffect } from 'react';
import LinkComponent from 'next/link';
import { 
  Bike, 
  Shield, 
  Clock, 
  Landmark, 
  Smartphone, 
  ChevronDown, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Percent, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Star,
  MapPin,
  UtensilsCrossed,
  DollarSign
} from 'lucide-react';

export default function BlueExpressWorldClassLanding() {
  // Step/Simulator State
  const [activeTab, setActiveTab] = useState<'customer' | 'restaurant' | 'driver'>('customer');
  
  // Earnings Calculator State
  const [partnerType, setPartnerType] = useState<'restaurant' | 'driver'>('restaurant');
  const [ordersPerDay, setOrdersPerDay] = useState(25);
  const [avgTicket, setAvgTicket] = useState(15);
  const [driverDeliveries, setDriverDeliveries] = useState(12);
  const [driverHours, setDriverHours] = useState(6);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Auto-rotating phone screen simulation
  const [phoneScreenState, setPhoneScreenState] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setPhoneScreenState((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Calculate earnings
  const calculateRestaurantProfit = () => {
    // Assumption: 45% margin increase, ticket sales, 30 days
    const totalSales = ordersPerDay * avgTicket * 30;
    const netProfitIncrease = totalSales * 0.35; // Est. 35% margin net profit
    return Math.round(netProfitIncrease).toLocaleString('es-ES');
  };

  const calculateDriverProfit = () => {
    // Assumption: $4.50 average fee per delivery, 30 days
    const totalEarnings = driverDeliveries * 4.5 * 30;
    // Add bonus if deliveries > 10 per day
    const bonus = driverDeliveries > 10 ? 150 : 0;
    return Math.round(totalEarnings + bonus).toLocaleString('es-ES');
  };

  const faqs = [
    {
      q: '¿Cómo funciona el sistema de rastreo en tiempo real?',
      a: 'BlueExpress se integra directamente con Pusher y la geolocalización avanzada de Google Maps. Tan pronto como el conductor acepta la orden, el cliente recibe actualizaciones instantáneas de latitud y longitud, visualizando el trayecto del repartidor sobre el mapa segundo a segundo sin retrasos.'
    },
    {
      q: '¿Qué costos tiene registrar mi restaurante?',
      a: 'El registro inicial en BlueExpress es 100% gratuito. No cobramos tarifas mensuales fijas ni costos de instalación. Solo retenemos una pequeña comisión de éxito por pedido realizado a través de la aplicación. ¡Si tú no vendes, no pagas nada!'
    },
    {
      q: '¿Cuáles son los requisitos para ser repartidor?',
      a: 'Solo necesitas ser mayor de edad, contar con un vehículo propio (motocicleta, bicicleta o automóvil) con sus documentos en regla, y un teléfono inteligente con sistema operativo Android o iOS. Te registras, validamos tus datos en 24 horas y puedes empezar a facturar de inmediato.'
    },
    {
      q: '¿Cómo se garantiza que mi comida llegue caliente?',
      a: 'Contamos con mochilas térmicas selladas de grado profesional diseñadas con aislamiento Stitch de última generación. Además, el algoritmo optimizado de rutas asigna siempre al repartidor más cercano al comercio para minimizar el tiempo de entrega a menos de 20 minutos.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#1c1c1e] flex flex-col font-sans overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* Custom Global Styles for Animations */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header / Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 w-full transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo with Dynamic Accent */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-[#003f87] flex items-center justify-center text-white shadow-[0px_8px_20px_rgba(0,63,135,0.25)] transition-all group-hover:scale-105 group-hover:rotate-3">
              <Bike className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-[#003f87] tracking-tight flex items-center gap-1.5">
                BlueExpress 
                <span className="inline-block bg-[#003f87]/10 text-[#003f87] text-[9px] font-black uppercase px-2 py-0.5 rounded-full">PRO</span>
              </span>
              <span className="text-[10px] text-gray-400 tracking-wider font-bold uppercase">Logística y Delivery E2E</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-gray-500 hover:text-[#003f87] font-semibold text-sm transition-colors">¿Cómo Funciona?</a>
            <a href="#calculator" className="text-gray-500 hover:text-[#003f87] font-semibold text-sm transition-colors">Calculadora Socios</a>
            <a href="#bento-analytics" className="text-gray-500 hover:text-[#003f87] font-semibold text-sm transition-colors">Tecnología</a>
            <a href="#faq" className="text-gray-500 hover:text-[#003f87] font-semibold text-sm transition-colors">Soporte</a>
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center gap-4">
            <LinkComponent 
              href="/login" 
              className="hidden sm:flex text-[#003f87] font-bold text-sm hover:bg-[#003f87]/5 px-4 py-2.5 rounded-full transition-all hover:scale-102"
            >
              Acceso Socios
            </LinkComponent>
            <LinkComponent 
              href="/azul" 
              className="bg-[#003f87] hover:bg-[#003f87]/90 text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-[0px_10px_20px_rgba(0,63,135,0.2)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2"
            >
              Pedir Ahora
              <ArrowRight className="w-4 h-4" />
            </LinkComponent>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-36 bg-gradient-to-b from-[#003f87]/5 via-transparent to-transparent">
        {/* Soft Background Shapes */}
        <div className="absolute top-1/4 left-5 w-96 h-96 bg-[#003f87]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-5 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          
          {/* Hero Left Info */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 bg-[#003f87]/10 text-[#003f87] border border-[#003f87]/10 px-4 py-2 rounded-full text-xs font-black mb-6 uppercase tracking-wider animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              Ecosistema Delivery de Clase Mundial
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-extrabold text-[#1c1c1e] leading-[1.05] tracking-tight mb-8">
              Tu comida favorita <br />
              entregada en <br className="hidden lg:block"/>
              <span className="text-[#003f87] bg-gradient-to-r from-[#003f87] to-blue-500 bg-clip-text text-transparent relative">
                tiempo récord.
                <span className="absolute bottom-1 left-0 w-full h-1.5 bg-[#003f87]/20 rounded-full"></span>
              </span>
            </h1>

            <p className="text-gray-500 text-lg sm:text-xl max-w-xl mb-12 leading-relaxed">
              Disfruta de la mejor plataforma móvil de pedidos a domicilio. Rastreo interactivo con <strong>Pusher</strong>, mapas en vivo, pasarela fluida y entregas seguras en minutos.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
              <LinkComponent 
                href="/azul" 
                className="bg-[#003f87] hover:bg-[#003f87]/95 text-white text-md py-4 px-8 rounded-full font-bold flex items-center justify-center gap-3 shadow-[0px_12px_28px_rgba(0,63,135,0.25)] hover:scale-[1.03] active:scale-95 transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                Explorar Comercios
              </LinkComponent>
              <LinkComponent 
                href="/descargar" 
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-md py-4 px-8 rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all shadow-sm"
              >
                <Smartphone className="w-5 h-5" />
                Instalar Aplicación
              </LinkComponent>
            </div>

            {/* Floating Metric Badges */}
            <div className="grid grid-cols-3 gap-8 sm:gap-12 border-t border-gray-100 pt-8 w-full max-w-lg lg:max-w-none">
              <div>
                <h3 className="text-3xl font-black text-[#003f87]">&lt; 18 min</h3>
                <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Tiempo de Entrega</p>
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#003f87]">0% Fijos</h3>
                <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Costo de Registro</p>
              </div>
              <div>
                <h3 className="text-3xl font-black text-[#003f87]">4.9 ★</h3>
                <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Satisfacción Cliente</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual: The Dynamic Smartphone */}
          <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center relative">
            {/* Dynamic visual backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#003f87]/20 to-blue-300/20 rounded-full blur-3xl opacity-60 scale-95 pointer-events-none"></div>

            {/* Premium Phone Case Mockup */}
            <div className="relative w-80 h-[600px] bg-[#111] rounded-[3.2rem] border-[10px] border-[#222] shadow-[0px_32px_80px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-500 hover:scale-[1.02]">
              {/* Internal Screen */}
              <div className="absolute inset-0 bg-[#f4f5f8] flex flex-col">
                
                {/* Fake Phone Notch */}
                <div className="absolute top-0 inset-x-0 h-7 bg-black z-30 flex justify-center">
                  <div className="w-24 h-4 bg-black rounded-b-xl"></div>
                </div>

                {/* Simulated Screen Body Content */}
                <div className="flex-1 flex flex-col relative pt-7">
                  
                  {/* Screen State 0: Tracking Map */}
                  <div className={`absolute inset-x-0 top-7 bottom-0 bg-white p-4 flex flex-col justify-between transition-all duration-500 ${phoneScreenState === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seguimiento en Vivo</span>
                        <span className="bg-red-500 text-white font-bold text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                          GPS ACTIVO
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-xl p-3 border border-gray-200/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#003f87] text-white flex items-center justify-center shadow-md">
                            <Bike className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-black text-xs text-gray-800">Carlos Mendoza</h5>
                            <p className="text-[9px] text-gray-400">Repartidor asignado</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dummy Map Area */}
                    <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-2xl my-4 relative overflow-hidden flex items-center justify-center p-4">
                      {/* Grid representation */}
                      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-30">
                        <div className="border-r border-b border-blue-200"></div>
                        <div className="border-r border-b border-blue-200"></div>
                        <div className="border-r border-b border-blue-200"></div>
                        <div className="border-b border-blue-200"></div>
                      </div>
                      {/* Driver Path */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                        <path d="M 30,170 Q 100,100 170,30" fill="none" stroke="#003f87" strokeWidth="3" strokeDasharray="6 3" />
                      </svg>
                      {/* Map Pins */}
                      <div className="absolute bottom-6 left-6 bg-[#003f87] text-white p-1 rounded-full shadow-md">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute top-6 right-6 bg-green-500 text-white p-1.5 rounded-full shadow-md animate-bounce">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 py-1.5 px-3 rounded-full text-[9px] font-black text-gray-800 shadow-lg absolute bottom-4 right-4">
                        Distancia: 1.2 Km
                      </div>
                    </div>

                    {/* Bottom Screen Summary */}
                    <div className="bg-[#003f87] text-white p-3 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold">Estado de tu Orden</span>
                        <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">12-15 min</span>
                      </div>
                      <p className="font-black text-xs mt-1">El conductor recogió tu pedido</p>
                    </div>
                  </div>

                  {/* Screen State 1: Shop Menu */}
                  <div className={`absolute inset-x-0 top-7 bottom-0 bg-white p-4 flex flex-col transition-all duration-500 ${phoneScreenState === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[9px] font-bold text-[#003f87] uppercase tracking-widest">Restaurantes Aliados</span>
                        <h4 className="font-extrabold text-sm text-gray-800">BlueExpress Food</h4>
                      </div>
                      <div className="bg-gray-100 p-1.5 rounded-full">
                        <Sparkles className="w-3.5 h-3.5 text-[#003f87]" />
                      </div>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                      {/* Restaurant Card 1 */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex gap-3 hover:border-gray-200 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-[#003f87]/5 flex items-center justify-center text-[#003f87] font-black text-lg">🍔</div>
                        <div className="flex-1">
                          <h5 className="font-black text-xs text-gray-800">Gourmet Burger &amp; Co</h5>
                          <p className="text-[9px] text-gray-400">Hamburguesas Premium a la parrilla</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-[#003f87]/10 text-[#003f87] font-bold text-[8px] px-2 py-0.5 rounded-full">20-25 min</span>
                            <span className="text-[8px] font-bold text-yellow-500">★ 4.9</span>
                          </div>
                        </div>
                      </div>

                      {/* Restaurant Card 2 */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex gap-3 hover:border-gray-200 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500 font-black text-lg">🍕</div>
                        <div className="flex-1">
                          <h5 className="font-black text-xs text-gray-800">La Nonna Pizzería</h5>
                          <p className="text-[9px] text-gray-400">Pizzas napolitanas al horno</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-[#003f87]/10 text-[#003f87] font-bold text-[8px] px-2 py-0.5 rounded-full">Envío Gratis</span>
                            <span className="text-[8px] font-bold text-yellow-500">★ 4.8</span>
                          </div>
                        </div>
                      </div>

                      {/* Restaurant Card 3 */}
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex gap-3 hover:border-gray-200 transition-all">
                        <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-500 font-black text-lg">🍣</div>
                        <div className="flex-1">
                          <h5 className="font-black text-xs text-gray-800">Sushiko Bar</h5>
                          <p className="text-[9px] text-gray-400">Rolls y sushi tradicional premium</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-[#003f87]/10 text-[#003f87] font-bold text-[8px] px-2 py-0.5 rounded-full">15-20 min</span>
                            <span className="text-[8px] font-bold text-yellow-500">★ 4.9</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Screen State 2: Driver Portal */}
                  <div className={`absolute inset-x-0 top-7 bottom-0 bg-slate-900 p-4 flex flex-col justify-between text-white transition-all duration-500 ${phoneScreenState === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Portal del Repartidor</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <h4 className="font-black text-md">Ganancias de Hoy</h4>
                      <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">$48.50</h3>
                      <p className="text-[9px] text-slate-400">12 entregas realizadas con éxito</p>
                    </div>

                    {/* Interactive Order Card */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase">Nueva Oferta</span>
                          <h5 className="font-bold text-xs mt-1.5">Recoger en Burger Palace</h5>
                        </div>
                        <span className="text-xs font-black text-emerald-400">+$6.80</span>
                      </div>
                      <div className="text-[9px] text-slate-400 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>Origen: Av. Central 405</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                          <span>Destino: Condominio Los Alerces</span>
                        </div>
                      </div>
                      <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-colors">
                        Aceptar Pedido
                      </button>
                    </div>
                  </div>

                </div>

                {/* Fake Phone Home Button Indicator */}
                <div className="h-4 bg-white flex items-center justify-center z-30">
                  <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
                </div>

              </div>
            </div>

            {/* Floating absolute element: Secure Deliveries */}
            <div className="absolute top-1/4 right-0 lg:-right-6 bg-white/95 backdrop-blur-sm border border-gray-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-float max-w-[180px]">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-extrabold text-xs text-gray-800">Seguridad Total</h5>
                <p className="text-[9px] text-gray-400">Entregas 100% protegidas y monitoreadas.</p>
              </div>
            </div>

            {/* Floating absolute element 2: Speed Badge */}
            <div className="absolute bottom-1/4 left-0 lg:-left-6 bg-white/95 backdrop-blur-sm border border-gray-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-float max-w-[180px]" style={{ animationDelay: '1.5s' }}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-extrabold text-xs text-gray-800">Entregas Express</h5>
                <p className="text-[9px] text-gray-400">Menos de 20 minutos de espera promedio.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Simulator E2E Section */}
      <section id="how-it-works" className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#003f87] text-xs font-extrabold uppercase tracking-widest">FLUJO DE PROCESOS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mt-2">¿Cómo funciona la red de BlueExpress?</h2>
            <p className="text-gray-500 mt-4">Nuestro ecosistema unifica a clientes, tiendas y repartidores bajo una sola infraestructura integrada en tiempo real.</p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button 
              onClick={() => setActiveTab('customer')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'customer' ? 'bg-[#003f87] text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              👩‍💻 Cliente
            </button>
            <button 
              onClick={() => setActiveTab('restaurant')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'restaurant' ? 'bg-[#003f87] text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              🏪 Tienda / Comercio
            </button>
            <button 
              onClick={() => setActiveTab('driver')}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'driver' ? 'bg-[#003f87] text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              🏍️ Repartidor
            </button>
          </div>

          {/* Content Wrapper with Animated Switch */}
          <div className="bg-gray-50 rounded-3xl border border-gray-100 p-8 md:p-12 flex flex-col lg:flex-row items-center gap-12 min-h-[400px]">
            
            {/* Left: Tab Text Info */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              {activeTab === 'customer' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="w-12 h-12 rounded-xl bg-[#003f87]/10 text-[#003f87] flex items-center justify-center mx-auto lg:mx-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Pide comida sin complicaciones</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Entra a la aplicación intuitiva de BlueExpress desde tu móvil. Explora cientos de comercios locales, selecciona tus platos favoritos y completa tu pago de forma segura y transparente.
                  </p>
                  <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Búsqueda inteligente por categorías
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Pasarela de pago rápida y segura
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Registro persistente de última orden
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === 'restaurant' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto lg:mx-0">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Gestiona tu tienda y ventas</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Accede a tu panel administrativo integrado de vendedor. Recibe comandas digitales de inmediato, administra el inventario, gestiona promociones y notifica a los repartidores tan pronto el plato esté listo.
                  </p>
                  <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Bento Dashboard analítico de ventas
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Alertas visuales de nuevos pedidos
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Control total de productos e inventario
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === 'driver' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto lg:mx-0">
                    <Bike className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Conduce y maximiza ingresos</h3>
                  <p className="text-gray-500 leading-relaxed">
                    Navega a través de la aplicación móvil de conductor. Recibe notificaciones automáticas inmediatas sobre pedidos listos en restaurantes cercanos, calcula rutas óptimas de Google Maps y realiza entregas seguras cobrando tarifas de éxito competitivas.
                  </p>
                  <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Asignación inteligente por proximidad GPS
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Historial de ganancias transparente
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> Rutas óptimas para evitar atascos de tráfico
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Beautiful Visual Graphic Representation */}
            <div className="flex-1 w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-h-[300px]">
              {activeTab === 'customer' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <span className="text-[10px] font-black text-[#003f87] uppercase tracking-wider block">Panel del Cliente</span>
                  <div className="h-32 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                    <span className="text-gray-400 text-sm">Explorador de Platos en Vivo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#003f87]/5 border border-[#003f87]/15 rounded-xl p-3 text-center">
                      <span className="text-xl">💳</span>
                      <h4 className="font-bold text-xs mt-1 text-gray-800">Checkout Fácil</h4>
                    </div>
                    <div className="bg-[#003f87]/5 border border-[#003f87]/15 rounded-xl p-3 text-center">
                      <span className="text-xl">📍</span>
                      <h4 className="font-bold text-xs mt-1 text-gray-800">GPS Monitoreado</h4>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'restaurant' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider block">Consola del Comercio</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 text-center">
                      <span className="font-black text-xs text-orange-600 block">5</span>
                      <span className="text-[8px] text-gray-400">Recibidos</span>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 text-center">
                      <span className="font-black text-xs text-orange-600 block">3</span>
                      <span className="text-[8px] text-gray-400">Preparación</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 text-center">
                      <span className="font-black text-xs text-emerald-600 block">12</span>
                      <span className="text-[8px] text-gray-400">Enviados</span>
                    </div>
                  </div>
                  <div className="h-24 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                    <span className="text-gray-400 text-xs">Gestión Digital de Menú</span>
                  </div>
                </div>
              )}

              {activeTab === 'driver' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-wider block">Consola del Conductor</span>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="text-xs font-bold text-gray-700">Tarifas acumuladas</span>
                    </div>
                    <span className="text-xs font-black text-green-600">$185.00</span>
                  </div>
                  <div className="h-28 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                    <span className="text-gray-400 text-xs">Algoritmo de Rutas Dinámicas</span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* Dynamic Partner Earnings Calculator */}
      <section id="calculator" className="py-24 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#003f87] text-xs font-extrabold uppercase tracking-widest">CENTRO FINANCIERO</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mt-2">Calcula tus ganancias con BlueExpress</h2>
            <p className="text-gray-500 mt-4">Simula tus beneficios mensuales netos estimados ajustando los parámetros interactivos de rendimiento.</p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 flex flex-col md:flex-row gap-12">
            {/* Left side: Controls */}
            <div className="flex-1 space-y-8">
              {/* Select Partner Role */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-3">¿Cuál es tu rol?</label>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <button 
                    onClick={() => setPartnerType('restaurant')}
                    className={`py-3.5 rounded-lg font-bold text-xs uppercase transition-all ${partnerType === 'restaurant' ? 'bg-white text-[#003f87] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    🏪 Soy Tienda / Local
                  </button>
                  <button 
                    onClick={() => setPartnerType('driver')}
                    className={`py-3.5 rounded-lg font-bold text-xs uppercase transition-all ${partnerType === 'driver' ? 'bg-white text-[#003f87] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    🏍️ Soy Repartidor
                  </button>
                </div>
              </div>

              {/* Dynamic sliders according to selected partner role */}
              {partnerType === 'restaurant' ? (
                <div className="space-y-6">
                  {/* Slider 1: Orders per day */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-600">Pedidos Diarios Estimados</span>
                      <span className="text-[#003f87] text-sm font-black">{ordersPerDay} órdenes</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      value={ordersPerDay}
                      onChange={(e) => setOrdersPerDay(Number(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#003f87]"
                    />
                  </div>

                  {/* Slider 2: Average Ticket */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-600">Ticket Promedio por Pedido</span>
                      <span className="text-[#003f87] text-sm font-black">${avgTicket} USD</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      value={avgTicket}
                      onChange={(e) => setAvgTicket(Number(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#003f87]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Slider 1: Deliveries per day */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-600">Entregas Diarias Completadas</span>
                      <span className="text-[#003f87] text-sm font-black">{driverDeliveries} entregas</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="30" 
                      value={driverDeliveries}
                      onChange={(e) => setDriverDeliveries(Number(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#003f87]"
                    />
                  </div>

                  {/* Slider 2: Work Hours */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-600">Horas de Conexión Estimadas</span>
                      <span className="text-[#003f87] text-sm font-black">{driverHours} horas</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="12" 
                      value={driverHours}
                      onChange={(e) => setDriverHours(Number(e.target.value))}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#003f87]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Calculated Results */}
            <div className="w-full md:w-[320px] bg-gradient-to-br from-[#003f87] to-blue-900 text-white rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-black tracking-widest text-blue-300 uppercase block">Ingreso Neto Estimado</span>
                <p className="text-[11px] text-white/70">Calculado a 30 días de actividad activa.</p>
              </div>

              <div className="my-8">
                <span className="text-5xl font-black text-emerald-400 tracking-tight block">
                  ${partnerType === 'restaurant' ? calculateRestaurantProfit() : calculateDriverProfit()}
                  <span className="text-lg font-bold text-white/80 ml-1">USD</span>
                </span>
                <span className="text-xs text-white/50 block mt-2">Valores simulados bajo comisiones estándar.</span>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sin costos mensuales de mantenimiento</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Soporte comercial dedicado 24/7</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="bento-analytics" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[#003f87] text-xs font-extrabold uppercase tracking-widest">ARQUITECTURA DE SOFTWARE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mt-2">Tecnología robusta de clase mundial</h2>
            <p className="text-gray-500 mt-4">Nuestra plataforma cuenta con una arquitectura de backend optimizada para alta concurrencia.</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: Real-Time Channels */}
            <div className="md:col-span-2 bg-[#f8fafc] border border-gray-200/50 rounded-3xl p-8 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="max-w-md">
                <div className="w-12 h-12 rounded-xl bg-[#003f87]/5 text-[#003f87] flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-3">Conexión a tiempo real vía Pusher</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Evita la recarga constante de páginas. El sistema de órdenes cuenta con sockets web integrados que actualizan el mapa, la comanda y el panel administrativo instantáneamente en cuanto hay un cambio.
                </p>
              </div>
              <div className="mt-8 flex gap-3">
                <span className="bg-[#003f87]/10 text-[#003f87] text-[10px] font-black uppercase px-3 py-1 rounded-full">Websockets</span>
                <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-3 py-1 rounded-full">Latencia &lt; 80ms</span>
              </div>
            </div>

            {/* Box 2: Geolocation */}
            <div className="bg-[#f8fafc] border border-gray-200/50 rounded-3xl p-8 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/5 text-orange-500 flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-3">Geolocalización</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Integración robusta con la API de Google Maps con una capa de fallback de coordenadas manual para garantizar continuidad del servicio.
                </p>
              </div>
              <span className="text-[10px] text-gray-400 mt-6 block">Resiliencia del mapa garantizada.</span>
            </div>

            {/* Box 3: Database Security */}
            <div className="bg-[#f8fafc] border border-gray-200/50 rounded-3xl p-8 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/5 text-emerald-500 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-3">Seguridad Integral</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Toda la información y contraseñas sensibles se encriptan bajo estándares militares bcryptjs, con base de datos PostgreSQL persistente de alta tolerancia a fallas.
                </p>
              </div>
              <span className="text-[10px] text-gray-400 mt-6 block">Encriptación robusta E2E.</span>
            </div>

            {/* Box 4: PWA Lightweight Mobile */}
            <div className="md:col-span-2 bg-[#f8fafc] border border-gray-200/50 rounded-3xl p-8 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="max-w-md">
                <div className="w-12 h-12 rounded-xl bg-blue-500/5 text-blue-500 flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-3">Instalación PWA ultraligera</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Evita descargas pesadas en la Play Store. Tus clientes y socios comerciales pueden "instalar" la aplicación al instante desde el navegador con un peso total menor a 5MB, guardando estado persistente del carrito.
                </p>
              </div>
              <div className="mt-8 flex gap-3">
                <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase px-3 py-1 rounded-full">Cero Play Store</span>
                <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-3 py-1 rounded-full">Actualizaciones Automáticas</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* World-Class Testimonials */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[#003f87] text-xs font-extrabold uppercase tracking-widest">OPINIONES VERIFICADAS</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mt-2">Historias de éxito de nuestra comunidad</h2>
            <p className="text-gray-500 mt-4">Miles de restaurantes, repartidores y comensales confían en BlueExpress a diario.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Testimonial 1 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-500" />)}
                </div>
                <p className="text-gray-500 italic text-sm leading-relaxed">
                  "El panel de control comercial de BlueExpress cambió las ventas de mi pizzería. Agregamos nuevos ingredientes de inmediato, realizamos campañas de ofertas activas los fines de semana y las órdenes nos llegan impresas al instante en comandas. ¡Las ventas han subido un 40%!"
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">MA</div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-800">Mario Altieri</h4>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Dueño de La Nonna Pizza</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-500" />)}
                </div>
                <p className="text-gray-500 italic text-sm leading-relaxed">
                  "Me encanta el hecho de que puedo conectarme y desconectarme cuando yo quiera. La interfaz de repartidor tiene un mapa súper nítido y la asignación inteligente de pedidos me permite ahorrar combustible asignándome rutas lógicas en mi vecindario."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600">JC</div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-800">Juan Carlos P.</h4>
                  <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Repartidor BlueExpress</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative flex flex-col justify-between">
              <div>
                <div className="flex gap-1 text-yellow-500 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-500" />)}
                </div>
                <p className="text-gray-500 italic text-sm leading-relaxed">
                  "El mapa de seguimiento en vivo es espectacular. Puedo ver a mi conductor avanzar sobre la avenida mientras pongo la mesa. La comida llega caliente y no tengo que estar bajando aplicaciones pesadas en mi teléfono porque la instalé desde la web."
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">SM</div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-800">Sofía Mendoza</h4>
                  <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Comensal Habitual</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[#003f87] text-xs font-extrabold uppercase tracking-widest">PREGUNTAS FRECUENTES</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mt-2">Dudas y Preguntas Frecuentes</h2>
            <p className="text-gray-500 mt-4">Todo lo que necesitas saber acerca del funcionamiento de la plataforma en un solo lugar.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex justify-between items-center font-bold text-gray-800 text-sm sm:text-base gap-4 hover:bg-gray-100/50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-[#003f87] shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#003f87]' : ''}`} />
                  </button>
                  
                  {/* Dynamic Slide Transition */}
                  <div 
                    className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 border-t border-gray-100/70 p-6 bg-white' : 'max-h-0 opacity-0 pointer-events-none'}`}
                  >
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* World-Class Final CTA */}
      <section className="py-24 bg-gradient-to-br from-[#003f87] via-[#003f87] to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          <span className="bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-6">
            Únete a la Revolución Logística
          </span>
          <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight max-w-2xl">
            Lleva la eficiencia de tus despachos al siguiente nivel
          </h2>
          <p className="text-white/80 text-lg max-w-xl mb-12 leading-relaxed">
            Empieza a pedir de inmediato tus platos favoritos en minutos o registra tu local de forma 100% gratuita para potenciar tus ventas a domicilio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <LinkComponent 
              href="/azul" 
              className="bg-white text-[#003f87] text-md py-4 px-8 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
            >
              Pedir Comida Ahora
              <ArrowRight className="w-4 h-4" />
            </LinkComponent>
            <LinkComponent 
              href="/login" 
              className="bg-transparent border-2 border-white/30 hover:border-white text-white text-md py-4 px-8 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-95 transition-all"
            >
              Registrar mi Tienda
            </LinkComponent>
          </div>
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Column 1: Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003f87] flex items-center justify-center text-white">
                <Bike className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-[#003f87]">BlueExpress</span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              La plataforma de distribución comercial definitiva que une a comensales, conductores y locales comerciales bajo un mismo sistema tecnológico unificado.
            </p>
            <div className="text-xs text-gray-300">
              © {new Date().getFullYear()} BlueExpress Inc. Todos los derechos reservados.
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-black text-gray-800 text-xs uppercase tracking-wider mb-4">Servicios</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><LinkComponent href="/azul" className="hover:text-[#003f87] transition-colors">Pedir Comida</LinkComponent></li>
              <li><LinkComponent href="/descargar" className="hover:text-[#003f87] transition-colors">Instalar App Móvil</LinkComponent></li>
              <li><LinkComponent href="/login" className="hover:text-[#003f87] transition-colors">Consola Vendedor</LinkComponent></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="font-black text-gray-800 text-xs uppercase tracking-wider mb-4">Ayuda e Integridad</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><span className="hover:text-[#003f87] transition-colors cursor-pointer">Soporte Técnico</span></li>
              <li><span className="hover:text-[#003f87] transition-colors cursor-pointer">Términos del Servicio</span></li>
              <li><span className="hover:text-[#003f87] transition-colors cursor-pointer">Políticas de Privacidad</span></li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}
