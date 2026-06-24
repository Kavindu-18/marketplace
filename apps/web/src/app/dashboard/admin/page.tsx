'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { AdminPendingProvider, AdminPendingService } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

// ── Inline decision form ──────────────────────────────────────────────────
function DecisionForm({
  label, onApprove, onReject, loading,
}: {
  label: string;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (notes?: string) => Promise<void>;
  loading: boolean;
}) {
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);

  function start(m: 'approve' | 'reject') { setMode(m); setOpen(true); setNotes(''); }

  async function submit() {
    if (mode === 'approve') await onApprove(notes || undefined);
    else if (mode === 'reject') await onReject(notes || undefined);
    setOpen(false); setMode(null);
  }

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => start('approve')}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Approve {label}
        </button>
        <button
          onClick={() => start('reject')}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject {label}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gray-50 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700">
        {mode === 'approve' ? '✓ Approving' : '✗ Rejecting'} — optional notes
      </p>
      <textarea
        rows={2}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
        placeholder="Internal notes for the provider (optional)…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors disabled:opacity-60',
            mode === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600',
          )}
        >
          {loading && <Spinner className="h-3 w-3" />}
          Confirm {mode}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Provider queue ────────────────────────────────────────────────────────
function ProviderQueue() {
  const [providers, setProviders] = useState<AdminPendingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProviders(await api.get<AdminPendingProvider[]>('/admin/verification/providers')); }
    catch { setError('Failed to load provider queue.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, action: 'approve' | 'reject', notes?: string) {
    setActionLoading(id + action);
    try {
      await api.post(`/admin/verification/providers/${id}/${action}`, { notes });
      setProviders((ps) => ps.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Action failed');
    } finally { setActionLoading(null); }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-primary" /></div>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (providers.length === 0) return (
    <div className="rounded-2xl bg-gray-50 py-14 text-center">
      <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
      <p className="font-semibold text-gray-700">All caught up</p>
      <p className="mt-1 text-sm text-gray-400">No providers pending review right now.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {providers.map((prov) => (
        <div key={prov.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
              {prov.businessName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{prov.businessName}</p>
              <p className="text-sm text-gray-500">{prov.city}, {prov.district}</p>
              <p className="text-xs text-gray-400">{prov.user.email}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Pending
            </span>
          </div>

          {/* Documents */}
          {prov.documents.length > 0 && (
            <div className="rounded-xl bg-gray-50 p-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Documents</p>
              {prov.documents.map((doc) => {
                const cls = doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
                return (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-700">{doc.type.replace('_', ' ')}</span>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-1 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-semibold', cls)}>{doc.status}</span>
                  </div>
                );
              })}
            </div>
          )}

          <DecisionForm
            label="provider"
            loading={actionLoading === prov.id + 'approve' || actionLoading === prov.id + 'reject'}
            onApprove={(notes) => decide(prov.id, 'approve', notes)}
            onReject={(notes) => decide(prov.id, 'reject', notes)}
          />
        </div>
      ))}
    </div>
  );
}

// ── Service queue ─────────────────────────────────────────────────────────
function ServiceQueue() {
  const [services, setServices] = useState<AdminPendingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setServices(await api.get<AdminPendingService[]>('/admin/verification/services')); }
    catch { setError('Failed to load service queue.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function decide(id: string, action: 'approve' | 'reject', notes?: string) {
    setActionLoading(id + action);
    try {
      await api.post(`/admin/verification/services/${id}/${action}`, { notes });
      setServices((ss) => ss.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Action failed');
    } finally { setActionLoading(null); }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-primary" /></div>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (services.length === 0) return (
    <div className="rounded-2xl bg-gray-50 py-14 text-center">
      <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
      <p className="font-semibold text-gray-700">All caught up</p>
      <p className="mt-1 text-sm text-gray-400">No services pending review right now.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {services.map((svc) => (
        <div key={svc.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06] space-y-4">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{svc.title}</p>
              <p className="text-sm text-gray-500">{svc.providerProfile.businessName} · {svc.category.name}</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{svc.priceInfo}</p>
              <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">{svc.description}</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Pending
            </span>
          </div>
          <DecisionForm
            label="service"
            loading={actionLoading === svc.id + 'approve' || actionLoading === svc.id + 'reject'}
            onApprove={(notes) => decide(svc.id, 'approve', notes)}
            onReject={(notes) => decide(svc.id, 'reject', notes)}
          />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
type Tab = 'providers' | 'services';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('providers');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/dashboard/provider');
  }, [user, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Verification queue</h1>
        <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-2xl bg-gray-100 p-1 w-fit">
        {(['providers', 'services'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-xl px-5 py-2 text-sm font-semibold capitalize transition-all',
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Queue content */}
      <div>
        <div className="mb-4">
          <h2 className="font-bold text-gray-700 capitalize">Pending {tab}</h2>
        </div>
        {tab === 'providers' ? <ProviderQueue /> : <ServiceQueue />}
      </div>
    </div>
  );
}
