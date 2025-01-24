'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const error = searchParams?.get('error');

  useEffect(() => {
    try {
      if (!error) {
        router.push('/auth/signin');
        return;
      }
      setErrorMessage(getErrorMessage(error));
    } catch (e) {
      console.error('Error in auth error page:', e);
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  }, [error, router]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode.toLowerCase()) {
      case 'configuration':
        return 'There is a problem with the server configuration. Please try again later.';
      case 'accessdenied':
        return 'Access denied. You do not have permission to access this resource.';
      case 'verification':
        return 'The verification link may have expired or already been used.';
      case 'signin':
        return 'Try signing in with a different account.';
      case 'oauthsignin':
        return 'Error in the OAuth sign-in process. Please try again.';
      case 'oauthcallback':
        return 'Error in the OAuth callback process. Please try again.';
      case 'oauthcreateaccount':
        return 'Could not create OAuth provider account. Try signing in with a different account.';
      case 'emailcreateaccount':
        return 'Could not create email provider account. Try signing in with a different account.';
      case 'callback':
        return 'Error in the authentication callback. Please try again.';
      case 'emailsignin':
        return 'The e-mail could not be sent. Please try again.';
      case 'credentialssignin':
        return 'Invalid credentials. Please check your email and password.';
      case 'sessionrequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleReturnToSignIn = () => {
    try {
      router.push('/auth/signin');
    } catch (e) {
      console.error('Error navigating to sign in:', e);
      // Fallback to window.location if router fails
      window.location.href = '/auth/signin';
    }
  };

  // Early return while error message is being set
  if (!errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
          </div>
          <h1 className="text-2xl font-bold text-center dark:text-white">Authentication Error</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center">
            {errorMessage}
          </p>
          <button
            onClick={handleReturnToSignIn}
            className="mt-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    </div>
  );
} 