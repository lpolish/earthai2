'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration. Please try again later.',
  AccessDenied: 'You do not have permission to sign in. Please contact support if you believe this is an error.',
  Verification: 'The verification link has expired or has already been used. Please request a new one.',
  Default: 'An unexpected error occurred during authentication. Please try again.',
  OAuthSignin: 'Error occurred during OAuth sign-in. Please try again.',
  OAuthCallback: 'Error occurred during OAuth callback. Please try again.',
  OAuthCreateAccount: 'Could not create OAuth account. The email might already be in use with a different provider.',
  EmailCreateAccount: 'Could not create account with this email. It might already be in use.',
  Callback: 'Authentication callback failed. Please try again.',
  OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'Check your email for a sign-in link.',
  CredentialsSignin: 'Invalid credentials. Please check your email and password.',
  SessionRequired: 'Please sign in to access this page.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorType = searchParams.get('error') || 'Default';
    setError(errorMessages[errorType] || errorMessages.Default);
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/auth/login');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto h-16 w-16 text-red-500 mb-4">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Authentication Error
          </h2>
          
          <p className="mt-4 text-gray-600 text-center max-w-sm mx-auto">
            {error}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Return to Home
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Having trouble?</span>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Try these troubleshooting steps:
            </p>
            <ul className="mt-2 text-sm text-gray-500 space-y-1">
              <li>• Clear your browser cache and cookies</li>
              <li>• Try using an incognito/private browser window</li>
              <li>• Check if your account works with a different sign-in method</li>
              <li>• Ensure your browser allows third-party cookies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
