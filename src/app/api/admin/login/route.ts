import { NextRequest, NextResponse } from 'next/server';
import { getAdminByEmail } from '@/db/store';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';

// Finding 10-A: brute-force protection. 5 attempts per 15 minutes per IP —
// generous enough that a real admin who fat-fingers their password a couple
// of times is never locked out, but bounds how many passwords a single
// attacker can try against any account.
const LOGIN_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rate = checkRateLimit(`admin-login:${clientId}`, LOGIN_RATE_LIMIT);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds!);
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const admin = await getAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate HMAC session token
    const token = createSessionToken(admin.id, admin.email);

    const res = NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });

    // Set secure cookie
    res.cookies.set('alghani_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
