import { NextResponse } from 'next/server';
import { getSettings } from '@/db/store';

// Public route to fetch store settings (business info, tax, delivery fee, payment account details)
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error('API /api/settings GET error:', err);
    return NextResponse.json({ error: 'Failed to load store settings' }, { status: 500 });
  }
}
