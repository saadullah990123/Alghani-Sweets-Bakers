import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSettings, saveSettings } from '@/db/store';

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await saveSettings(body);
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
