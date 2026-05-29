'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function BlueExpressArtisanalLanding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Detectar si la aplicación se ejecuta como PWA instalada (standalone)
    const isStandalone = 
      typeof window !== 'undefined' && (
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as unknown as { standalone?: boolean }).standalone
      )

    if (isStandalone) {
      if (status === 'authenticated' && session?.user?.role) {
        const role = session.user.role
        if (role === 'SUPER_ADMIN') router.replace('/superadmin')
        else if (role === 'ADMIN') router.replace('/admin')
        else if (role === 'VENDOR') router.replace('/vendor')
        else if (role === 'DRIVER') router.replace('/driver/active')
        else router.replace('/azul')
      } else if (status === 'unauthenticated') {
        router.replace('/azul')
      }
      return
    }

    // Comportamiento normal en navegador web (redirigir al panel si ya está logueado)
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role
      if (role === 'SUPER_ADMIN') router.replace('/superadmin')
      else if (role === 'ADMIN') router.replace('/admin')
      else if (role === 'VENDOR') router.replace('/vendor')
      else if (role === 'DRIVER') router.replace('/driver/active')
      else router.replace('/azul')
    }
  }, [session, status, router])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] selection:bg-[#2dbcfe]/30 selection:text-[#004866] font-sans overflow-x-hidden relative">
      
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-[#c3c6d1]/30 backdrop-blur-md ${
        scrolled ? 'bg-[#f7f9fb]/95 shadow-md py-3' : 'bg-[#f7f9fb]/80 py-4'
      }`}>
        <div className="flex justify-between items-center px-6 md:px-16 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-90">
            <span className="material-symbols-outlined text-[#001e40] text-3xl font-fill">motorcycle</span>
            <h1 className="font-sans text-2xl font-extrabold text-[#001e40] tracking-tight">BlueExpress</h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-[#00658d] font-bold border-b-2 border-[#00658d] pb-0.5 text-sm" href="#">Inicio</a>
            <a className="text-[#43474f] hover:text-[#001e40] transition-colors text-sm font-semibold" href="#como-funciona">Cómo Funciona</a>
            <a className="text-[#43474f] hover:text-[#001e40] transition-colors text-sm font-semibold" href="#franquicia">Franquicia</a>
            <Link className="text-[#43474f] hover:text-[#001e40] transition-colors text-sm font-semibold" href="/azul">Restaurantes</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-full border-2 border-[#001e40] text-[#001e40] font-bold text-xs hover:bg-[#001e40]/5 transition-all active:scale-95">
              Ingresar
            </Link>
            <Link href="/login" className="px-5 py-2.5 rounded-full bg-[#003366] text-white font-bold text-xs hover:bg-[#001e40] shadow-md hover:shadow-lg active:scale-95 transition-all">
              Únete
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative flex items-center px-6 md:px-16 py-16 md:py-24 overflow-hidden max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
            <div className="z-10 space-y-6 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-extrabold text-[#001e40] leading-[1.1] tracking-tight">
                Tu comida favorita,<br />
                <span className="text-[#00658d]">en pocos minutos</span>
              </h2>
              <p className="text-lg text-[#43474f] max-w-lg mx-auto md:mx-0 leading-relaxed">
                Logística de última milla diseñada para el sabor. Entregamos tus antojos con la rapidez de nuestras motos y la calidad que esperas.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <Link href="/azul" className="px-8 py-3.5 rounded-xl bg-[#2dbcfe] text-[#004866] font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95">
                  Pedir Comida
                </Link>
                <Link href="/azul" className="px-8 py-3.5 rounded-xl border-2 border-[#001e40] text-[#001e40] font-bold text-sm hover:bg-[#001e40]/5 transition-all active:scale-95">
                  Ver Restaurantes
                </Link>
              </div>
            </div>
            <div className="relative h-[360px] md:h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl mt-8 md:mt-0 border border-[#c3c6d1]/20">
              <img 
                alt="Motorcycle Delivery" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8PA5ZaGj27Vx6EHrF6GyURXXil5NV0eGnUfi1OXsFf6ZN1POwqPrJ60bgNv9ooxKMFE3wTsw465hULAqHxqu88xr4WFelLfgKu_tqURzADyQf283ioCsLVJRM64hYiT5GkxtCVriss6hUjTpmCOyuC9wFBlqEy9dPaNpHQcpiR0cYlbu58c2Gn5JwtBONXVdLkk_puG2Ek_eZRSxBmsOBG93oRznrgZZXxy5GIDtK0ZVQ9KQye92i-T_6W5bS1jwt0d5WLPaAsMwO"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001e40]/30 to-transparent"></div>
            </div>
          </div>
          {/* Abstract background pattern element */}
          <div className="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path className="text-[#00658d]" d="M0,100 C30,80 70,80 100,100 L100,0 L0,0 Z" fill="currentColor"></path>
            </svg>
          </div>
        </section>

        {/* Cómo Funciona Section */}
        <section className="py-20 bg-white" id="como-funciona">
          <div className="max-w-7xl mx-auto px-6 md:px-16">
            <div className="text-center mb-16">
              <span className="text-[#00658d] font-bold text-xs tracking-widest uppercase mb-1 block">Proceso Simple</span>
              <h2 className="text-3xl font-extrabold text-[#001e40]">¿Cómo funciona?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-[#001e40]/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors duration-300 text-[#001e40]">
                  <span className="material-symbols-outlined text-4xl">app_shortcut</span>
                </div>
                <h3 className="text-xl font-bold text-[#001e40] mb-2">1. Pide</h3>
                <p className="text-[#43474f] text-sm leading-relaxed max-w-xs mx-auto">Elige tus platos favoritos o solicita encomiendas y encargos desde nuestra app intuitiva.</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-[#001e40]/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors duration-300 text-[#001e40]">
                  <span className="material-symbols-outlined text-4xl">outdoor_grill</span>
                </div>
                <h3 className="text-xl font-bold text-[#001e40] mb-2">2. Preparamos</h3>
                <p className="text-[#43474f] text-sm leading-relaxed max-w-xs mx-auto">Nuestros restaurantes asociados cocinan o preparamos tu pedido con los mejores estándares.</p>
              </div>
              <div className="text-center group">
                <div className="w-20 h-20 bg-[#001e40]/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors duration-300 text-[#001e40]">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-[#001e40] mb-2">3. Recibe</h3>
                <p className="text-[#43474f] text-sm leading-relaxed max-w-xs mx-auto">Tu pedido llega caliente, fresco o tu paquete llega seguro en el tiempo prometido.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Consumer Benefits */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6 md:px-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-[#f2f4f6]/50 rounded-3xl border border-[#c3c6d1]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-[#c6e7ff] text-[#004c6b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[32px]">bolt</span>
                </div>
                <h3 className="text-xl font-bold text-[#001e40] mb-3">Entrega en minutos</h3>
                <p className="text-sm text-[#43474f] leading-relaxed">Nuestras motos sortean el tráfico para asegurar que tu pedido o encomienda llegue en tiempo récord.</p>
              </div>
              <div className="p-8 bg-[#f2f4f6]/50 rounded-3xl border border-[#c3c6d1]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-[#c6e7ff] text-[#004c6b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[32px]">restaurant</span>
                </div>
                <h3 className="text-xl font-bold text-[#001e40] mb-3">Servicio de Calidad</h3>
                <p className="text-sm text-[#43474f] leading-relaxed">Utilizamos cajas térmicas y de protección de alta tecnología para preservar la frescura e integridad de lo que pidas.</p>
              </div>
              <div className="p-8 bg-[#f2f4f6]/50 rounded-3xl border border-[#c3c6d1]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-[#c6e7ff] text-[#004c6b] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-[32px]">near_me</span>
                </div>
                <h3 className="text-xl font-bold text-[#001e40] mb-3">Rastreo en vivo</h3>
                <p className="text-sm text-[#43474f] leading-relaxed">Sigue a tu repartidor en tiempo real por el mapa en vivo de Google Maps hasta que llegue a tu ubicación exacta.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Franchise Section */}
        <section className="py-20 bg-[#003366] text-white" id="franquicia">
          <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <span className="text-[#2dbcfe] font-bold text-xs tracking-widest uppercase">Emprende con nosotros</span>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">Tu Propia Franquicia</h2>
              <p className="text-white/80 leading-relaxed text-base">Sé dueño de tu propio negocio de delivery y mensajería urbana con el respaldo tecnológico de BlueExpress. Ofrecemos una oportunidad única para emprendedores.</p>
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#2dbcfe] mt-0.5">verified</span>
                  <div>
                    <h4 className="font-bold text-base text-white">Modelo probado</h4>
                    <p className="text-white/60 text-xs mt-0.5">Rentabilidad demostrada con procesos logísticos optimizados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#2dbcfe] mt-0.5">rocket_launch</span>
                  <div>
                    <h4 className="font-bold text-base text-white">Tecnología de punta</h4>
                    <p className="text-white/60 text-xs mt-0.5">Acceso completo a nuestra plataforma web, apps y panel administrativo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#2dbcfe] mt-0.5">support_agent</span>
                  <div>
                    <h4 className="font-bold text-base text-white">Soporte 24/7</h4>
                    <p className="text-white/60 text-xs mt-0.5">Acompañamiento constante y asesoramiento en toda tu operación.</p>
                  </div>
                </div>
              </div>
              <button onClick={() => window.open('https://wa.me/593988856462', '_blank')} className="mt-4 px-8 py-3.5 rounded-xl bg-[#2dbcfe] text-[#004866] font-bold hover:brightness-110 transition-all active:scale-95 shadow-xl cursor-pointer">
                Solicitar Información
              </button>
            </div>
            <div className="relative order-1 md:order-2">
              <div className="aspect-video md:aspect-square bg-white/10 rounded-3xl overflow-hidden shadow-2xl relative border border-white/10">
                <img 
                  alt="Franchise Business" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmwWgXKmpuREmJuAEyKsUskstZjicej8Z9l43EkEbPwt8vlTMzH7p_TF19sku5HJKi-gwxoK3o7Hy7975G2zlMk2ToDZpP2ZlU6brmM_5AHB5vODpb792cFU3UOBCu7Ux4jtVL5RmRAOdRDguXGP92dcS_E33JyZbIyO9_C8PwBHcIu0XTZBmpyCu4Fesu2tHfw9lir19dtsJHG2m1treG56_FrjJrXZD9CVFiWLuuN_UtRj9gB6wJ_KnEYRO6cD1k1tS1Jj0IDk2Y"
                />
                <div className="absolute inset-0 bg-[#001e40]/20 flex items-center justify-center">
                  <span className="px-5 py-2.5 bg-white/95 text-[#001e40] font-extrabold rounded-full text-xs shadow-md">Oportunidad de Negocio</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Driver Recruitment Section */}
        <section className="bg-[#001e40] py-24 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative z-10 border-8 border-[#003366]/50">
                <img 
                  alt="Happy Rider" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMlGuNpoVeE8iS4sWa0HeL9OUgAwd6tBGkU5SWalvvE-FfszXpfPdHGAuWAj_lfILY0dIB6RkvoNspviOc6XO1KBICkDNyu0F1XWg4SaS-P3Gg4AKjPvqNygu9LTyNl66kbcMdffb_IKTfmvp8yg_bUY6ZQMVEKveDYk2ejocvOUkf6rPcivtVHyaHxmZjiQ6v7T6RlOVACPhL74CmvEJgn25gDUQHq4dXOHhz1gg4uY_csmIhBvnhu7YACDUH732OZ-PIaNL6_tA4"
                />
              </div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#2dbcfe]/20 rounded-full blur-3xl"></div>
            </div>
            <div className="text-white space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold">Gana dinero con tu moto</h2>
              <p className="text-[#799dd6] text-base leading-relaxed">Únete a la flota de repartidores de comida y mensajería más eficiente de la ciudad. Genera excelentes ingresos manejando en tus propios tiempos.</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#2dbcfe]">schedule</span>
                  <span className="text-sm font-medium">Horarios 100% flexibles a tu elección</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#2dbcfe]">payments</span>
                  <span className="text-sm font-medium">Pagos puntuales y competitivos</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#2dbcfe]">motorcycle</span>
                  <span className="text-sm font-medium">Soporte y acompañamiento continuo en ruta</span>
                </li>
              </ul>
              <button onClick={() => window.open('https://wa.me/593988856462', '_blank')} className="px-8 py-3.5 rounded-xl bg-[#2dbcfe] text-[#004866] font-bold shadow-xl hover:brightness-110 transition-all active:scale-95 cursor-pointer">
                Únete como repartidor
              </button>
            </div>
          </div>
        </section>

        {/* Testimonios Section */}
        <section className="py-20 bg-[#eceef0]">
          <div className="max-w-7xl mx-auto px-6 md:px-16 text-center">
            <span className="text-[#00658d] font-bold text-xs tracking-widest uppercase mb-1 block">Experiencias Reales</span>
            <h2 className="text-3xl font-extrabold text-[#001e40] mb-16">Lo que dicen nuestros usuarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#c3c6d1]/30 text-left">
                <div className="flex gap-1 text-[#00658d] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined font-fill text-[20px]">star</span>
                  ))}
                </div>
                <p className="text-sm text-[#43474f] mb-6 italic leading-relaxed">&quot;Increíble la rapidez. Pedí una hamburguesa y llegó en menos de 20 minutos, caliente y fresca.&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#eceef0]"></div>
                  <div>
                    <p className="font-bold text-sm text-[#001e40]">Ricardo M.</p>
                    <p className="text-xs text-[#43474f]">Usuario Frecuente</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#c3c6d1]/30 text-left">
                <div className="flex gap-1 text-[#00658d] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined font-fill text-[20px]">star</span>
                  ))}
                </div>
                <p className="text-sm text-[#43474f] mb-6 italic leading-relaxed">&quot;La app es súper fácil de usar y el rastreo en vivo me da mucha tranquilidad. El mejor servicio de logística.&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#eceef0]"></div>
                  <div>
                    <p className="font-bold text-sm text-[#001e40]">Andrea P.</p>
                    <p className="text-xs text-[#43474f]">Restaurante Asociado</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#c3c6d1]/30 text-left">
                <div className="flex gap-1 text-[#00658d] mb-4">
                  {[...Array(4)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined font-fill text-[20px]">star</span>
                  ))}
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </div>
                <p className="text-sm text-[#43474f] mb-6 italic leading-relaxed">&quot;Como repartidor, me encanta la flexibilidad de horarios. Los pagos son semanales y puntuales.&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#eceef0]"></div>
                  <div>
                    <p className="font-bold text-sm text-[#001e40]">Juan S.</p>
                    <p className="text-xs text-[#43474f]">Repartidor Blue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 bg-[#f7f9fb] text-center px-6">
          <div className="max-w-4xl mx-auto">
            <span className="text-[#00658d] font-bold text-xs tracking-widest uppercase mb-1 block">Calidad garantizada</span>
            <h2 className="text-2xl font-extrabold text-[#001e40] mb-12">Los mejores restaurantes de tu zona confían en nosotros</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex justify-center"><span className="text-lg font-black text-[#001e40]">BURGER-X</span></div>
              <div className="flex justify-center"><span className="text-lg font-black text-[#001e40]">PIZZA-PRO</span></div>
              <div className="flex justify-center"><span className="text-lg font-black text-[#001e40]">SUSHI-GO</span></div>
              <div className="flex justify-center"><span className="text-lg font-black text-[#001e40]">TACO-KING</span></div>
            </div>
            <div className="mt-12 p-4 bg-[#f2f4f6] rounded-3xl inline-flex flex-col md:flex-row items-center gap-4 border border-[#c3c6d1]/20">
              <div className="flex -space-x-4">
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#f7f9fb]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnJfoA9BrpHtxHyglcPDliJDSrKv4ihFLtGqe9iLF-DR6AcRaoujTY4B7uLpAAGobgOYthiNvXqZ1Ds_wxHvc2zSn23UkYwubo27IQULe6QZ2c9skCbILiVgC1LoMsgXh1RgNLPVedVMMz_ee8EG9qkcK7oVnU-4o4BqHjm6GiuDM23g43cAsQcRfx3GENnSg4MfXnRD7AA0XzN9AEM9UlTGaAeygqXg9kQn7G6BXetj63IGe_DpeiYOu22Ze4lKNWzpnz2z__-Rqf" />
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#f7f9fb]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAr3NovbSfPwqCWYgyb7aRczphR10Wf6JLHfPQ3sV-vxbE2_G-uTH4YIKpAMqardgCwNgU_o7JUiSGbexNbOuGRoAFL04DofRCmhA4aSsTV4XhIIhN3rAbqJOQzkrKbvMJtff6ph8HhUmUllOgbP4ert-BbQLtScYBee1OjMzOVv6K4szF7h69F0eVbBxCRXQv-VL1QDTjNpz2Sf-ImLsHIkTlha7qwQjxmVvWwB9HBd1ifQBANLPpQN-V3wG1lsCQ52DuSvsT1nxu-" />
                <img alt="User" className="w-10 h-10 rounded-full border-2 border-[#f7f9fb]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBw4mjpoFKDVahsEMEI7YTpDQsyVdR_K19Zglc8aukrXhgZXxbSpQ-zBBkq5HQNEVzty_p_6KbrSYsnbAnrMEEHrgzh-Fg2RilLqpmzT31mIKTnSteM5uJJ6EwN6aw-iscVoe3ToF9u1bioPx2WFOIyZzvsA-PNAXUPtrb6_V4VE7_g123ehgrFTCw9Aqb3Y9B_HOKWluNskA3TrUbNiwXEofvIFPbY93ny4O2AwDeqvG3qXD9R-RZaT9UFn2_5_m5ZTfv-nOy8frbP" />
              </div>
              <p className="font-semibold text-xs text-[#43474f]">Calificación 4.9/5 basada en +50k entregas locales exitosas</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#001e40] text-white w-full pt-16 pb-8 px-6 md:px-16 border-t border-[#c3c6d1]/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4 col-span-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2dbcfe] text-3xl font-fill">motorcycle</span>
              <h2 className="text-xl font-extrabold text-[#2dbcfe] tracking-tight">BlueExpress</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">Revolucionando el delivery y logística urbana con rapidez, seguridad y tecnología avanzada. Tu satisfacción es nuestra prioridad.</p>
            <div className="flex gap-3 pt-2">
              <a className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#2dbcfe] hover:text-[#004866] transition-colors" href="#">
                <span className="material-symbols-outlined text-sm">public</span>
              </a>
              <a className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#2dbcfe] hover:text-[#004866] transition-colors" href="#">
                <span className="material-symbols-outlined text-sm">share</span>
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-[#2dbcfe] uppercase tracking-widest text-xs mb-2">Compañía</h4>
            <nav className="flex flex-col gap-2.5">
              <a className="text-sm text-white/70 hover:text-white transition-colors" href="#">Carreras</a>
              <a className="text-sm text-white/70 hover:text-white transition-colors" href="#como-funciona">Cómo Funciona</a>
              <a className="text-sm text-white/70 hover:text-white transition-colors" href="#franquicia">Franquicias</a>
              <a className="text-sm text-white/70 hover:text-white transition-colors" href="#">Contacto</a>
            </nav>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-[#2dbcfe] uppercase tracking-widest text-xs mb-2">Contáctanos (WhatsApp)</h4>
            <div className="flex flex-col gap-3">
              <a className="flex items-center gap-3 group" href="https://wa.me/593988856462" target="_blank">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <span className="material-symbols-outlined text-green-500 text-sm group-hover:text-white">chat</span>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">+593 98 885 6462</span>
              </a>
              <a className="flex items-center gap-3 group" href="https://wa.me/593997811011" target="_blank">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                  <span className="material-symbols-outlined text-green-500 text-sm group-hover:text-white">chat</span>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">+593 99 781 1011</span>
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-[#2dbcfe] uppercase tracking-widest text-xs mb-2">Legal</h4>
            <nav className="flex flex-col gap-2.5">
              <a className="text-sm text-white/70 hover:text-white transition-colors" href="#">Términos de servicio</a>
              <a className="text-sm text-white/70 hover:text-white transition-colors" href="#">Políticas de privacidad</a>
              <a className="text-sm text-white/70 hover:text-white transition-colors" href="#">Cookies</a>
            </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/60 text-center md:text-left">© 2024 BlueExpress Logistics. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-white/60">
            <span className="material-symbols-outlined text-xs">language</span>
            <span className="text-xs">Español (Latinoamérica)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
