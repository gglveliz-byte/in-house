'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error crítico
    console.error('Error global crítico:', error)
  }, [error])

  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom, #fef2f2, #fee2e2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              backgroundColor: 'white',
              border: '2px solid #fecaca',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            }}
          >
            {/* Icono de error */}
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              🚨
            </div>

            {/* Título */}
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#dc2626',
                marginBottom: '0.75rem',
              }}
            >
              Error del Sistema
            </h1>

            {/* Mensaje */}
            <p
              style={{
                color: '#6b7280',
                marginBottom: '2rem',
                lineHeight: '1.6',
              }}
            >
              Ocurrió un error inesperado en la aplicación.
              Nuestro equipo técnico ha sido notificado y estamos trabajando para solucionarlo.
            </p>

            {/* Botones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => reset()}
                style={{
                  width: '100%',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
              >
                Intentar de nuevo
              </button>

              <a
                href="/"
                style={{
                  display: 'block',
                  width: '100%',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '2px solid #e5e7eb',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              >
                Volver al inicio
              </a>
            </div>

            {/* Mensaje de ayuda */}
            <p
              style={{
                marginTop: '1.5rem',
                fontSize: '0.875rem',
                color: '#9ca3af',
              }}
            >
              Si el problema persiste, intenta:
              <br />
              • Recargar la página
              <br />
              • Limpiar el caché del navegador
              <br />
              • Regresar más tarde
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
