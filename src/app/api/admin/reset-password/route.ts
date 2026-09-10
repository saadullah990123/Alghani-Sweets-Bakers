import { NextRequest, NextResponse } from 'next/server';
import { consumePasswordResetToken } from '@/db/store';

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: 'Email, token, and new password are required' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const success = await consumePasswordResetToken(email, token, newPassword);
    if (!success) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password updated. You can now sign in.' });
  } catch (err) {
    console.error('Admin reset-password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
