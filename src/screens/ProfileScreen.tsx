'use client';
import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { BottomNavBar } from '@/components/layout/BottomNavBar';


export const ProfileScreen: React.FC = () => {
  const { data: session } = useSession();

  // Navigation State
  const [activeSection, setActiveSection] = useState<'menu' | 'datos' | 'direcciones' | 'cupones' | 'ayuda' | 'config'>('menu');

  // Form State - Load from LocalStorage if exists
  const [name, setName] = useState('Juan Pérez');
  const [email, setEmail] = useState('juan.perez@email.com');
  const [phone, setPhone] = useState('+593 99 999 9999');

  // Address State
  const [addresses, setAddresses] = useState<string[]>([
    'Av. Amazonas y Eloy Alfaro, Edificio In-House',
    'Calle Larga y Benigno Malo, Cuenca'
  ]);
  const [newAddress, setNewAddress] = useState('');

  // Configuration Switches
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);

  // Success message toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage on mount & synchronize session details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('profile_name');
      const savedEmail = localStorage.getItem('profile_email');
      const savedPhone = localStorage.getItem('profile_phone');
      const savedAddresses = localStorage.getItem('profile_addresses');
      const savedNotifications = localStorage.getItem('profile_notifications');
      const savedDarkMode = localStorage.getItem('profile_darkmode');
      const savedLocation = localStorage.getItem('profile_locationsharing');

      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      if (savedPhone) setPhone(savedPhone);
      if (savedAddresses) {
        try {
          setAddresses(JSON.parse(savedAddresses));
        } catch (e) {
          console.error(e);
        }
      }
      if (savedNotifications) setNotifications(savedNotifications === 'true');
      if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
      if (savedLocation) setLocationSharing(savedLocation === 'true');
    }
  }, []);

  // Sync session details when session becomes available
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setName(session.user.name);
      if (session.user.email) setEmail(session.user.email);
      if (session.user.phone) setPhone(session.user.phone);
    }
  }, [session]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Handlers
  const handleSaveDatos = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('profile_name', name);
    localStorage.setItem('profile_email', email);
    localStorage.setItem('profile_phone', phone);
    triggerToast('¡Datos personales actualizados con éxito!');
    setActiveSection('menu');
  };

  const handleAddAddress = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newAddress.trim()) return;
    const updated = [...addresses, newAddress.trim()];
    setAddresses(updated);
    localStorage.setItem('profile_addresses', JSON.stringify(updated));
    setNewAddress('');
    triggerToast('Nueva dirección agregada.');
  };

  const handleDeleteAddress = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
    localStorage.setItem('profile_addresses', JSON.stringify(updated));
    triggerToast('Dirección eliminada.');
  };

  const handleToggleNotification = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('profile_notifications', String(next));
  };

  const handleToggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('profile_darkmode', String(next));
    // Dynamic theme adjustment for demo
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    triggerToast(next ? 'Modo oscuro activado.' : 'Modo claro activado.');
  };

  const handleToggleLocation = () => {
    const next = !locationSharing;
    setLocationSharing(next);
    localStorage.setItem('profile_locationsharing', String(next));
  };

  const handleLogout = async () => {
    triggerToast('Cerrando sesión...');
    await signOut({ callbackUrl: '/login' });
  };

  // Dynamic Dashboard variables
  const showDashboardButton = session?.user?.role && ['SUPER_ADMIN', 'ADMIN', 'VENDOR', 'DRIVER'].includes(session.user.role);

  const getDashboardLink = () => {
    switch (session?.user?.role) {
      case 'SUPER_ADMIN': return '/superadmin';
      case 'ADMIN': return '/admin';
      case 'VENDOR': return '/vendor';
      case 'DRIVER': return '/driver/active';
      default: return '#';
    }
  };

  const getDashboardLabel = () => {
    switch (session?.user?.role) {
      case 'SUPER_ADMIN': return 'Panel SuperAdmin';
      case 'ADMIN': return 'Panel Administrador';
      case 'VENDOR': return 'Panel de Vendedor';
      case 'DRIVER': return 'Panel de Repartidor';
      default: return 'Mi Panel de Control';
    }
  };

  return (
    <div className="bg-background min-h-screen pb-32 w-full max-w-md mx-auto relative transition-colors duration-300">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-surface-dim fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-between px-margin-mobile h-16 shadow-sm border-b border-surface-container-high">
        {activeSection !== 'menu' ? (
          <button
            onClick={() => setActiveSection('menu')}
            className="active:scale-95 transition-transform text-primary hover:bg-surface-container-high p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        ) : (
          <button className="active:scale-95 transition-transform text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">location_on</span>
          </button>
        )}
        <div className="font-headline-sm text-headline-sm-mobile text-primary dark:text-primary-fixed-dim text-center flex-1 font-bold">
          {activeSection === 'menu' && 'Perfil de Usuario'}
          {activeSection === 'datos' && 'Mis Datos'}
          {activeSection === 'direcciones' && 'Mis Direcciones'}
          {activeSection === 'cupones' && 'Cupones de Descuento'}
          {activeSection === 'ayuda' && 'Centro de Ayuda'}
          {activeSection === 'config' && 'Configuración'}
        </div>
        <button className="active:scale-95 transition-transform text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
        </button>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary text-body-md px-6 py-3 rounded-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 pb-28 px-margin-mobile w-full max-w-md mx-auto">
        {activeSection === 'menu' && (
          <div className="space-y-stack-lg animate-[fadeIn_0.2s_ease-out]">
            {/* Profile Header */}
            <section className="flex flex-col items-center justify-center py-stack-md">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-stack-md shadow-[0px_4px_12px_rgba(0,0,0,0.06)] bg-surface-container-high border-2 border-primary relative group">
                <img
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
                />
              </div>
              <h1 className="font-headline-lg-mobile text-2xl font-bold text-on-surface mb-1">{name}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-1">{email}</p>
              <p className="font-label-md text-label-md text-primary font-semibold">{phone}</p>
            </section>

            {/* Dynamic Dashboard Access for Operative Roles */}
            {showDashboardButton && (
              <section className="animate-[fadeIn_0.3s_ease-out]">
                <a
                  href={getDashboardLink()}
                  className="w-full bg-gradient-to-r from-primary to-[#005cbb] text-on-primary font-headline-sm text-headline-sm py-4 px-6 rounded-2xl flex items-center justify-between shadow-[0px_4px_16px_rgba(0,63,135,0.2)] active:scale-95 transition-all hover:brightness-110 border border-primary/20"
                >
                  <div className="flex items-center space-x-4">
                    <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {session?.user?.role === 'DRIVER' ? 'two_wheeler' : 'admin_panel_settings'}
                    </span>
                    <div className="text-left">
                      <span className="font-bold block text-body-lg">{getDashboardLabel()}</span>
                      <span className="text-body-sm text-white/80 block">Acceder a mis herramientas de gestión</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                </a>
              </section>
            )}

            {/* Options List */}
            <section className="space-y-stack-md">
              <div className="bg-surface dark:bg-surface-container rounded-2xl shadow-[0px_4px_16px_rgba(0,0,0,0.05)] border border-surface-container-high overflow-hidden">
                <button
                  onClick={() => setActiveSection('datos')}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors border-b border-surface-container-highest text-left"
                >
                  <div className="flex items-center space-x-4">
                    <span className="material-symbols-outlined text-primary text-[24px]">person</span>
                    <span className="font-body-lg text-body-lg text-on-surface font-medium">Mis Datos</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setActiveSection('direcciones')}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors border-b border-surface-container-highest text-left"
                >
                  <div className="flex items-center space-x-4">
                    <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
                    <span className="font-body-lg text-body-lg text-on-surface font-medium">Direcciones Guardadas</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setActiveSection('cupones')}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors border-b border-surface-container-highest text-left"
                >
                  <div className="flex items-center space-x-4">
                    <span className="material-symbols-outlined text-primary text-[24px]">sell</span>
                    <span className="font-body-lg text-body-lg text-on-surface font-medium">Cupones</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setActiveSection('ayuda')}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors border-b border-surface-container-highest text-left"
                >
                  <div className="flex items-center space-x-4">
                    <span className="material-symbols-outlined text-primary text-[24px]">help</span>
                    <span className="font-body-lg text-body-lg text-on-surface font-medium">Ayuda</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setActiveSection('config')}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors text-left"
                >
                  <div className="flex items-center space-x-4">
                    <span className="material-symbols-outlined text-primary text-[24px]">settings</span>
                    <span className="font-body-lg text-body-lg text-on-surface font-medium">Configuración</span>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                </button>
              </div>
            </section>

            {/* Logout Action */}
            <section className="pt-stack-sm pb-6">
              <button
                onClick={handleLogout}
                className="w-full bg-error-container hover:bg-opacity-90 text-on-error-container font-headline-sm text-headline-sm py-4 rounded-xl flex items-center justify-center space-x-2 active:scale-95 transition-transform border border-error/10"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span className="font-semibold">Cerrar Sesión</span>
              </button>
            </section>
          </div>
        )}

        {/* SECTION: EDIT DATA */}
        {activeSection === 'datos' && (
          <form onSubmit={handleSaveDatos} className="space-y-6 py-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-surface dark:bg-surface-container rounded-2xl p-6 shadow-[0px_4px_16px_rgba(0,0,0,0.05)] border border-surface-container-high space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md text-on-surface-variant font-medium">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-md text-on-surface-variant font-medium">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-md text-on-surface-variant font-medium">Número Celular</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveSection('menu')}
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold py-4 rounded-xl transition-colors active:scale-98"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-opacity-95 text-on-primary font-semibold py-4 rounded-xl transition-colors active:scale-98 shadow-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}

        {/* SECTION: ADDRESSES */}
        {activeSection === 'direcciones' && (
          <div className="space-y-6 py-4 animate-[fadeIn_0.2s_ease-out]">
            {/* Add Address Form */}
            <form onSubmit={handleAddAddress} className="bg-surface dark:bg-surface-container rounded-2xl p-5 shadow-[0px_4px_16px_rgba(0,0,0,0.05)] border border-surface-container-high space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md text-on-surface-variant font-medium">Nueva Dirección</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Av. de los Shyris y Naciones Unidas"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary transition-colors text-body-md"
                  />
                  <button
                    type="submit"
                    onClick={handleAddAddress}
                    className="bg-primary text-on-primary p-3 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Address List */}
            <div className="space-y-3">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface px-1">Direcciones Guardadas</h3>
              {addresses.length === 0 ? (
                <div className="text-center py-10 bg-surface dark:bg-surface-container rounded-2xl border border-surface-container-high">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">location_off</span>
                  <p className="text-on-surface-variant">No tienes direcciones guardadas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr, index) => (
                    <div
                      key={index}
                      className="bg-surface dark:bg-surface-container rounded-xl p-4 border border-surface-container-high flex items-center justify-between gap-3 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                        <span className="text-body-md text-on-surface font-medium break-words max-w-[240px]">
                          {addr}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(index)}
                        className="text-error hover:bg-error-container/20 p-2 rounded-full flex items-center justify-center transition-colors active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: COUPONS */}
        {activeSection === 'cupones' && (
          <div className="space-y-4 py-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-gradient-to-br from-primary to-[#005cbb] text-on-primary rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-40">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
              <div>
                <span className="bg-white/20 text-label-sm px-2.5 py-1 rounded-full text-white font-semibold">CUPÓN DE BIENVENIDA</span>
                <h3 className="text-2xl font-bold mt-2">Envío Gratis</h3>
                <p className="text-body-sm text-white/80">En tu primera compra de la zona</p>
              </div>
              <div className="flex justify-between items-center bg-white/10 rounded-xl px-4 py-2 mt-2">
                <span className="font-mono font-bold tracking-wider text-lg">BIENVENIDO</span>
                <button
                  onClick={() => triggerToast('Código BIENVENIDO copiado.')}
                  className="bg-white text-primary text-label-md font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="bg-surface dark:bg-surface-container rounded-2xl p-6 border border-surface-container-high shadow-sm relative overflow-hidden flex flex-col justify-between h-40">
              <div>
                <span className="bg-secondary-container text-on-secondary-container text-label-sm px-2.5 py-1 rounded-full font-semibold">DESCUENTO ESPECIAL</span>
                <h3 className="text-2xl font-bold mt-2 text-on-surface">50% De Descuento</h3>
                <p className="text-body-sm text-on-surface-variant">En tarifa de entrega de cualquier local</p>
              </div>
              <div className="flex justify-between items-center bg-surface-container-high rounded-xl px-4 py-2 mt-2">
                <span className="font-mono font-bold tracking-wider text-lg text-primary">BLUE50</span>
                <button
                  onClick={() => triggerToast('Código BLUE50 copiado.')}
                  className="bg-primary text-on-primary text-label-md font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: HELP */}
        {activeSection === 'ayuda' && (
          <div className="space-y-4 py-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-surface dark:bg-surface-container rounded-2xl p-5 border border-surface-container-high space-y-4 shadow-sm">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface border-b pb-2">Preguntas Frecuentes</h3>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-body-md text-primary">¿Cómo realizo un pedido?</h4>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Selecciona tu zona geográfica, navega por los restaurantes locales disponibles, agrega tus artículos al carrito y sube tu comprobante de pago electrónico en la pantalla de pago.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-body-md text-primary">¿Cómo rastreo el estado de mi envío?</h4>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Una vez completado el pedido, aparecerá una barra flotante de &quot;Pedido en curso&quot; en tu pantalla de inicio que te llevará al mapa de rastreo en tiempo real para chatear con el vendedor o verificar el despacho.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-body-md text-primary">¿Cuáles son los métodos de pago?</h4>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Aceptamos transferencias bancarias directas y depósitos. Deberás subir la captura del comprobante dentro de la app para que el vendedor valide y procese tu pedido de inmediato.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/593999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold active:scale-98 transition-transform shadow-md"
            >
              <span className="material-symbols-outlined">chat</span>
              Contactar Soporte por WhatsApp
            </a>
          </div>
        )}

        {/* SECTION: CONFIGURATION */}
        {activeSection === 'config' && (
          <div className="space-y-4 py-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-surface dark:bg-surface-container rounded-2xl p-5 border border-surface-container-high space-y-4 shadow-sm">
              <div className="flex items-center justify-between py-2 border-b border-surface-container-highest">
                <div>
                  <h4 className="font-semibold text-body-md text-on-surface">Notificaciones Push</h4>
                  <p className="text-body-sm text-on-surface-variant">Alertas sobre el estado de tus pedidos</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNotification}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${notifications ? 'bg-primary justify-end' : 'bg-outline-variant justify-start'}`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-surface-container-highest">
                <div>
                  <h4 className="font-semibold text-body-md text-on-surface">Modo Oscuro</h4>
                  <p className="text-body-sm text-on-surface-variant">Ajusta la apariencia visual del sitio</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDarkMode}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-primary justify-end' : 'bg-outline-variant justify-start'}`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-semibold text-body-md text-on-surface">Compartir Ubicación</h4>
                  <p className="text-body-sm text-on-surface-variant">Mejora la precisión del mapa de rastreo</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleLocation}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${locationSharing ? 'bg-primary justify-end' : 'bg-outline-variant justify-start'}`}
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNavBar activeTab="profile" />
    </div>
  );
};
