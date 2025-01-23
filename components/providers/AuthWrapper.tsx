'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import AuthPopup from '@/components/AuthPopup';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        {children}
        <AuthPopup isOpen={true} onClose={() => setShowAuthPopup(false)} />
      </>
    );
  }

  return <>{children}</>;
} 