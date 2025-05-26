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
          <form onSubmit={handleLogin} className="space-y-4">
            <input name="email" type="email" required placeholder="Email" className="w-full border rounded px-3 py-2" disabled={isLoading} autoFocus />
            <input name="password" type="password" required placeholder="Password" className="w-full border rounded px-3 py-2" disabled={isLoading} />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium" disabled={isLoading}>Sign in</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <input name="name" type="text" required placeholder="Name" className="w-full border rounded px-3 py-2" disabled={isLoading} autoFocus />
            <input name="email" type="email" required placeholder="Email" className="w-full border rounded px-3 py-2" disabled={isLoading} />
            <input name="password" type="password" required placeholder="Password" className="w-full border rounded px-3 py-2" disabled={isLoading} />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium" disabled={isLoading}>Register</button>
          </form>
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
