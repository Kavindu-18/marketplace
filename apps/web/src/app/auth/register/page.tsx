'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type Role = 'CUSTOMER' | 'PROVIDER';

const ROLES: { value: Role; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'CUSTOMER', label: 'Customer', desc: 'Looking for services near me', icon: Users },
  { value: 'PROVIDER', label: 'Provider', desc: 'Offering services to customers', icon: Briefcase },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(null);
    setLoading(true);
    try {
      await register(email, password, role);
      router.push(role === 'PROVIDER' ? '/dashboard/provider' : '/');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Registration failed';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-black tracking-tight text-gray-900">
            Marketplace<span className="text-primary">.</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/[0.06]">
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-gray-900">Create an account</h1>
            <p className="mt-1.5 text-sm text-gray-500">Join the marketplace — it&apos;s free</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role picker */}
            <div>
              <p className="mb-2.5 text-sm font-semibold text-gray-700">I want to</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={cn(
                      'rounded-xl border-2 p-4 text-left transition-all',
                      role === value
                        ? 'border-primary bg-primary/[0.04]'
                        : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <div
                      className={cn(
                        'mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl',
                        role === value ? 'bg-primary/10' : 'bg-gray-100',
                      )}
                    >
                      <Icon
                        className={cn('h-4.5 w-4.5 h-[18px] w-[18px]', role === value ? 'text-primary' : 'text-gray-500')}
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && <Spinner className="h-4 w-4" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
