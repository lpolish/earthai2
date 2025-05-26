import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setError('Google sign-in failed. Please try again.');
        return;
      }

      onClose();
    } catch (error) {
      setError('An error occurred during Google sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password');
        return;
      }
      onClose();
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      setMode('login');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure mode updates if initialMode changes (e.g., when user clicks different button)
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!open) return null;

  // Prevent map interaction when modal is open
  // (pointer-events-auto on modal, pointer-events-none on overlay)
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-all" style={{ pointerEvents: 'auto' }}>
      {/* Overlay to block pointer events to map */}
      <div className="absolute inset-0 w-full h-full z-0 bg-transparent" style={{ pointerEvents: 'auto' }} onClick={onClose} />
      <div className="relative z-10 bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-blue-200 animate-fade-in" style={{ pointerEvents: 'auto' }}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full p-1" aria-label="Close">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center text-blue-700 mb-2">{mode === 'login' ? 'Sign in to EarthAI' : 'Create your EarthAI account'}</h2>
        </div>
        {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}
        {mode === 'login' ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="email" type="email" required placeholder="Email" className="w-full border rounded px-3 py-2" disabled={isLoading} autoFocus />
              <input name="password" type="password" required placeholder="Password" className="w-full border rounded px-3 py-2" disabled={isLoading} />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium" disabled={isLoading}>Sign in</button>
            </form>
            
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="mt-4 w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="name" type="text" required placeholder="Name" className="w-full border rounded px-3 py-2" disabled={isLoading} autoFocus />
              <input name="email" type="email" required placeholder="Email" className="w-full border rounded px-3 py-2" disabled={isLoading} />
              <input name="password" type="password" required placeholder="Password" className="w-full border rounded px-3 py-2" disabled={isLoading} />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium" disabled={isLoading}>Register</button>
            </form>
            
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="mt-4 w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </>
        )}
        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <span className="text-sm">Don't have an account?{' '}
              <button type="button" className="text-blue-600 hover:underline" onClick={() => setMode('register')}>Register</button>
            </span>
          ) : (
            <span className="text-sm">Already have an account?{' '}
              <button type="button" className="text-blue-600 hover:underline" onClick={() => setMode('login')}>Sign in</button>
            </span>
          )}
        </div>
        {isLoading && <div className="mt-4 text-center text-gray-500 text-sm">Loading...</div>}
      </div>
    </div>
  );
};

export default AuthModal;
