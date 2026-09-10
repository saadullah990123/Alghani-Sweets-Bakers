import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase Storage helper — used for all image uploads (product images,
// complaint photos, etc.)
//
// Uses the **service_role** key (server-side only) so we can upload into
// public buckets without needing row-level security policies for uploads.
// The NEXT_PUBLIC_SUPABASE_URL is safe to expose client-side (it's just the
// project URL), but SUPABASE_SERVICE_ROLE_KEY must NEVER be sent to the
// browser.
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
      );
    }
    _client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

/** The single bucket name used for all uploads */
export const BUCKET_NAME = 'images';

/**
 * Upload a buffer to Supabase Storage and return the public URL.
 *
 * @param buffer   - The file contents
 * @param path     - Path inside the bucket, e.g. "products/biscuits/1234.jpg"
 * @param contentType - MIME type, e.g. "image/jpeg"
 * @returns The public URL string
 */
export async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const client = getClient();

  // Ensure the bucket exists (idempotent — won't fail if it already exists)
  const { error: bucketError } = await client.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });
  // Ignore "already exists" errors
  if (bucketError && !bucketError.message?.includes('already exists')) {
    console.error('Bucket creation error:', bucketError);
    throw new Error(`Failed to create storage bucket: ${bucketError.message}`);
  }

  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType,
      upsert: true, // overwrite if same path exists
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Build the public URL
  const { data: publicUrlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 *
 * @param path - Path inside the bucket, e.g. "products/biscuits/1234.jpg"
 */
export async function deleteFromSupabase(path: string): Promise<void> {
  const client = getClient();
  const { error } = await client.storage
    .from(BUCKET_NAME)
    .remove([path]);
  if (error) {
    console.error('Supabase delete error:', error);
  }
}
