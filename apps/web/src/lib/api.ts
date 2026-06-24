const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

// In-memory access token — set by auth context on login/refresh, null on logout/expiry
let _at: string | null = null;

export function setAccessToken(t: string | null) {
  _at = t;
}

export function storeRefreshToken(rt: string) {
  if (typeof window !== 'undefined') localStorage.setItem('rt', rt);
}

export function loadRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rt');
}

export function clearStoredTokens() {
  _at = null;
  if (typeof window !== 'undefined') localStorage.removeItem('rt');
}

export function persistTokens(at: string, rt: string) {
  setAccessToken(at);
  storeRefreshToken(rt);
}

async function doRefresh(): Promise<boolean> {
  const rt = loadRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) {
      clearStoredTokens();
      return false;
    }
    const { accessToken, refreshToken } = await res.json();
    persistTokens(accessToken, refreshToken);
    return true;
  } catch {
    clearStoredTokens();
    return false;
  }
}

async function req<T>(path: string, init: RequestInit = {}, _retry = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (_at) headers['Authorization'] = `Bearer ${_at}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && _retry) {
    const ok = await doRefresh();
    if (ok) return req<T>(path, init, false);
    clearStoredTokens();
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:expired'));
    throw Object.assign(new Error('Session expired'), { statusCode: 401 });
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as T;
}

export const api = {
  get: <T>(path: string) => req<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    req<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    req<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T = void>(path: string) => req<T>(path, { method: 'DELETE' }),
};
