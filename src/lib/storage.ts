import { supabase, STORAGE_BUCKET, supabaseConfigured } from "./supabase";

export type UploadResult =
  | { success: true; publicUrl: string; path: string }
  | { success: false; error: string };

/**
 * Upload an image file to Supabase Storage under a given folder path.
 * Returns the public URL on success.
 */
export async function uploadImage(
  file: File,
  folder: string = "projects",
  fileName?: string
): Promise<UploadResult> {
  if (!supabaseConfigured) {
    return {
      success: false,
      error:
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the dev server.",
    };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = fileName
    ? `${fileName}.${ext}`
    : `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const storagePath = `${folder}/${safeName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: file.type });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return { success: true, publicUrl: data.publicUrl, path: storagePath };
}

/**
 * Delete an image from Supabase Storage by its path.
 */
export async function deleteImage(path: string): Promise<{ error?: string }> {
  if (!supabaseConfigured) return { error: "Supabase not configured." };

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);
  return error ? { error: error.message } : {};
}

/**
 * Get the public URL for an existing storage path without uploading.
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

/**
 * List all files inside a storage folder.
 */
export async function listFolder(folder: string) {
  if (!supabaseConfigured) {
    return {
      files: [],
      error:
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.",
    };
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, { sortBy: { column: "created_at", order: "desc" } });

  if (error) return { files: [], error: error.message };
  return { files: data ?? [], error: null };
}
