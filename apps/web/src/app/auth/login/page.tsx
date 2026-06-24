'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, MapPin, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* ── Left brand panel (desktop only) ── */}
      <div
        className="hidden flex-1 flex-col justify-between px-12 py-16 lg:flex"
        style={{ background: 'linear-gradient(155deg,#EEF2FF 0%,#E0F2FE 60%,#F0FDF4 100%)' }}
      >
        <Link href="/" className="text-xl font-black tracking-tight text-gray-900">
          Marketplace<span className="text-primary">.</span>
        </Link>

        <div>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900">
            The right provider
            <br />
            is closer than
            <br />
            you think.
          </h2>
          <ul className="mt-10 space-y-4">
            {[
              { icon: ShieldCheck, text: 'Every provider is document-verified before listing' },
              { icon: MapPin, text: 'Results ranked by distance, not advertising budget' },
              { icon: Zap, text: 'Free to search — always, no subscriptions ever' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-600">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Marketplace SL</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 block text-center text-xl font-black tracking-tight text-gray-900 lg:hidden">
            Marketplace<span className="text-primary">.</span>
          </Link>

          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/[0.06]">
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
              <p className="mt-1.5 text-sm text-gray-500">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading && <Spinner className="h-4 w-4" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              No account yet?{' '}
              <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
