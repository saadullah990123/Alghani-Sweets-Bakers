import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getHeroSlides, saveHeroSlides } from '@/db/store';

export async function GET() {
  const slides = await getHeroSlides();
  return NextResponse.json(slides);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slides = await saveHeroSlides(body);
    revalidatePath('/');
    return NextResponse.json(slides);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update slides' }, { status: 500 });
  }
}
