/**
 * Script para crear cuentas de prueba usando la API del servidor Next.js
 * Ejecutar con: tsx scripts/seed-via-api.ts
 */

const BASE_URL = 'http://localhost:3000'

interface ApiResponse {
  error?: string
  [key: string]: unknown
}

async function apiCall(endpoint: string, method: string, body: Record<string, unknown>): Promise<ApiResponse> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { ...data, _status: res.status }
}

async function loginAndGetCookies(email: string, password: string): Promise<string | null> {
  // Usamos la API de NextAuth para obtener un CSRF token primero
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json() as { csrfToken: string }
  const csrfCookie = csrfRes.headers.get('set-cookie') || ''

  const params = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${BASE_URL}/superadmin`,
    json: 'true',
  })

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookie,
    },
    body: params.toString(),
    redirect: 'manual',
  })

  const cookies = loginRes.headers.get('set-cookie')
  if (!cookies) return null
  
  // Combinar CSRF + session cookies
  return csrfCookie + '; ' + cookies
}

async function main() {
  console.log('🚀 Iniciando creación de cuentas de prueba...\n')
  console.log(`📡 Conectando a: ${BASE_URL}`)

  // 1. Verificar que el servidor está corriendo
  try {
    const health = await fetch(`${BASE_URL}/api/auth/session`)
    if (!health.ok) throw new Error('Servidor no disponible')
    console.log('✅ Servidor disponible\n')
  } catch {
    console.error('❌ El servidor no está corriendo. Inicia con: npm run dev')
    process.exit(1)
  }

  // 2. Intentar login como Super Admin
  console.log('🔑 Intentando login como Super Admin...')
  const cookies = await loginAndGetCookies('lveliz213@hotmail.com', '20021985FreeS@IN-HOUSE')

  if (!cookies) {
    console.log('⚠️  Login como Super Admin falló (puede que la cuenta no exista aún)')
    console.log('\n📋 Para crear las cuentas de prueba necesitas:')
    console.log('   1. Acceder a tu base de datos Neon/Supabase directamente')
    console.log('   2. O configurar el DATABASE_URL en el .env con la URL real')
    console.log('\n💡 URL de la BD puede estar en el archivo de configuración del servidor activo')
    return
  }

  console.log('✅ Login exitoso como Super Admin\n')

  // 3. Crear zona de prueba
  console.log('🗺️  Creando zona de prueba...')
  const zoneRes = await fetch(`${BASE_URL}/api/superadmin/zones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({
      name: 'Zona Demo - Centro',
      description: 'Zona de prueba para testing',
      latitude: -2.1829,
      longitude: -79.5180,
      radius: 10,
      currency: 'USD',
    }),
  })

  const zone = await zoneRes.json()
  if (zone.error) {
    console.log(`⚠️  Zona: ${zone.error}`)
  } else {
    console.log(`✅ Zona creada: ${zone.name} (ID: ${zone.id})`)
  }

  const zoneId = zone.id

  if (!zoneId) {
    console.log('❌ No se pudo crear la zona, abortando')
    return
  }

  // 4. Crear admin de prueba
  console.log('\n👤 Creando cuenta Admin de prueba...')
  const adminRes = await fetch(`${BASE_URL}/api/superadmin/admins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
    },
    body: JSON.stringify({
      name: 'Admin Demo',
      email: 'admin@demo.com',
      password: 'Admin2024!',
      phone: '+1 555 0101',
      zoneId,
    }),
  })

  const adminAccount = await adminRes.json()
  if (adminAccount.error) {
    console.log(`⚠️  Admin: ${adminAccount.error}`)
  } else {
    console.log(`✅ Admin creado: ${adminAccount.email}`)
  }

  // 5. Resultado final
  console.log('\n' + '='.repeat(50))
  console.log('🎉 CREDENCIALES PARA TESTING')
  console.log('='.repeat(50))
  console.log('\n👑 SUPER ADMIN')
  console.log('   Email:    lveliz213@hotmail.com')
  console.log('   Password: 20021985FreeS@IN-HOUSE')
  console.log('   URL:      http://localhost:3000/superadmin')
  console.log('\n👤 ADMIN (recién creado)')
  console.log('   Email:    admin@demo.com')
  console.log('   Password: Admin2024!')
  console.log('   URL:      http://localhost:3000/admin')
  console.log('\n' + '='.repeat(50))
}

main().catch(console.error)
