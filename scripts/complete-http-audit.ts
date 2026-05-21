import { parse } from 'cookie'

const BASE_URL = 'http://localhost:3000'

interface AuditResult {
  url: string
  status: number
  passed: boolean
  notes?: string
}

async function getCsrfTokenAndCookie(): Promise<{ csrfToken: string; cookie: string }> {
  const response = await fetch(`${BASE_URL}/api/auth/csrf`)
  if (!response.ok) {
    throw new Error('No se pudo obtener el token CSRF')
  }
  const data = await response.json()
  const setCookie = response.headers.get('set-cookie') || ''
  
  // Extraer el token de CSRF de la cabecera set-cookie si está presente
  const cookies = setCookie.split(',').map(c => c.trim())
  const csrfCookie = cookies.find(c => c.startsWith('next-auth.csrf-token')) || ''
  const cookieVal = csrfCookie.split(';')[0]

  return {
    csrfToken: data.csrfToken,
    cookie: cookieVal,
  }
}

async function loginAndGetSessionCookie(email: string, password: string): Promise<string> {
  try {
    const { csrfToken, cookie: csrfCookie } = await getCsrfTokenAndCookie()

    const params = new URLSearchParams()
    params.append('csrfToken', csrfToken)
    params.append('email', email)
    params.append('password', password)
    params.append('callbackUrl', `${BASE_URL}/dashboard`)
    params.append('json', 'true')

    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': csrfCookie,
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Error en login HTTP: ${response.status}`)
    }

    const setCookieHeaders = response.headers.get('set-cookie')
    if (!setCookieHeaders) {
      throw new Error('No se recibió la cabecera Set-Cookie de sesión')
    }

    // Buscar el token de sesión
    const cookies = setCookieHeaders.split(',').map(c => c.trim())
    const sessionCookie = cookies.find(c => c.startsWith('next-auth.session-token')) || ''
    const sessionCookieVal = sessionCookie.split(';')[0]

    if (!sessionCookieVal) {
      throw new Error('No se pudo extraer el token de sesión next-auth.session-token')
    }

    return sessionCookieVal
  } catch (error: any) {
    console.error(`❌ Error al autenticar ${email}:`, error.message)
    return ''
  }
}

async function auditPage(path: string, cookie = ''): Promise<AuditResult> {
  const url = `${BASE_URL}${path}`
  try {
    const headers: Record<string, string> = {}
    if (cookie) {
      headers['Cookie'] = cookie
    }

    const response = await fetch(url, { headers })
    const text = await response.text()
    
    // Si redirige al login o retorna 401/403, falló la página privada
    const isLoginRedirect = response.redirected && (response.url.includes('/login') || response.url.includes('/signin'))
    const passed = response.ok && !isLoginRedirect

    let notes = ''
    if (isLoginRedirect) {
      notes = 'Redirección al Login (No autorizado)'
    } else if (response.status === 401 || response.status === 403) {
      notes = 'Acceso Denegado (401/403)'
    } else if (response.status === 404) {
      notes = 'No encontrado (404)'
    } else {
      notes = `Carga exitosa (${text.slice(0, 40).replace(/\n/g, ' ')}...)`
    }

    return {
      url: path,
      status: response.status,
      passed,
      notes,
    }
  } catch (error: any) {
    return {
      url: path,
      status: 0,
      passed: false,
      notes: `Error de conexión: ${error.message}`,
    }
  }
}

async function runAudit() {
  console.log('🌐 INICIANDO AUDITORÍA SENSITIVA DE SESIONES DE NAVEGADOR (CHROME SIMULATED)\n')
  
  const results: AuditResult[] = []

  // --- FASE 1: AUDITORÍA DE PÁGINAS PÚBLICAS ---
  console.log('📂 1. Auditando Páginas Públicas...')
  const publicPages = [
    '/',
    '/login',
    '/azul',
    '/azul/restaurant/tienda-demo',
    '/descargar',
  ]
  for (const page of publicPages) {
    const res = await auditPage(page)
    results.push(res)
    console.log(`   ${res.passed ? '✅' : '❌'} Pág. Pública: ${res.url} (Status: ${res.status}) - ${res.notes}`)
  }
  console.log('')

  // --- FASE 2: AUDITORÍA DE ROL SUPER ADMIN ---
  console.log('👑 2. Autenticando como Super Admin (lveliz213@hotmail.com)...')
  const superAdminCookie = await loginAndGetSessionCookie('lveliz213@hotmail.com', '20021985FreeS@IN-HOUSE')
  if (superAdminCookie) {
    console.log('   ✅ Cookie de sesión obtenida.')
    const privatePages = [
      '/superadmin',
      '/superadmin/admins',
      '/superadmin/zones',
      '/superadmin/billing',
      '/superadmin/messages',
      '/api/superadmin/stats',
    ]
    for (const page of privatePages) {
      const res = await auditPage(page, superAdminCookie)
      results.push(res)
      console.log(`   ${res.passed ? '✅' : '❌'} Pág. Privada: ${res.url} (Status: ${res.status}) - ${res.notes}`)
    }
  } else {
    console.log('   ❌ Falló la autenticación del Super Admin.')
  }
  console.log('')

  // --- FASE 3: AUDITORÍA DE ROL ADMIN DE ZONA ---
  console.log('🛡️ 3. Autenticando como Admin Demo (admin@demo.com)...')
  const adminCookie = await loginAndGetSessionCookie('admin@demo.com', 'Admin2024!')
  if (adminCookie) {
    console.log('   ✅ Cookie de sesión obtenida.')
    const privatePages = [
      '/admin',
      '/admin/users',
      '/admin/stores',
      '/admin/orders',
      '/admin/billing',
      '/admin/qr',
      '/api/admin/stats',
    ]
    for (const page of privatePages) {
      const res = await auditPage(page, adminCookie)
      results.push(res)
      console.log(`   ${res.passed ? '✅' : '❌'} Pág. Privada: ${res.url} (Status: ${res.status}) - ${res.notes}`)
    }
  } else {
    console.log('   ❌ Falló la autenticación del Admin Demo.')
  }
  console.log('')

  // --- FASE 4: AUDITORÍA DE ROL VENDEDOR ---
  console.log('🏪 4. Autenticando como Vendedor Demo (vendor@demo.com)...')
  const vendorCookie = await loginAndGetSessionCookie('vendor@demo.com', 'Vendor2024!')
  if (vendorCookie) {
    console.log('   ✅ Cookie de sesión obtenida.')
    const privatePages = [
      '/vendor',
      '/vendor/orders',
      '/vendor/products',
      '/vendor/settings',
    ]
    for (const page of privatePages) {
      const res = await auditPage(page, vendorCookie)
      results.push(res)
      console.log(`   ${res.passed ? '✅' : '❌'} Pág. Privada: ${res.url} (Status: ${res.status}) - ${res.notes}`)
    }
  } else {
    console.log('   ❌ Falló la autenticación del Vendedor Demo.')
  }
  console.log('')

  // --- FASE 5: AUDITORÍA DE ROL REPARTIDOR ---
  console.log('🚚 5. Autenticando como Repartidor Demo (driver@demo.com)...')
  const driverCookie = await loginAndGetSessionCookie('driver@demo.com', 'Driver2024!')
  if (driverCookie) {
    console.log('   ✅ Cookie de sesión obtenida.')
    const privatePages = [
      '/driver',
      '/driver/history',
      '/driver/active',
      '/api/orders/ready',
    ]
    for (const page of privatePages) {
      const res = await auditPage(page, driverCookie)
      results.push(res)
      console.log(`   ${res.passed ? '✅' : '❌'} Pág. Privada: ${res.url} (Status: ${res.status}) - ${res.notes}`)
    }
  } else {
    console.log('   ❌ Falló la autenticación del Repartidor Demo.')
  }
  console.log('')

  // --- RESUMEN FINAL ---
  console.log('================================================================================')
  console.log('📊 RESUMEN FINAL DE LA AUDITORÍA DE NAVEGACIÓN SIMULADA')
  console.log('================================================================================')
  const total = results.length
  const passed = results.filter(r => r.passed).length
  const failed = total - passed

  console.log(`📈 Páginas Auditadas: ${total}`)
  console.log(`✅ Aprobadas (200 OK): ${passed}`)
  console.log(`❌ Fallidas / Denegadas: ${failed}\n`)

  if (failed === 0) {
    console.log('🏆 AUDITORÍA COMPLETADA CON ÉXITO: Todas las páginas y APIs respondieron de forma correcta y autorizada.')
  } else {
    console.log('⚠️ AUDITORÍA COMPLETADA CON ADVERTENCIAS: Se detectaron fallas de carga en algunas rutas.')
  }
}

runAudit().catch(err => {
  console.error('Error durante la auditoría global:', err)
})
