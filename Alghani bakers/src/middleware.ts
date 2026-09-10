import { NextRequest, NextResponse } from 'next/server';

// This runs in the Edge Runtime, which does not support Node's `crypto` module —
// so session verification is re-implemented here with Web Crypto (crypto.subtle),
// using the exact same HMAC-SHA256 scheme as src/lib/auth.ts. Keep both in sync
// if the token format ever changes.

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || 'alghani_super_secure_session_key_2026_fallback_99';
const COOKIE_NAME = 'alghani_admin_token';

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return atob(base64);
}

async function signBase64Url(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const bytes = new Uint8Array(signatureBuffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifySessionTokenEdge(
  token: string
): Promise<{ adminId: string; email: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base64Payload, signature] = parts;

    const expectedSignature = await signBase64Url(base64Payload);
    if (expectedSignature !== signature) return null;

    const payload = JSON.parse(base64UrlDecode(base64Payload));
    if (!payload?.exp || payload.exp < Date.now()) return null;

    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}

const PUBLIC_ADMIN_PAGES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
const PUBLIC_ADMIN_API = [
  '/api/admin/login',
  '/api/admin/logout',
  '/api/admin/forgot-password',
  '/api/admin/reset-password',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith('/admin') && !PUBLIC_ADMIN_PAGES.includes(pathname);
  const isAdminApi = pathname.startsWith('/api/admin') && !PUBLIC_ADMIN_API.includes(pathname);

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionTokenEdge(token) : null;

  if (session) {
    return NextResponse.next();
  }

  // No valid session: for API routes, fail with 401 (never redirect an API call).
  if (isAdminApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // For pages, send them back to login. If a token was present but invalid/expired,
  // clear it and flag it so the login page can show a clean "session expired"
  // message instead of silently bouncing — and so we never loop back into a page
  // that immediately redirects again.
  const loginUrl = new URL('/admin/login', req.url);
  if (token) {
    loginUrl.searchParams.set('expired', '1');
  }
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete(COOKIE_NAME);
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
