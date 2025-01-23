'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'Configuration') {
      setError('There is a problem with the server configuration. Please try again later.');
    } else if (error === 'AccessDenied') {
      setError('Access denied. Please check your credentials and try again.');
    } else if (error === 'Verification') {
      setError('The verification link may have expired. Please try to sign in again.');
    } else {
      setError('An unexpected error occurred. Please try again.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Authentication Error
          </h2>
          <div className="mt-4 bg-red-50 dark:bg-red-900/50 p-4 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-200 text-center">
              {error}
            </p>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="text-black dark:text-white hover:underline"
            >
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 