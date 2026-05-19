'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface LoginFormProps {
  formData: { email: string; password: string };
  setFormData: React.Dispatch<React.SetStateAction<{ email: string; password: string }>>;
}

function LoginForm({ formData, setFormData }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/vendor'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      } else {
        const session = await getSession()
        const role = session?.user?.role
        if (role === 'SUPER_ADMIN') router.push('/superadmin')
        else if (role === 'ADMIN') router.push('/admin')
        else if (role === 'VENDOR') router.push('/vendor')
        else if (role === 'DRIVER') router.push('/driver/active')
        else router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-body-sm">
          <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="font-label-md text-label-md text-secondary" htmlFor="email">Correo electrónico</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="tu@email.com"
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-label-md text-label-md text-secondary" htmlFor="password">Contraseña</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
            className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-on-primary font-headline-sm text-headline-sm py-4 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0px_4px_12px_rgba(0,63,135,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            Iniciando sesión...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">login</span>
            Iniciar Sesión
          </>
        )}
      </button>

      <div className="text-center">
        <Link href="/forgot-password" className="text-body-sm text-secondary hover:text-primary transition-colors">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </form>
  )
}

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleRoleSelect = (role: string) => {
    if (role === 'Vendedor') {
      setFormData({ email: 'vendor@demo.com', password: 'Vendor2024!' })
    } else if (role === 'Repartidor') {
      setFormData({ email: 'driver@demo.com', password: 'Driver2024!' })
    } else if (role === 'Administrador') {
      setFormData({ email: 'lveliz213@hotmail.com', password: '20021985FreeS@IN-HOUSE' })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-margin-mobile font-body-md text-on-surface antialiased">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary-container/50 blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-[0px_8px_24px_rgba(0,63,135,0.3)]">
            <span className="material-symbols-outlined text-on-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>delivery_dining</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface font-bold">BlueExpress</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Panel Operativo — Acceso Seguro</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-[0px_8px_32px_rgba(0,0,0,0.08)]">
          <div className="mb-6">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Bienvenido de vuelta</h2>
            <p className="text-on-surface-variant text-body-sm mt-1">Accede con tus credenciales asignadas</p>
          </div>

          <Suspense fallback={
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container rounded-xl animate-pulse" />)}
            </div>
          }>
            <LoginForm formData={formData} setFormData={setFormData} />
          </Suspense>
        </div>

        {/* Role indicators */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: 'store', label: 'Vendedor', color: 'text-primary' },
            { icon: 'two_wheeler', label: 'Repartidor', color: 'text-secondary' },
            { icon: 'admin_panel_settings', label: 'Administrador', color: 'text-on-surface-variant' },
          ].map(({ icon, label, color }) => (
            <button
              key={label}
              onClick={() => handleRoleSelect(label)}
              className="bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low transition-all rounded-xl p-3 text-center cursor-pointer outline-none hover:scale-105 active:scale-95 shadow-sm focus:ring-2 focus:ring-primary/20"
            >
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
              <p className="text-label-md font-label-md text-on-surface-variant mt-1">{label}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-body-sm text-on-surface-variant mt-6">
          ¿Eres cliente?{' '}
          <Link href="/azul" className="text-primary font-semibold hover:underline">
            Ir a BlueExpress
          </Link>
        </p>
      </div>
    </div>
  )
}
