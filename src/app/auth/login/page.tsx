'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-400/10 border border-brand-400/30 rounded-2xl mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h1 className="text-3xl font-display font-bold gradient-text">Property CRM</h1>
          <p className="text-gray-500 mt-1 text-sm">Pakistan Real Estate Management</p>
        </div>

        <div className="card-glow p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-500 text-center">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 bg-dark-700 rounded-lg p-4 text-xs text-gray-500">
            <p className="font-semibold text-gray-400 mb-1">Demo Credentials:</p>
            <p>Admin: admin@propertycrm.pk / Admin@1234</p>
            <p>Agent: agent@propertycrm.pk / Agent@1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
