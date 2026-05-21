'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const navItems = [
    { href: '/vendor', icon: 'dashboard', label: 'Panel' },
    { href: '/vendor/orders', icon: 'package_2', label: 'Pedidos' },
    { href: '/vendor/products', icon: 'inventory_2', label: 'Inventario' },
    { href: '/vendor/settings', icon: 'settings', label: 'Configuración' },
  ]

  return (
    <div className="font-body-md text-body-md bg-background min-h-screen text-on-surface">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-inverse-surface border-b border-outline-variant dark:border-outline fixed full-width top-0 z-40 flex justify-between items-center w-full px-margin-desktop h-16">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="material-symbols-outlined text-primary dark:text-inverse-primary hover:bg-surface-container-high transition-colors p-2 rounded-full md:hidden">
            menu
          </button>
          <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim">BlueExpress</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-6 items-center">
            <span className="text-primary font-bold font-label-md text-label-md cursor-pointer">Panel de Control</span>
            <span className="text-on-surface-variant font-label-md text-label-md cursor-pointer hover:text-primary" onClick={() => signOut({ callbackUrl: '/login' })}>Cerrar Sesión</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container flex items-center justify-center bg-primary-fixed text-primary font-bold overflow-hidden">
            {session?.user?.name?.charAt(0).toUpperCase() || 'V'}
          </div>
        </div>
      </header>

      <div className="pt-16">
        {/* NavigationDrawer (Desktop & Mobile) */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-surface dark:bg-inverse-surface border-r border-outline-variant dark:border-outline z-50 flex flex-col p-4 gap-2 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="flex flex-col gap-1 mb-6 p-2">
            <div className="w-12 h-12 rounded-lg mb-2 bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-primary">BlueExpress Vendedor</h2>
            <p className="text-body-sm text-secondary">Gestiona tu tienda</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all active:scale-95 ${isActive ? 'bg-secondary-fixed text-on-secondary-fixed font-bold' : 'text-secondary hover:bg-surface-container-high'}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          
          <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4">
            <Link
              href="/azul"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg text-secondary hover:bg-surface-container-high transition-all active:scale-95 font-medium"
            >
              <span className="material-symbols-outlined">home</span>
              <span>Ir a la Tienda</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 p-3 rounded-lg text-error hover:bg-error-container/30 transition-all active:scale-95 font-bold w-full text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
            <div className="p-2">
              <span className="text-label-md font-label-md text-outline">v2.1.0</span>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden mt-16" onClick={toggleSidebar}></div>
        )}

        {/* Main Content */}
        <main className="md:ml-64 p-margin-mobile md:p-margin-desktop mb-20 md:mb-0 bg-background min-h-[calc(100vh-4rem)] overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* BottomNavBar (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface dark:bg-inverse-surface border-t border-outline-variant dark:border-outline shadow-lg rounded-t-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors active:scale-90 duration-150 ${isActive ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-1' : 'text-on-surface-variant active:bg-surface-container-highest'}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-md text-[10px] mt-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
