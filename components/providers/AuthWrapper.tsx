'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import SignIn from '@/app/auth/signin/page';
import SignUp from '@/app/auth/signup/page';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [showSignUp, setShowSignUp] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          {showSignUp ? (
            <div>
              <SignUp />
              <button
                onClick={() => setShowSignUp(false)}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-4 mb-6 text-center"
              >
                Already have an account? Sign in
              </button>
            </div>
          ) : (
            <div>
              <SignIn />
              <button
                onClick={() => setShowSignUp(true)}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-4 mb-6 text-center"
              >
                Don't have an account? Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 