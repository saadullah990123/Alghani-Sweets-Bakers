import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { uploadToSupabase } from '@/lib/supabaseStorage';

// -----------------------------------------------------------------------------
// Complaint image upload — Supabase Storage (free tier)
// -----------------------------------------------------------------------------

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json({ error: 'Only JPG, PNG, or WEBP images are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be under 5 MB.' }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const storagePath = `complaints/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const publicUrl = await uploadToSupabase(buffer, storagePath, file.type);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Complaint image upload error:', err);
    return NextResponse.json({ error: 'Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
  }
}
