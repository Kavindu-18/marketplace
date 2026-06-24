'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const initials = user.email.slice(0, 2).toUpperCase();

  const navItems = isAdmin
    ? [{ href: '/dashboard/admin', label: 'Verification queue', icon: ShieldCheck }]
    : [{ href: '/dashboard/provider', label: 'Overview', icon: LayoutDashboard }];

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white sm:flex">
        {/* Label */}
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">
            {isAdmin ? 'Admin console' : 'Provider portal'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">{user.email}</p>
              <p className="text-[0.65rem] capitalize text-gray-400">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
