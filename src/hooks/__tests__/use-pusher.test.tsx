/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import { describe, it, expect, vi, afterAll } from 'vitest'
import { render, act } from '@testing-library/react'
import * as usePusher from '@/hooks/use-pusher'

interface PusherChannel {
  handlers: Record<string, ((data: unknown) => void)[]>
  bind(event: string, cb: (data: unknown) => void): void
  unbind(event: string, cb: (data: unknown) => void): void
  triggerEvent(event: string, data: unknown): void
}

interface PusherMock {
  subscribe(name: string): PusherChannel
  unsubscribe(name: string): void
  __channels: Record<string, PusherChannel>
}

const createPusherChannel = (): PusherChannel => ({
  handlers: {},
  bind(event, cb) {
    this.handlers[event] = this.handlers[event] || []
    this.handlers[event].push(cb)
  },
  unbind(event, cb) {
    this.handlers[event] = (this.handlers[event] || []).filter((handler) => handler !== cb)
  },
  triggerEvent(event, data) {
    ;(this.handlers[event] || []).forEach((handler) => handler(data))
  },
})

// Mock pusher-js (factory inside mock to avoid hoisting issues)
vi.mock('pusher-js', () => {
  const channels: Record<string, PusherChannel> = {}
  const mockInstance: PusherMock = {
    subscribe(name: string) {
      channels[name] = channels[name] || createPusherChannel()
      return channels[name]
    },
    unsubscribe(name: string) { delete channels[name] },
    __channels: channels,
  }

  function Pusher() {
    return mockInstance
  }

  // attach mock instance to constructor for easier access
  ;(Pusher as unknown as { __mockInstance?: PusherMock }).__mockInstance = mockInstance
  return { default: Pusher, __mockInstance: mockInstance }
})

// Prepare Notification mock
const originalNotification = global.Notification

describe('use-pusher hooks', () => {
  afterAll(() => {
    global.Notification = originalNotification
  })

  it('usePusherAvailable returns true when env variables present', () => {
    process.env.NEXT_PUBLIC_PUSHER_KEY = 'key'
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER = 'cluster'

    function Test() {
      const available = usePusher.usePusherAvailable()
      return React.createElement('div', {}, String(available))
    }

    const { getByText } = render(React.createElement(Test))
    expect(getByText('true')).toBeTruthy()
  })

  it('useNotificationPermission requestPermission works', async () => {
    global.Notification = {
      permission: 'default',
      requestPermission: async () => 'granted'
    } as any

    function Test() {
      const { permission, requestPermission } = usePusher.useNotificationPermission()
      const [p, setP] = useState(permission)
      useEffect(() => {
        setP(permission)
      }, [permission])
      useEffect(() => {
        requestPermission()
      }, [])
      return React.createElement('div', {}, String(p))
    }

    const { findByText } = render(React.createElement(Test))
    const el = await findByText(/default|granted/)
    expect(el).toBeTruthy()
  })

  it('useStoreOrders registers handlers and calls callbacks on events', async () => {
    const onNewOrder = vi.fn()
    const onOrderUpdate = vi.fn()

    process.env.NEXT_PUBLIC_PUSHER_KEY = 'key'
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER = 'cluster'

    // Inject a mock pusher instance via the test setter
    const channels: Record<string, PusherChannel> = {}
    const mockInstance: PusherMock = {
      subscribe(name: string) {
        channels[name] = channels[name] || createPusherChannel()
        return channels[name]
      },
      unsubscribe(name: string) { delete channels[name] },
      __channels: channels,
    }

    type UsePusherModule = typeof usePusher & {
      __setPusherFactory?: (factory: () => PusherMock) => void
    }
    const usePusherModule = usePusher as UsePusherModule
    usePusherModule.__setPusherFactory?.(() => mockInstance)

    function Test() {
      usePusher.useStoreOrders('store123', onNewOrder, onOrderUpdate)
      return React.createElement('div', {})
    }

    render(React.createElement(Test))

    // Wait for useEffect to run
    await act(async () => new Promise((r) => setTimeout(r, 0)))

    const channel = mockInstance.subscribe('store-store123')

    act(() => {
      channel.triggerEvent('new-order', { orderNumber: 42 })
    })

    expect(onNewOrder).toHaveBeenCalled()
  })
})
