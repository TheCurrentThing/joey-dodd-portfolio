import { supabase, STORAGE_BUCKET } from "./supabase";

export type UploadResult =
  | { success: true; url: string; path: string }
  | { success: false; error: string };

export async function uploadImage(
  file: File,
  folder: string = "projects",
  fileName?: string
): Promise<UploadResult> {
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

  return { success: true, url: data.publicUrl, path: storagePath };
}

export async function uploadBucketFile(
  file: File,
  bucket: string,
  folder: string,
  fileName?: string,
  options?: {
    upsert?: boolean;
  }
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = fileName
    ? `${fileName}.${ext}`
    : `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const storagePath = `${folder}/${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      upsert: options?.upsert ?? true,
      contentType: file.type,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  let url = "";
  try {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 60);
    url = data?.signedUrl ?? "";
  } catch {
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath);
    url = publicUrl.data.publicUrl;
  }

  return { success: true, url, path: storagePath };
}

export async function deleteImage(path: string): Promise<{ error?: string }> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  return error ? { error: error.message } : {};
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export function getBucketPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createSignedAssetUrl(
  bucket: string,
  path: string,
  expiresIn = 60 * 60
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}

export async function listImages(
  folder: string = "projects"
): Promise<{ files: any[]; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    return { files: [], error: error.message };
  }

  return { files: data ?? [], error: null };
}

export async function listBucketAssets(
  bucket: string,
  folder: string,
  includePublicUrls = false
): Promise<{
  files: {
    name: string;
    path: string;
    publicUrl?: string;
  }[];
  error: string | null;
}> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    return { files: [], error: error.message };
  }

  return {
    files:
      data
        ?.filter((file) => file.name !== ".emptyFolderPlaceholder")
        .map((file) => ({
          name: file.name,
          path: `${folder}/${file.name}`,
          publicUrl: includePublicUrls ? getBucketPublicUrl(bucket, `${folder}/${file.name}`) : undefined,
        })) ?? [],
    error: null,
  };
}
