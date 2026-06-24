'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  MapPin, Search, Navigation, Sparkles, SlidersHorizontal,
  ShieldCheck, Zap, Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Category, SearchServiceResult, SearchResponse } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// ── avatar gradient pool ──────────────────────────────────────────────────
const GRADIENTS: [string, string][] = [
  ['#EEF2FF', '#C7D2FE'],
  ['#ECFDF5', '#A7F3D0'],
  ['#FFF7ED', '#FED7AA'],
  ['#FDF2F8', '#FBCFE8'],
  ['#EFF6FF', '#BFDBFE'],
  ['#F5F3FF', '#DDD6FE'],
  ['#ECFEFF', '#A5F3FC'],
  ['#FEFCE8', '#FEF08A'],
];

function cardGradient(name: string): [string, string] {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

function toInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ── Fresha-style service card ─────────────────────────────────────────────
function ServiceCard({ svc, delay = 0 }: { svc: SearchServiceResult; delay?: number }) {
  const [from, to] = cardGradient(svc.providerProfile.businessName);
  const init = toInitials(svc.providerProfile.businessName);
  const km = svc.distance_km;
  const distLabel = km < 1 ? `${Math.round(svc.distance_m)} m` : `${km.toFixed(1)} km`;
  const distCls =
    km < 5
      ? 'bg-emerald-100 text-emerald-700'
      : km < 25
      ? 'bg-blue-100 text-blue-700'
      : 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/services/${svc.id}`} style={{ animationDelay: `${delay}ms` }}>
      <article className="animate-fade-up group overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-black/10">
        {/* Colour avatar area */}
        <div
          className="relative flex h-44 items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur-sm">
            <span className="text-xl font-extrabold text-gray-700">{init}</span>
          </div>

          {/* Category chip */}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
            {svc.category.name}
          </span>

          {/* Distance chip */}
          <span className={cn('absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm', distCls)}>
            {distLabel}
          </span>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-gray-900 transition-colors group-hover:text-primary">
            {svc.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">
            {svc.providerProfile.businessName}
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3 shrink-0" />
            {svc.providerProfile.city}
            {svc.providerProfile.district ? `, ${svc.providerProfile.district}` : ''}
          </div>
          {svc.priceInfo && (
            <p className="mt-3 border-t border-gray-50 pt-3 text-sm font-bold text-gray-900">
              {svc.priceInfo}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

// ── empty / pre-search state ──────────────────────────────────────────────
function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Sparkles className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-gray-500">{body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locLabel, setLocLabel] = useState('');
  const [radiusKm, setRadiusKm] = useState('25');
  const [categoryId, setCategoryId] = useState('');
  const [vertical, setVertical] = useState('');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<SearchServiceResult[]>([]);
  const [meta, setMeta] = useState<SearchResponse['meta'] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocLabel('Current location');
        setGeoLoading(false);
      },
      () => { setGeoLoading(false); setError('Location access denied — please allow location in your browser.'); },
    );
  }

  const doSearch = useCallback(
    async (p = 1) => {
      if (!lat || !lng) { setError('Set your location first.'); return; }
      setError(null);
      setSearching(true);
      try {
        const params = new URLSearchParams({ lat, lng, radiusKm, page: String(p), limit: '18' });
        if (categoryId) params.set('categoryId', categoryId);
        if (vertical) params.set('vertical', vertical);
        if (text.trim()) params.set('text', text.trim());
        const res = await api.get<SearchResponse>(`/search/services?${params}`);
        setResults(res.data);
        setMeta(res.meta);
        setPage(p);
        setSearched(true);
        if (p === 1) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        setError('Search failed — please try again.');
      } finally {
        setSearching(false);
      }
    },
    [lat, lng, radiusKm, categoryId, vertical, text],
  );

  function quickCategory(id: string) {
    const next = categoryId === id ? '' : id;
    setCategoryId(next);
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-20 sm:pt-20"
        style={{ background: 'linear-gradient(155deg,#EEF2FF 0%,#F0F9FF 55%,#FFFFFF 100%)' }}
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -right-48 -top-48 h-[520px] w-[520px] rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(191,219,254,0.55) 0%,transparent 68%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-[360px] w-[360px] rounded-full"
          style={{ background: 'radial-gradient(circle,rgba(221,214,254,0.4) 0%,transparent 68%)' }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Pill badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sri Lanka&apos;s verified services marketplace
          </span>

          {/* Headline */}
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
            Find trusted services
            <br />
            <span className="text-primary">near you</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            Browse verified local providers, ranked by distance. Free to search — no account needed.
          </p>

          {/* ── Search bar ── */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] ring-1 ring-black/[0.07]">
              {/* Location */}
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading}
                className="flex shrink-0 items-center gap-2.5 border-r border-gray-100 px-4 py-4 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                {geoLoading ? (
                  <Spinner className="h-5 w-5 text-primary" />
                ) : (
                  <Navigation className={cn('h-5 w-5', locLabel ? 'text-primary' : 'text-gray-400')} />
                )}
                <div className="hidden sm:block">
                  <p className="text-[0.68rem] font-medium uppercase tracking-wide text-gray-400">Near</p>
                  <p className={cn('text-sm font-semibold', locLabel ? 'text-gray-900' : 'text-gray-400')}>
                    {locLabel || 'Set location'}
                  </p>
                </div>
              </button>

              {/* Text search */}
              <div className="flex flex-1 items-center gap-2.5 px-4">
                <Search className="h-4 w-4 shrink-0 text-gray-300" />
                <input
                  className="flex-1 bg-transparent py-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                  placeholder="What are you looking for?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doSearch(1)}
                />
              </div>

              {/* Search button */}
              <button
                type="button"
                onClick={() => doSearch(1)}
                disabled={searching}
                className="shrink-0 bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                {searching ? <Spinner className="h-4 w-4" /> : 'Search'}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-left text-sm text-red-600">
                {error}
              </p>
            )}

          </div>

          {/* ── Quick-pick category pills ── */}
          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {categories.slice(0, 7).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => quickCategory(c.id)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                    categoryId === c.id
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 shadow-sm hover:border-primary/50 hover:text-primary',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FILTERS + RESULTS
      ══════════════════════════════════════════════════════════ */}
      <section id="search" className="mx-auto max-w-6xl px-4 py-10 sm:px-6" ref={resultsRef}>

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              showFilters
                ? 'border-primary bg-primary/8 text-primary'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>

          {showFilters && (
            <>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary/50"
              >
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
              </select>

              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary/50"
              >
                <option value="">All types</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="VEHICLE_SERVICE">Vehicle service</option>
              </select>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-primary/50"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </>
          )}

          {meta && (
            <p className="ml-auto text-sm text-gray-400">
              <span className="font-semibold text-gray-900">{meta.total}</span>{' '}
              {meta.total === 1 ? 'service' : 'services'} found
            </p>
          )}
        </div>

        {/* Results */}
        {!searched ? (
          <EmptyState
            title="Search for services near you"
            body="Enter your location above to discover verified providers in your area."
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No services found"
            body="Try a larger radius or different category filters."
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((svc, i) => (
                <ServiceCard key={svc.id} svc={svc} delay={i * 40} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  disabled={page === 1 || searching}
                  onClick={() => doSearch(page - 1)}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  disabled={page === meta.totalPages || searching}
                  onClick={() => doSearch(page + 1)}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gray-50 px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-100', title: 'Verified providers', body: 'Every listing passes document review before appearing in results.' },
            { icon: MapPin, color: 'text-blue-600 bg-blue-100', title: 'Ranked by distance', body: 'Results always sorted nearest-first — not by who paid most.' },
            { icon: Zap, color: 'text-violet-600 bg-violet-100', title: 'Free to search', body: 'Browse, filter, and reveal contact info — no subscription needed.' },
          ].map(({ icon: Icon, color, title, body }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">How it works</h2>
            <p className="mt-3 text-gray-500">Three steps to find and contact a local provider.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { n: '01', color: 'bg-blue-100 text-blue-700', title: 'Set your location', body: 'Tap "Set location" or enter coordinates. Your position is only used to rank results — never stored.' },
              { n: '02', color: 'bg-emerald-100 text-emerald-700', title: 'Browse verified providers', body: 'Filter by category, radius, and keyword. Every result has passed document verification.' },
              { n: '03', color: 'bg-violet-100 text-violet-700', title: 'Reveal contact & call', body: 'Tap "Show phone" or "Show email" to get the provider\'s direct contact. No booking fee.' },
            ].map(({ n, color, title, body }) => (
              <div key={n} className="rounded-2xl bg-gray-50 p-6 ring-1 ring-black/[0.04]">
                <span className={cn('inline-flex rounded-xl px-3 py-1 font-mono text-xs font-bold', color)}>
                  {n}
                </span>
                <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/about"
              className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              Learn more
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Get started free →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════════ */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-primary px-8 py-12 text-center shadow-xl">
          <Star className="mx-auto mb-4 h-8 w-8 text-white/30" />
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Are you a service provider?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-white/70">
            List your business free in Phase 1. Get discovered by customers already in your area.
          </p>
          <Link
            href="/auth/register"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-primary transition-opacity hover:opacity-90"
          >
            Register as a provider →
          </Link>
        </div>
      </section>

    </div>
  );
}
