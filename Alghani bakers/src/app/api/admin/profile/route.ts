import { NextRequest, NextResponse } from 'next/server';
import { getAdminByEmail, getAdminById, updateAdminCredentials } from '@/db/store';
import { verifyPassword, createSessionToken, verifySessionToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('alghani_admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
    }

    const admin = await getAdminByEmail(session.email) || (session.adminId ? await getAdminById(session.adminId) : null);
    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (err: any) {
    console.error('API /api/admin/profile GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('alghani_admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
    }

    const admin = await getAdminByEmail(session.email) || (session.adminId ? await getAdminById(session.adminId) : null);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await req.json();
    const { currentPassword, newEmail, newName, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Please enter your current password to authorize changes.' },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Incorrect current password. Please try again.' },
        { status: 400 }
      );
    }

    // Validate new password if provided
    if (newPassword && newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (newEmail && !newEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Perform the update
    const updated = await updateAdminCredentials(admin.id, {
      email: newEmail ? newEmail.trim() : undefined,
      name: newName ? newName.trim() : undefined,
      newPasswordPlain: newPassword ? newPassword.trim() : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update credentials. Admin not found.' },
        { status: 500 }
      );
    }

    // Issue updated session token
    const newToken = createSessionToken(updated.id, updated.email);
    const res = NextResponse.json({
      success: true,
      message: 'Admin credentials updated successfully!',
      admin: updated,
    });

    res.cookies.set('alghani_admin_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error('API /api/admin/profile POST error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to update credentials' },
      { status: 500 }
    );
  }
}
