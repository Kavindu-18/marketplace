import Link from 'next/link';

const COLS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Search services', href: '/#search' },
      { label: 'About us', href: '/about' },
    ],
  },
  {
    heading: 'Providers',
    links: [
      { label: 'Register free', href: '/auth/register' },
      { label: 'Provider dashboard', href: '/dashboard/provider' },
    ],
  },
  {
    heading: 'Info',
    links: [
      { label: 'Privacy policy', href: '#' },
      { label: 'Terms of service', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="text-base font-black tracking-tight text-gray-900 transition-opacity hover:opacity-70"
            >
              Marketplace<span className="text-primary">.</span>
            </Link>
            <p className="mt-3 max-w-[20ch] text-sm leading-relaxed text-gray-400">
              Sri Lanka&apos;s verified local services directory.
            </p>
          </div>

          {COLS.map(({ heading, links }) => (
            <nav key={heading}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                {heading}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-gray-100 pt-8 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Marketplace SL · Phase 1 · Free to use
          </p>
          <p className="text-xs text-gray-400">Built for Sri Lanka 🇱🇰</p>
        </div>
      </div>
    </footer>
  );
}
