'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AzulLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role;
      if (['SUPER_ADMIN', 'ADMIN', 'VENDOR', 'DRIVER'].includes(role)) {
        router.replace('/dashboard');
      }
    }
  }, [session, status, router]);

  return (
    <div className="w-full max-w-md mx-auto bg-background min-h-screen relative shadow-2xl overflow-x-hidden">
      {children}
    </div>
  );
}
