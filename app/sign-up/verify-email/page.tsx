'use client'

import { useEffect } from 'react'
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    async function attemptVerification() {
      try {
        // If the user has been enrolled in email verification
        // but they haven't completed it yet, signUp.verifications.emailAddress.status
        // will equal "pending".
        if (signUp?.verifications?.emailAddress?.status === "pending") {
          // The user needs to verify their email
          // You can display UI here to prompt them to check their email
          return;
        }

        // If the user has completed email verification, status will equal "verified"
        // In this case, we can complete the sign up and authenticate the user
        if (signUp?.verifications?.emailAddress?.status === "verified") {
          await setActive({ session: signUp.createdSessionId });
          router.push('/');
        }
      } catch (err) {
        console.error('Error during verification:', err);
      }
    }

    attemptVerification();
  }, [isLoaded, signUp, setActive, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black/95">
      <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-black/40 rounded-xl border dark:border-white/10">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Check your email
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          We sent you a verification link. Please check your email to verify your account.
        </p>
      </div>
    </div>
  );
} 