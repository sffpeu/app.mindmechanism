'use client'

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black/95">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-black hover:bg-black/90 dark:bg-white dark:hover:bg-white/90 dark:text-black',
            card: 'bg-white dark:bg-black/40 dark:border dark:border-white/10',
            headerTitle: 'text-gray-900 dark:text-white',
            headerSubtitle: 'text-gray-600 dark:text-gray-400',
            socialButtonsBlockButton: 'dark:border-white/10 dark:text-white',
            formFieldLabel: 'text-gray-700 dark:text-gray-300',
            formFieldInput: 'dark:border-white/10 dark:bg-black/40 dark:text-white',
            footerActionText: 'text-gray-600 dark:text-gray-400',
            footerActionLink: 'text-black dark:text-white',
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/sign-up/verify-email"
        redirectUrl="/"
      />
    </div>
  );
} 