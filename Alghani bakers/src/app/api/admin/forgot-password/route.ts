import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken, getAdminByEmail } from '@/db/store';
import { getSettings } from '@/db/store';
import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/rateLimit';

// Finding 10-A: prevents this endpoint being used to spam an inbox with
// reset emails (or exhaust the configured SMTP account's send quota).
// 3 requests per hour per IP is generous for a legitimate forgetful admin
// while meaningfully bounding abuse.
const FORGOT_PASSWORD_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 3 };

async function sendResetEmail(email: string, resetUrl: string, businessName: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured in this environment. We log the link server-side
    // so a developer/operator can still recover access during setup, but we
    // never return it in the API response — see note below.
    console.log(`[admin-reset] SMTP not configured. Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"${businessName}" <${SMTP_USER}>`,
    to: email,
    subject: `Reset your ${businessName} admin password`,
    text: `We received a request to reset your admin password.\n\nReset it here (valid 1 hour): ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
  });
}

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const rate = checkRateLimit(`admin-forgot-password:${clientId}`, FORGOT_PASSWORD_RATE_LIMIT);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds!);
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const admin = await getAdminByEmail(email);
    const settings = await getSettings();

    // Always respond with the same generic success message whether or not
    // the email exists — this prevents the endpoint being used to discover
    // valid admin email addresses.
    if (admin) {
      const token = await createPasswordResetToken(email);
      if (token) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
        const resetUrl = `${baseUrl}/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        await sendResetEmail(email, resetUrl, settings.businessName);
      }
    } else {
      console.log(`[admin-reset] Password reset requested for unknown email: ${email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('Admin forgot-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
