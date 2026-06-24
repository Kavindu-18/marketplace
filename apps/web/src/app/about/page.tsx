import Link from 'next/link';
import { ShieldCheck, MapPin, Zap, Globe, Lock, HeartHandshake, Search, Phone, ClipboardCheck, TrendingUp, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section
        className="overflow-hidden px-4 pb-20 pt-16 sm:pb-28 sm:pt-24"
        style={{ background: 'linear-gradient(155deg,#EEF2FF 0%,#F0F9FF 55%,#FFFFFF 100%)' }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            Our story
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem]">
            We connect people with
            <br />
            <span className="text-primary">trusted local work</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
            Marketplace is Sri Lanka&apos;s first location-aware services directory built around
            verification, not just listing. Every provider you find has passed a document check — so
            you spend less time guessing and more time getting things done.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/#search"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              Search services
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              Register as a provider
            </Link>
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-gray-50 px-4 py-12">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: 'All 25', label: 'Districts covered' },
            { value: '100%',   label: 'Free to search' },
            { value: '2-step', label: 'Provider verification' },
            { value: 'Phase 1', label: 'Launching now' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.05]">
              <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{value}</p>
              <p className="mt-1 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS — CUSTOMERS ══════════════════════════════ */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
            For customers
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
            Finding help has never been simpler
          </h2>
          <p className="mt-3 max-w-lg text-gray-500">
            No account needed to search. No subscriptions. Just open the site, share your location,
            and see verified providers near you in seconds.
          </p>

          <div className="mt-10 space-y-0">
            {[
              { icon: MapPin,       n: '01', title: 'Share your location',       body: 'Tap "Use my location" on the homepage or type in your coordinates. We never store your location — it\'s only used to rank results by distance.' },
              { icon: Search,      n: '02', title: 'Browse results by distance', body: 'Services are sorted nearest-first. Filter by category, service type, and keyword to narrow down instantly.' },
              { icon: ShieldCheck, n: '03', title: 'Trust the verified badge',   body: 'The "Verified" badge means our admin team has reviewed the provider\'s business registration or NIC before they appear in results.' },
              { icon: Phone,       n: '04', title: 'Reveal contact & call',      body: 'Tap "Show phone number" or "Show email". No booking system, no chatbot — just a direct line to the person who can help.' },
            ].map(({ icon: Icon, n, title, body }, i, arr) => (
              <div key={n} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  {i < arr.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                </div>
                <div className="pb-8">
                  <span className="font-mono text-xs font-bold text-gray-400">{n}</span>
                  <p className="mt-0.5 font-bold text-gray-900">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS — PROVIDERS ══════════════════════════════ */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
            For providers
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
            Grow your business with verified leads
          </h2>
          <p className="mt-3 max-w-lg text-gray-500">
            Listing is free in Phase 1. Get discovered by customers already in your area and looking
            for exactly what you offer.
          </p>

          <div className="mt-10 space-y-0">
            {[
              { icon: ClipboardCheck, n: '01', title: 'Create a provider account', body: 'Register with your email and choose the "Provider" role. Takes under 60 seconds.' },
              { icon: Users,          n: '02', title: 'Complete your business profile', body: 'Add your business name, description, address, and set your location so customers nearby can find you.' },
              { icon: ShieldCheck,    n: '03', title: 'Upload verification documents', body: 'Submit your business registration certificate or NIC. Our team reviews within 24–48 hours.' },
              { icon: TrendingUp,     n: '04', title: 'List services & go live', body: 'Once verified, create listings (title, description, pricing) and submit each for review to go live in search results.' },
            ].map(({ icon: Icon, n, title, body }, i, arr) => (
              <div key={n} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  {i < arr.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                </div>
                <div className="pb-8">
                  <span className="font-mono text-xs font-bold text-gray-400">{n}</span>
                  <p className="mt-0.5 font-bold text-gray-900">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/auth/register"
            className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Register as a provider →
          </Link>
        </div>
      </section>

      {/* ══ VALUES ════════════════════════════════════════════════ */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Built on trust, not hype</h2>
            <p className="mt-3 text-gray-500">The six principles that guide every product decision we make.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShieldCheck,    color: 'bg-emerald-100 text-emerald-600', title: 'Verified by default',  body: 'No unreviewed provider ever appears in search. Every listing passes at least one document check.' },
              { icon: MapPin,         color: 'bg-blue-100 text-blue-600',       title: 'Hyperlocal first',     body: 'Distance is the primary sort. The best provider is often the one closest to you.' },
              { icon: Zap,            color: 'bg-amber-100 text-amber-600',     title: 'Zero friction',        body: 'No mandatory sign-up to search, no booking fee, no commission on first contact.' },
              { icon: Globe,          color: 'bg-violet-100 text-violet-600',   title: 'Sri Lanka-first',      body: 'Built for local conditions — Sinhala, Tamil, and English providers; LKR pricing.' },
              { icon: Lock,           color: 'bg-pink-100 text-pink-600',       title: 'Privacy by design',    body: 'Location is used only for proximity search and never stored anywhere.' },
              { icon: HeartHandshake, color: 'bg-cyan-100 text-cyan-600',       title: 'Community driven',     body: 'Providers self-manage listings. Customers get direct contact. No intermediary cut.' },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="rounded-2xl bg-gray-50 p-5 ring-1 ring-black/[0.04]">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-bold text-gray-900">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIAL ═══════════════════════════════════════════ */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <span className="text-xl">⭐</span>
          </div>
          <blockquote className="text-xl font-extrabold italic leading-snug text-white sm:text-2xl">
            &ldquo;I found a verified electrician three kilometres away in under two minutes. That&apos;s the product.&rdquo;
          </blockquote>
          <p className="mt-5 text-sm font-semibold text-white/60">— Beta tester, Colombo</p>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Ready to get started?
          </h2>
          <p className="mt-3 text-gray-500">Search is always free. No account required to browse.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/#search"
              className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              Search now
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
