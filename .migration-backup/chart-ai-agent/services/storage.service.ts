// ============================================================
// STORAGE SERVICE — Supabase Storage integration
// Handles image upload and retrieval
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { Timeframe } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'chart-uploads'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

interface UploadImageParams {
  base64: string
  mimeType: string
  timeframe: Timeframe
}

interface UploadResult {
  imageUrl: string
  imagePath: string
}

export async function uploadImage(params: UploadImageParams): Promise<UploadResult> {
  const { base64, mimeType, timeframe } = params

  // Convert base64 to buffer
  const buffer = Buffer.from(base64, 'base64')

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new Error(`Image exceeds maximum size of ${MAX_SIZE_BYTES / 1024 / 1024}MB`)
  }

  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  const timestamp = Date.now()
  const filename = `${timeframe}-${timestamp}.${extension}`
  const path = `charts/${new Date().toISOString().slice(0, 10)}/${filename}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return {
    imageUrl: urlData.publicUrl,
    imagePath: path,
  }
}

export async function getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`)
  }

  return data.signedUrl
}
