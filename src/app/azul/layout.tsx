'use client';

import React from 'react';

export default function AzulLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-screen relative shadow-2xl overflow-x-hidden">
      {children}
    </div>
  );
}
