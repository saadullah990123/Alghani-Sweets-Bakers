import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSettings, saveSettings, getAdminByEmail, getAdminById } from '@/db/store';
import { verifyPassword, verifySessionToken } from '@/lib/auth';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Destructure confirmPassword out of the body so it is NEVER passed to
    // saveSettings() and therefore never written to the JSON store or logged
    // as part of settings. The remaining `settingsPayload` is a plain object
    // with no password field in it.
    const { confirmPassword, ...settingsPayload } = body;

    // --- Re-authentication gate ---
    // Any change to payment account details (EasyPaisa / JazzCash / bank)
    // must be confirmed with the currently logged-in admin's password.
    // This mirrors the same pattern used in POST /api/admin/profile.
    if (!confirmPassword) {
      return NextResponse.json(
        { error: 'Please enter your current admin password to confirm this change.' },
        { status: 403 }
      );
    }

    // Resolve the calling admin from the session token.
    const token = req.cookies.get('alghani_admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized or session expired' }, { status: 401 });
    }
    const admin =
      (await getAdminByEmail(session.email)) ||
      (session.adminId ? await getAdminById(session.adminId) : null);
    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    // Verify password against the stored bcrypt hash.
    const isValid = await verifyPassword(confirmPassword, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please try again.' },
        { status: 403 }
      );
    }

    // Password confirmed — now write only the settings payload (no password field).
    const updated = await saveSettings(settingsPayload);

    // Business info (phone/address/fees/advance %) is shown on the
    // homepage footer, support page, and the two settings-derived legal
    // pages — refresh all of them immediately instead of waiting on ISR.
    revalidatePath('/');
    revalidatePath('/support');
    revalidatePath('/legal/refund-policy');
    revalidatePath('/legal/shipping-policy');

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
