import fs from 'fs'
import path from 'path'

export interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

export interface PushSubscriptionData {
  endpoint: string
  keys: PushSubscriptionKeys
  userId?: string | null
  createdAt?: string
}

const FILE_PATH = path.join(process.cwd(), 'src', 'lib', 'push-subscriptions.json')

// Helper function to read from the JSON file
export function getSubscriptions(): PushSubscriptionData[] {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      // Return empty list if file doesn't exist
      return []
    }
    const raw = fs.readFileSync(FILE_PATH, 'utf-8')
    return JSON.parse(raw) as PushSubscriptionData[]
  } catch (error) {
    console.error('Error reading push subscriptions store:', error)
    return []
  }
}

// Helper function to save to the JSON file
export function saveSubscriptions(subscriptions: PushSubscriptionData[]): boolean {
  try {
    const dir = path.dirname(FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(subscriptions, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Error saving push subscriptions store:', error)
    return false
  }
}

// Register a new subscription
export function registerSubscription(sub: PushSubscriptionData): void {
  const list = getSubscriptions()
  // Filter out any existing subscription with the same endpoint
  const filtered = list.filter(item => item.endpoint !== sub.endpoint)
  filtered.push({
    ...sub,
    createdAt: new Date().toISOString()
  })
  saveSubscriptions(filtered)
}

// Remove subscription
export function unregisterSubscription(endpoint: string): void {
  const list = getSubscriptions()
  const filtered = list.filter(item => item.endpoint !== endpoint)
  saveSubscriptions(filtered)
}
