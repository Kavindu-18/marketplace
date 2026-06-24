'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Pencil, Trash2, SendHorizontal, FileText, CheckCircle, Circle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { ProviderProfile, Service, Category, VerificationDocument } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// ── Status helpers ────────────────────────────────────────────────────────
type ProvStatus = ProviderProfile['status'];
type SvcStatus = Service['status'];

const PROV_BADGE: Record<ProvStatus, { label: string; cls: string }> = {
  REGISTERED:           { label: 'Registered',    cls: 'bg-blue-100 text-blue-700' },
  PENDING_VERIFICATION: { label: 'Under review',  cls: 'bg-amber-100 text-amber-700' },
  VERIFIED:             { label: 'Verified',       cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED:             { label: 'Rejected',       cls: 'bg-red-100 text-red-700' },
};

const SVC_BADGE: Record<SvcStatus, { label: string; cls: string }> = {
  DRAFT:                { label: 'Draft',         cls: 'bg-gray-100 text-gray-600' },
  PENDING_VERIFICATION: { label: 'Under review',  cls: 'bg-amber-100 text-amber-700' },
  ACTIVE:               { label: 'Active',        cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED:             { label: 'Rejected',      cls: 'bg-red-100 text-red-700' },
};

function StatusBadge({ cls, label }: { cls: string; label: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', cls)}>{label}</span>
  );
}

// ── Onboarding stepper ────────────────────────────────────────────────────
function Stepper({ profile }: { profile: ProviderProfile | null }) {
  const steps = [
    { label: 'Create account',    done: true },
    { label: 'Complete profile',  done: !!profile },
    { label: 'Upload documents',  done: (profile?.documents?.length ?? 0) > 0 },
    { label: 'Get verified',      done: profile?.status === 'VERIFIED' },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                s.done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400',
              )}
            >
              {s.done ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </div>
            <p className={cn('mt-1.5 text-center text-[0.65rem] font-medium leading-tight', s.done ? 'text-primary' : 'text-gray-400')}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('mb-5 h-0.5 flex-1', steps[i + 1].done ? 'bg-primary' : 'bg-gray-200')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Profile form ──────────────────────────────────────────────────────────
function ProfileForm({ initial, onSaved }: { initial?: ProviderProfile; onSaved: (p: ProviderProfile) => void }) {
  const [form, setForm] = useState({
    businessName: initial?.businessName ?? '',
    description: initial?.description ?? '',
    contactPhone: initial?.contactPhone ?? '',
    contactEmail: initial?.contactEmail ?? '',
    addressLine: initial?.addressLine ?? '',
    city: initial?.city ?? '',
    district: initial?.district ?? '',
    lat: '', lng: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  function f(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({ ...p, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const body: Record<string, unknown> = {
        businessName: form.businessName, description: form.description,
        contactPhone: form.contactPhone, contactEmail: form.contactEmail,
        addressLine: form.addressLine, city: form.city, district: form.district,
      };
      if (form.lat && form.lng) { body.lat = parseFloat(form.lat); body.lng = parseFloat(form.lng); }
      const saved = await (initial
        ? api.patch<ProviderProfile>('/providers/profile', body)
        : api.post<ProviderProfile>('/providers/profile', body));
      onSaved(saved);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to save profile';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally { setLoading(false); }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10';
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls}>Business name</label>
          <input required className={inputCls} placeholder="e.g. Silva Legal Services" {...f('businessName')} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea required rows={3} className={inputCls + ' resize-none'} placeholder="Describe your services…" {...f('description')} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input required className={inputCls} placeholder="+94 77 000 0000" {...f('contactPhone')} />
        </div>
        <div>
          <label className={labelCls}>Business email</label>
          <input type="email" required className={inputCls} placeholder="business@example.com" {...f('contactEmail')} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Address</label>
          <input required className={inputCls} placeholder="123 Main St, Colombo 03" {...f('addressLine')} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <input required className={inputCls} placeholder="Colombo" {...f('city')} />
        </div>
        <div>
          <label className={labelCls}>District</label>
          <input required className={inputCls} placeholder="Colombo" {...f('district')} />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <label className={labelCls}>Business coordinates</label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoLoading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {geoLoading ? <Spinner className="h-4 w-4 text-primary" /> : '📍'}
            Use my current location
          </button>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls + ' font-mono'} placeholder="Latitude" {...f('lat')} />
            <input className={inputCls + ' font-mono'} placeholder="Longitude" {...f('lng')} />
          </div>
          <p className="text-xs text-gray-400">Leave blank to keep existing coordinates.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {loading && <Spinner className="h-4 w-4" />}
        {initial ? 'Save changes' : 'Create profile'}
      </button>
    </form>
  );
}

// ── Document upload form ──────────────────────────────────────────────────
function DocumentUploadForm({ onUploaded }: { onUploaded: (doc: VerificationDocument) => void }) {
  const [docType, setDocType] = useState<'BUSINESS_REG' | 'NIC' | 'OTHER'>('BUSINESS_REG');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl.startsWith('http')) { setError('Enter a valid URL (starting with https://).'); return; }
    setError(null); setLoading(true);
    try {
      const doc = await api.post<VerificationDocument>('/providers/documents', { type: docType, fileUrl });
      onUploaded(doc);
      setFileUrl('');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Upload failed');
    } finally { setLoading(false); }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10';

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl bg-gray-50 p-4">
      <p className="mb-3 text-sm font-semibold text-gray-700">Add a document</p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as typeof docType)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-primary/60 sm:w-52"
        >
          <option value="BUSINESS_REG">Business registration</option>
          <option value="NIC">NIC</option>
          <option value="OTHER">Other</option>
        </select>
        <input
          type="url"
          className={inputCls + ' flex-1'}
          placeholder="https://drive.google.com/…"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? <Spinner className="h-4 w-4" /> : 'Submit'}
        </button>
      </div>
    </form>
  );
}

// ── Service form ──────────────────────────────────────────────────────────
function ServiceForm({ categories, initial, onSaved, onCancel }: {
  categories: Category[]; initial?: Service;
  onSaved: (svc: Service) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    categoryId: initial?.category.id ?? categories[0]?.id ?? '',
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    priceInfo: initial?.priceInfo ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function f(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((p) => ({ ...p, [key]: e.target.value })),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const saved = await (initial
        ? api.patch<Service>(`/services/${initial.id}`, form)
        : api.post<Service>('/services', form));
      onSaved(saved);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to save';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally { setLoading(false); }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10';
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div>
        <label className={labelCls}>Category</label>
        <select className={inputCls} {...f('categoryId')}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Service title</label>
        <input required className={inputCls} placeholder="e.g. Contract drafting consultation" {...f('title')} />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea required rows={3} className={inputCls + ' resize-none'} placeholder="Describe what this service includes…" {...f('description')} />
      </div>
      <div>
        <label className={labelCls}>Pricing info</label>
        <input required className={inputCls} placeholder="e.g. From Rs. 2,500 per session" {...f('priceInfo')} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
          {loading && <Spinner className="h-4 w-4" />}
          {initial ? 'Save changes' : 'Create service'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | 'new' | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'PROVIDER') router.replace('/dashboard/admin');
  }, [user, router]);

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try { setServices(await api.get<Service[]>('/services')); }
    catch { /**/ }
    finally { setServicesLoading(false); }
  }, []);

  useEffect(() => {
    api.get<ProviderProfile>('/providers/profile')
      .then((p) => {
        setProfile(p);
        if (p.status === 'VERIFIED') {
          loadServices();
          api.get<Category[]>('/categories').then(setCategories).catch(() => {});
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [loadServices]);

  async function doServiceAction(id: string, action: 'submit' | 'delete') {
    setActionLoading(id + action); setActionError(null);
    try {
      if (action === 'submit') await api.post(`/services/${id}/submit`);
      else await api.delete(`/services/${id}`);
      await loadServices();
    } catch (err: unknown) {
      setActionError((err as { message?: string })?.message ?? 'Action failed');
    } finally { setActionLoading(null); }
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const provBadge = profile ? PROV_BADGE[profile.status] : null;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Provider dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* ── Onboarding stepper ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.06]">
        <p className="mb-5 text-sm font-semibold text-gray-700">Your verification progress</p>
        <Stepper profile={profile} />
      </div>

      {/* ── Profile card ── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-gray-900">Business profile</h2>
          {profile && !editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>

        <div className="p-6">
          {!profile || editingProfile ? (
            <ProfileForm
              initial={profile ?? undefined}
              onSaved={(p) => {
                setProfile(p);
                setEditingProfile(false);
                if (p.status === 'VERIFIED') {
                  loadServices();
                  api.get<Category[]>('/categories').then(setCategories).catch(() => {});
                }
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-extrabold text-primary">
                  {profile.businessName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{profile.businessName}</p>
                  {provBadge && <StatusBadge {...provBadge} />}
                </div>
              </div>

              {profile.status === 'PENDING_VERIFICATION' && (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Your profile is under review. Services can be listed once verified.
                </div>
              )}
              {profile.status === 'REJECTED' && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  Your profile was rejected. Update your details and re-upload documents, then contact support.
                </div>
              )}
              {profile.status === 'REGISTERED' && (
                <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Upload at least one verification document to submit for review.
                </div>
              )}

              <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <span className="text-gray-400">Phone</span><span className="font-medium text-gray-900">{profile.contactPhone}</span>
                <span className="text-gray-400">Email</span><span className="font-medium text-gray-900">{profile.contactEmail}</span>
                <span className="text-gray-400">Address</span><span className="font-medium text-gray-900">{profile.addressLine}, {profile.city}, {profile.district}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Documents card ── */}
      {profile && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-gray-900">Verification documents</h2>
            <p className="mt-0.5 text-xs text-gray-400">Submit your business registration certificate or NIC to unlock listing.</p>
          </div>
          <div className="p-6">
            {profile.documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded yet.</p>
            ) : (
              <div className="mb-4 space-y-2">
                {profile.documents.map((doc) => {
                  const dBadge = doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                  return (
                    <div key={doc.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {doc.type.replace('_', ' ')}
                      </div>
                      <div className="flex items-center gap-3">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">
                          View
                        </a>
                        <StatusBadge cls={dBadge} label={doc.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <DocumentUploadForm onUploaded={(doc) => setProfile((p) => p ? { ...p, documents: [...p.documents, doc] } : p)} />
          </div>
        </div>
      )}

      {/* ── Services card (VERIFIED only) ── */}
      {profile?.status === 'VERIFIED' && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-gray-900">Services</h2>
            {editingService === null && (
              <button
                onClick={() => setEditingService('new')}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add service
              </button>
            )}
          </div>

          <div className="p-6 space-y-4">
            {/* New / edit form */}
            {editingService === 'new' && (
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="mb-4 text-sm font-bold text-gray-800">New service</p>
                <ServiceForm
                  categories={categories}
                  onSaved={(svc) => { setServices((s) => [...s, svc]); setEditingService(null); }}
                  onCancel={() => setEditingService(null)}
                />
              </div>
            )}
            {editingService && editingService !== 'new' && (
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="mb-4 text-sm font-bold text-gray-800">Edit service</p>
                <ServiceForm
                  categories={categories}
                  initial={editingService}
                  onSaved={(updated) => { setServices((s) => s.map((x) => x.id === updated.id ? updated : x)); setEditingService(null); }}
                  onCancel={() => setEditingService(null)}
                />
              </div>
            )}

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}

            {servicesLoading ? (
              <div className="flex justify-center py-8"><Spinner className="h-6 w-6 text-primary" /></div>
            ) : services.length === 0 ? (
              <div className="rounded-xl bg-gray-50 py-10 text-center">
                <p className="text-sm font-medium text-gray-500">No services yet.</p>
                <p className="mt-1 text-xs text-gray-400">Add your first service using the button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((svc) => {
                  const sb = SVC_BADGE[svc.status];
                  return (
                    <div key={svc.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="flex-1 space-y-0.5">
                          <p className="font-semibold text-gray-900">{svc.title}</p>
                          <p className="text-sm text-gray-500">{svc.priceInfo}</p>
                          <p className="text-xs text-gray-400">{svc.category.name}</p>
                        </div>
                        <StatusBadge {...sb} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(svc.status === 'DRAFT' || svc.status === 'REJECTED') && (
                          <>
                            <button
                              onClick={() => setEditingService(svc)}
                              disabled={!!editingService}
                              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Pencil className="h-3 w-3" />Edit
                            </button>
                            <button
                              onClick={() => doServiceAction(svc.id, 'submit')}
                              disabled={actionLoading === svc.id + 'submit'}
                              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                            >
                              {actionLoading === svc.id + 'submit' ? <Spinner className="h-3 w-3" /> : <SendHorizontal className="h-3 w-3" />}
                              Submit for review
                            </button>
                          </>
                        )}
                        {svc.status === 'DRAFT' && (
                          <button
                            onClick={() => doServiceAction(svc.id, 'delete')}
                            disabled={actionLoading === svc.id + 'delete'}
                            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                          >
                            {actionLoading === svc.id + 'delete' ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
