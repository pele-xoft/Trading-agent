import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = "chart-uploads";

// Lazy init — don't crash at startup if env vars are missing
let _client: SupabaseClient | null = null;
let bucketReady = false;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

async function ensureBucket(client: SupabaseClient) {
  if (bucketReady) return;
  const { data: buckets } = await client.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await client.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (error) throw new Error(`Failed to create storage bucket: ${error.message}`);
  }
  bucketReady = true;
}

export async function uploadChartImage(params: {
  base64: string;
  mimeType: string;
  timeframe: string;
}): Promise<{ imageUrl: string; imagePath: string }> {
  const client = getClient();
  await ensureBucket(client);

  const ext = params.mimeType === "image/png" ? "png" : params.mimeType === "image/webp" ? "webp" : "jpg";
  const imagePath = `charts/${params.timeframe}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(params.base64, "base64");

  const { error } = await client.storage
    .from(BUCKET)
    .upload(imagePath, buffer, { contentType: params.mimeType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = client.storage.from(BUCKET).getPublicUrl(imagePath);
  return { imageUrl: data.publicUrl, imagePath };
}
