'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    logout();
    router.push('/');
  }

  const dashboardHref =
    user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/provider';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-black tracking-tight text-gray-900 transition-opacity hover:opacity-70"
        >
          Marketplace<span className="text-primary">.</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            href="/about"
            className={cn(
              'hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-gray-900 sm:block',
              pathname === '/about' ? 'text-gray-900' : 'text-gray-500',
            )}
          >
            About
          </Link>

          {loading ? (
            <Spinner className="mx-2 h-4 w-4 text-gray-300" />
          ) : user ? (
            <>
              {(user.role === 'PROVIDER' || user.role === 'ADMIN') && (
                <Link
                  href={dashboardHref}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith('/dashboard')
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-gray-900',
                  )}
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="ml-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Sign up free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
