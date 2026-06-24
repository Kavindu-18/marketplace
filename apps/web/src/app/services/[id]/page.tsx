'use client';

// TODO: backend needs public GET /services/:id endpoint added to ServicesController.
// Currently falls back to the authenticated endpoint.

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Phone, Mail, ArrowLeft, Eye, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import type { Service } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface ContactInfo { contactPhone: string; contactEmail: string; }

const GRADIENTS: [string, string][] = [
  ['#EEF2FF', '#C7D2FE'], ['#ECFDF5', '#A7F3D0'], ['#FFF7ED', '#FED7AA'],
  ['#FDF2F8', '#FBCFE8'], ['#EFF6FF', '#BFDBFE'], ['#F5F3FF', '#DDD6FE'],
];

function cardGradient(name: string): [string, string] {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Service>(`/services/${id}/public`)
      .catch(() => api.get<Service>(`/services/${id}`))
      .then(setService)
      .catch(() => setLoadError('Service not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function revealContact(channel: 'PHONE' | 'EMAIL') {
    setRevealLoading(true); setRevealError(null);
    try {
      setContact(await api.post<ContactInfo>(`/services/${id}/reveal-contact`, { channel }));
    } catch {
      setRevealError('Could not retrieve contact info. Please try again.');
    } finally { setRevealLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (loadError || !service) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <MapPin className="h-7 w-7 text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Service not found</h2>
        <p className="mt-2 text-sm text-gray-500">{loadError ?? 'This service may no longer be available.'}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    );
  }

  const prov = service.providerProfile;
  const [gradFrom, gradTo] = prov ? cardGradient(prov.businessName) : ['#EEF2FF', '#C7D2FE'];
  const initials = prov
    ? prov.businessName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '??';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* ── LEFT: service details ── */}
          <div className="space-y-5">

            {/* Hero card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
              {/* Colour band */}
              <div
                className="relative flex h-52 items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)` }}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/70 shadow-md backdrop-blur-sm">
                  <span className="text-2xl font-extrabold text-gray-700">{initials}</span>
                </div>
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                  {service.category.name}
                </span>
              </div>

              {/* Title block */}
              <div className="p-6">
                <h1 className="text-2xl font-extrabold text-gray-900">{service.title}</h1>
                {prov && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-base font-semibold text-gray-600">{prov.businessName}</span>
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {prov.city}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">About this service</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{service.description}</p>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">Pricing</h2>
              <p className="text-xl font-extrabold text-gray-900">{service.priceInfo}</p>
            </div>
          </div>

          {/* ── RIGHT: contact card (sticky on desktop) ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
              <h2 className="mb-1 text-base font-bold text-gray-900">Contact the provider</h2>
              <p className="mb-5 text-sm text-gray-500">
                {user
                  ? 'Tap below to reveal direct contact details.'
                  : 'No account needed — reveal contact info for free.'}
              </p>

              {contact ? (
                <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                  {contact.contactPhone && (
                    <a
                      href={`tel:${contact.contactPhone}`}
                      className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Phone className="h-4 w-4 shrink-0" />
                      {contact.contactPhone}
                    </a>
                  )}
                  {contact.contactEmail && (
                    <a
                      href={`mailto:${contact.contactEmail}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {contact.contactEmail}
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={() => revealContact('PHONE')}
                    disabled={revealLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {revealLoading ? <Spinner className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    Show phone number
                  </button>
                  <button
                    onClick={() => revealContact('EMAIL')}
                    disabled={revealLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                  >
                    {revealLoading ? <Spinner className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    Show email address
                  </button>
                </div>
              )}

              {revealError && (
                <p className="mt-3 text-sm text-red-600">{revealError}</p>
              )}

              <p className="mt-5 flex items-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                This provider has been verified by Marketplace SL.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
