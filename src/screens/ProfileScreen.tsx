import React from 'react';
import { BottomNavBar } from '@/components/layout/BottomNavBar';

export const ProfileScreen: React.FC = () => {
  return (
    <div className="bg-background min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-surface-dim fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-between px-margin-mobile h-16">
        <button className="active:scale-95 transition-transform text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">location_on</span>
        </button>
        <div className="font-headline-sm text-headline-sm-mobile text-primary dark:text-primary-fixed-dim text-center flex-1">
          <span className="font-bold">Perfil de Usuario</span>
        </div>
        <button className="active:scale-95 transition-transform text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-margin-mobile max-w-md mx-auto space-y-stack-lg">
        {/* Profile Header */}
        <section className="flex flex-col items-center justify-center py-stack-lg">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)] bg-surface-container-high">
            <img alt="Profile Picture" className="w-full h-full object-cover" data-alt="A professional headshot of a modern corporate professional. The portrait is taken against a clean, bright background, adhering to a light-mode aesthetic. The lighting is soft and flattering, highlighting a friendly yet reliable expression. The color palette emphasizes corporate blues and pristine whites, conveying trust and efficiency suitable for a high-velocity mobile commerce application." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnHXAHVqjVCKI4AqCrd4tLOahEJ7K6v5VzAqiUIMlaTS8vDxTj0nx-oRizOx2us6MnKwaQukEgyrIiRJWAVY_sORn8KSJIV4UUuo-Nt34bcom6sRSIp2qHn547chqSV1oPXG60AS_CQKckJXCdYynvTtGPMxBerVpQllLjUlejTTOv1PfmqpOc_Zi3J16kQOYauitoSb7dj8RdK9lgaN57UKpF8ryLoboYfFlpnEmB0WH8W-Ol59snMm7auGXQekVp8Uvm3jcgVE8" />
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-stack-sm">Juan Pérez</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">juan.perez@email.com</p>
        </section>

        {/* Options List */}
        <section className="space-y-stack-md">
          <div className="bg-surface rounded-lg shadow-[0px_4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            <a className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors border-b border-surface-container-highest" href="#">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary text-[24px]">person</span>
                <span className="font-body-lg text-body-lg text-on-surface">Mis Datos</span>
              </div>
              <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
            </a>
            <a className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors border-b border-surface-container-highest" href="#">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
                <span className="font-body-lg text-body-lg text-on-surface">Direcciones Guardadas</span>
              </div>
              <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
            </a>
            <a className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors border-b border-surface-container-highest" href="#">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary text-[24px]">sell</span>
                <span className="font-body-lg text-body-lg text-on-surface">Cupones</span>
              </div>
              <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
            </a>
            <a className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors border-b border-surface-container-highest" href="#">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary text-[24px]">help</span>
                <span className="font-body-lg text-body-lg text-on-surface">Ayuda</span>
              </div>
              <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
            </a>
            <a className="flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors" href="#">
              <div className="flex items-center space-x-4">
                <span className="material-symbols-outlined text-primary text-[24px]">settings</span>
                <span className="font-body-lg text-body-lg text-on-surface">Configuración</span>
              </div>
              <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
            </a>
          </div>
        </section>

        {/* Logout Action */}
        <section className="pt-stack-md">
          <button className="w-full bg-error-container text-on-error-container font-headline-sm text-headline-sm py-4 rounded-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform">
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </section>
      </main>

      <BottomNavBar activeTab="profile" />
    </div>
  );
};
