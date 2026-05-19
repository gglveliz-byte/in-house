import React from 'react';
import Link from 'next/link';

interface BottomNavBarProps {
  activeTab?: 'home' | 'search' | 'orders' | 'profile';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab = 'home',
}) => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md rounded-t-xl z-50 bg-surface-container-lowest dark:bg-inverse-surface shadow-[0px_-4px_12px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center w-full h-20 px-4 pb-safe">
        <Link 
          href="/azul"
          className={`flex flex-col items-center justify-center rounded-full px-4 py-1 transition-all active:scale-90 ${activeTab === 'home' ? 'bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed' : 'text-secondary dark:text-secondary-fixed-dim hover:opacity-80'}`}
        >
          <span className="material-symbols-outlined mb-1" style={activeTab === 'home' ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
          <span className="font-label-sm text-label-sm">Inicio</span>
        </Link>

        <Link 
          href="/azul/search"
          className={`flex flex-col items-center justify-center rounded-full px-4 py-1 transition-all active:scale-90 ${activeTab === 'search' ? 'bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed' : 'text-secondary dark:text-secondary-fixed-dim hover:opacity-80'}`}
        >
          <span className="material-symbols-outlined mb-1" style={activeTab === 'search' ? { fontVariationSettings: "'FILL' 1" } : {}}>search</span>
          <span className="font-label-sm text-label-sm">Búsqueda</span>
        </Link>

        <Link 
          href="/azul/cart"
          className={`flex flex-col items-center justify-center rounded-full px-4 py-1 transition-all active:scale-90 ${activeTab === 'orders' ? 'bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed' : 'text-secondary dark:text-secondary-fixed-dim hover:opacity-80'}`}
        >
          <span className="material-symbols-outlined mb-1" style={activeTab === 'orders' ? { fontVariationSettings: "'FILL' 1" } : {}}>receipt_long</span>
          <span className="font-label-sm text-label-sm">Mis Pedidos</span>
        </Link>

        <Link 
          href="/azul/profile"
          className={`flex flex-col items-center justify-center rounded-full px-4 py-1 transition-all active:scale-90 ${activeTab === 'profile' ? 'bg-secondary-container dark:bg-on-secondary-fixed-variant text-on-secondary-container dark:text-secondary-fixed' : 'text-secondary dark:text-secondary-fixed-dim hover:opacity-80'}`}
        >
          <span className="material-symbols-outlined mb-1" style={activeTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          <span className="font-label-sm text-label-sm">Perfil</span>
        </Link>
      </div>
    </nav>
  );
};
