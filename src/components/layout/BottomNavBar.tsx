import React from 'react';
import Link from 'next/link';

interface BottomNavBarProps {
  activeTab?: 'home' | 'search' | 'orders' | 'profile';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab = 'home',
}) => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md rounded-t-2xl z-50 bg-white border-t border-gray-100 shadow-[0px_-8px_24px_rgba(0,0,0,0.04)]"
      style={{
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) - 6px)',
      }}
    >
      <div className="flex justify-around items-center w-full h-16 px-4">
        <Link 
          href="/azul"
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-1.5 transition-all duration-200 active:scale-95 ${
            activeTab === 'home' 
              ? 'bg-blue-50 text-primary font-bold shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5" style={activeTab === 'home' ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
          <span className="text-[10px] tracking-wide">Inicio</span>
        </Link>

        <Link 
          href="/azul/search"
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-1.5 transition-all duration-200 active:scale-95 ${
            activeTab === 'search' 
              ? 'bg-blue-50 text-primary font-bold shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5" style={activeTab === 'search' ? { fontVariationSettings: "'FILL' 1" } : {}}>search</span>
          <span className="text-[10px] tracking-wide">Búsqueda</span>
        </Link>

        <Link 
          href="/azul/cart"
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-1.5 transition-all duration-200 active:scale-95 ${
            activeTab === 'orders' 
              ? 'bg-blue-50 text-primary font-bold shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5" style={activeTab === 'orders' ? { fontVariationSettings: "'FILL' 1" } : {}}>receipt_long</span>
          <span className="text-[10px] tracking-wide">Mis Pedidos</span>
        </Link>

        <Link 
          href="/azul/profile"
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-1.5 transition-all duration-200 active:scale-95 ${
            activeTab === 'profile' 
              ? 'bg-blue-50 text-primary font-bold shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-[22px] mb-0.5" style={activeTab === 'profile' ? { fontVariationSettings: "'FILL' 1" } : {}}>person</span>
          <span className="text-[10px] tracking-wide">Perfil</span>
        </Link>
      </div>
    </nav>
  );
};
