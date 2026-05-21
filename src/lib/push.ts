import webPush from 'web-push'
import fs from 'fs'
import path from 'path'

const KEYS_FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'vapid-keys.json')

export interface VapidKeys {
  publicKey: string
  privateKey: string
}

// Retrieve configured VAPID keys, or auto-generate a persistent local pair if missing
export function getVapidKeys(): VapidKeys {
  // 1. Check environment variables
  const envPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_KEY
  const envPriv = process.env.VAPID_PRIVATE_KEY
  if (envPub && envPriv) {
    return { publicKey: envPub, privateKey: envPriv }
  }

  // 2. Check local JSON cache
  try {
    if (fs.existsSync(KEYS_FILE_PATH)) {
      const raw = fs.readFileSync(KEYS_FILE_PATH, 'utf-8')
      return JSON.parse(raw) as VapidKeys
    }
  } catch (error) {
    console.error('Error reading VAPID keys cache file:', error)
  }

  // 3. Auto-bootstrap: Generate fresh keys on the fly
  console.log('--- AUTO-BOOTSTRAP PWA PUSH NOTIFICATIONS ---')
  console.log('Generating persistent VAPID credentials inside src/lib/vapid-keys.json...')
  const newKeys = webPush.generateVAPIDKeys()
  try {
    const dir = path.dirname(KEYS_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(KEYS_FILE_PATH, JSON.stringify(newKeys, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving freshly generated VAPID keys:', error)
  }

  return newKeys
}

// Initialize VAPID details for signing push notifications
let isInitialized = false
export function initWebPush(): void {
  if (isInitialized) return
  const keys = getVapidKeys()
  webPush.setVapidDetails(
    'mailto:support@inhouse.delivery',
    keys.publicKey,
    keys.privateKey
  )
  isInitialized = true
}

// Send dynamic background web push notification to a browser subscription
export async function sendPushNotification(
  subscription: {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  },
  payload: {
    title: string
    body: string
    link?: string
  }
) {
  initWebPush()
  try {
    const result = await webPush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    return { success: true, result }
  } catch (error: unknown) {
    console.error('Error sending web push notification:', error)
    // 404 or 410 indicate the subscription has expired or been revoked by the client
    const errObj = error as { statusCode?: number }
    if (errObj && (errObj.statusCode === 410 || errObj.statusCode === 404)) {
      return { success: false, expired: true, error }
    }
    return { success: false, error }
  }
}

// Dispatch background push notifications to a specific user's registered browsers
export async function sendPushToUser(
  userId: string,
  payload: {
    title: string
    body: string
    link?: string
  }
) {
  const { getSubscriptions, unregisterSubscription } = await import('./push-store')
  const subscriptions = getSubscriptions().filter((sub) => sub.userId === userId)
  const results = []

  for (const sub of subscriptions) {
    const res = await sendPushNotification(sub, payload)
    if (!res.success && res.expired) {
      unregisterSubscription(sub.endpoint)
    }
    results.push(res)
  }

  return results
}
