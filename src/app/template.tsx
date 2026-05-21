'use client'

import React from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-entrance w-full flex-grow flex flex-col">
      {children}
    </div>
  )
}
