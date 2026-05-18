// Simple smoke tests for key endpoints
// Run with: node scripts/smoke-tests.js

const BASE = process.env.BASE_URL || 'http://localhost:3000'

async function check(path, options = {}){
  try{
    const res = await fetch(BASE + path, options)
    const text = await res.text().catch(() => '')
    if (!res.ok) console.error(path, res.status, text)
    else console.log(path, res.status)
    return { res, text }
  }catch(e){
    console.error(path, 'ERROR', e.message)
    return null
  }
}

async function run(){
  console.log('Smoke tests against', BASE)
  await check('/')
  await check('/api/stores')
  await check('/api/zones')
  await check('/api/products')
  await check('/api/orders')

  // Test POST /api/orders with empty payload (expect 400)
  const res = await check('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  if(res) console.log('/api/orders POST body =>', res.res.status, res.text)
}

run().catch((e)=>{ console.error('Unexpected error', e) })
