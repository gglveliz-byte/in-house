'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems = [
    { href: '/driver/active', icon: 'shopping_bag', label: 'Pedidos' },
    { href: '/driver/history', icon: 'history', label: 'Historial' },
    { href: '/driver', icon: 'person', label: 'Perfil' },
  ]

  return (
    <div className="font-body-md text-body-md bg-background min-h-screen text-on-surface">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline sticky top-0 z-50">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-base">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden text-primary font-bold">
              {session?.user?.name?.charAt(0).toUpperCase() || 'R'}
            </div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed-dim">Azul Entrega</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-label-md text-label-md text-primary dark:text-primary-fixed-dim">Disponible</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="ml-2 text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error-container"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-container-max mx-auto pb-24">
        {children}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-base bg-surface dark:bg-surface-dim border-t border-outline-variant dark:border-outline shadow-sm z-50">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-4 py-1 rounded-full transition-all active:scale-90 duration-150 ${
                isActive
                  ? 'bg-secondary-container dark:bg-secondary-fixed-dim text-on-secondary-container dark:text-on-secondary-fixed-variant scale-95'
                  : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
