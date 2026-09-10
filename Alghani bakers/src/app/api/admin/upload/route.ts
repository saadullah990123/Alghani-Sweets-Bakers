import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { uploadToSupabase } from '@/lib/supabaseStorage';

// -----------------------------------------------------------------------------
// Admin product/category image upload — Supabase Storage (free, public CDN)
// -----------------------------------------------------------------------------
// Accepts either a file upload or an external image URL. Both are validated,
// then uploaded to the Supabase Storage "images" bucket. The returned public
// URL is what gets stored on the product/category record.
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Only allow a known-safe set of folder-name characters, so this can never
// be used to write an unexpected/unsafe path prefix into the storage bucket.
const SAFE_FOLDER_PATTERN = /^[a-z0-9-]{1,50}$/;

function safeFolder(raw: FormDataEntryValue | null): string {
  return typeof raw === 'string' && SAFE_FOLDER_PATTERN.test(raw) ? raw : 'general';
}

function extFromContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  const base = contentType.split(';')[0].trim().toLowerCase();
  return ALLOWED_TYPES[base] || null;
}

export async function POST(req: NextRequest) {
  try {
    // Check that Supabase Storage is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Image storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const imageUrl = formData.get('imageUrl');
    const folder = safeFolder(formData.get('folder'));

    let buffer: Buffer;
    let ext: string;
    let contentType: string;

    if (file instanceof File) {
      // --- Mode 1: file uploaded directly from the admin's PC ---
      if (!ALLOWED_TYPES[file.type]) {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload a JPG, PNG, WEBP, or GIF image.' },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'File is too large. Maximum size is 5MB.' }, { status: 400 });
      }
      ext = ALLOWED_TYPES[file.type];
      contentType = file.type;
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (typeof imageUrl === 'string' && imageUrl.trim()) {
      // --- Mode 2: external image URL (re-hosted for durability) ---
      const trimmedUrl = imageUrl.trim();
      let parsed: URL;
      try {
        parsed = new URL(trimmedUrl);
      } catch {
        return NextResponse.json({ error: 'That does not look like a valid URL.' }, { status: 400 });
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'Only http/https image URLs are supported.' }, { status: 400 });
      }

      let fetchRes: Response;
      try {
        fetchRes = await fetch(parsed.toString(), { signal: AbortSignal.timeout(15_000) });
      } catch (err) {
        return NextResponse.json(
          { error: 'Could not download the image from that URL (it may be unreachable or too slow to respond).' },
          { status: 400 }
        );
      }
      if (!fetchRes.ok) {
        return NextResponse.json({ error: `Could not download the image (server responded ${fetchRes.status}).` }, { status: 400 });
      }

      const detectedExt = extFromContentType(fetchRes.headers.get('content-type'));
      if (!detectedExt) {
        return NextResponse.json(
          { error: 'The URL did not return a supported image type (JPG, PNG, WEBP, or GIF).' },
          { status: 400 }
        );
      }

      const contentLength = fetchRes.headers.get('content-length');
      if (contentLength && Number(contentLength) > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'That image is too large. Maximum size is 5MB.' }, { status: 400 });
      }

      const arrayBuffer = await fetchRes.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'That image is too large. Maximum size is 5MB.' }, { status: 400 });
      }

      ext = detectedExt;
      contentType = fetchRes.headers.get('content-type') || `image/${ext}`;
      buffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json({ error: 'Provide either a file or an image URL to upload.' }, { status: 400 });
    }

    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const storagePath = `products/${folder}/${uniqueName}`;

    const publicUrl = await uploadToSupabase(buffer, storagePath, contentType);

    return NextResponse.json({ success: true, path: publicUrl, pathname: storagePath });
  } catch (err) {
    console.error('Admin image upload error:', err);
    return NextResponse.json({ error: 'Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
  }
}
