import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { CurrencyProvider } from '@/components/currency-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'In House Delivery',
  description: 'Pide comida de tus restaurantes favoritos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'In House',
  },
  icons: {
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" href="/logo.png" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface-container-low text-on-surface antialiased min-h-screen">
        <div className="max-w-md mx-auto bg-background min-h-screen relative shadow-2xl overflow-x-hidden">
        <Providers>{children}</Providers>
        <CurrencyProvider />
        <ServiceWorkerRegister />
          <InstallPrompt />
        </div>
      </body>
    </html>
  )
}
