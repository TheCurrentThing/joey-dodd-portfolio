import {
  LESSON_COVER_BUCKET,
  LESSON_PRIVATE_MEDIA_BUCKET,
  LESSON_PRIVATE_RESOURCE_BUCKET,
  LESSON_PUBLIC_MEDIA_BUCKET,
} from "../supabase";
import {
  createSignedAssetUrl,
  getBucketPublicUrl,
  listBucketAssets,
  uploadBucketFile,
} from "../storage";
import type { LessonResource, LessonResourceInput } from "../../types/lesson";

export type LessonAssetType = "cover" | "image" | "video" | "resource";
export type LessonAssetVisibility = "public" | "private";

export function getLessonAssetBucket(
  assetType: LessonAssetType,
  visibility: LessonAssetVisibility
) {
  if (assetType === "cover") {
    return LESSON_COVER_BUCKET;
  }

  if (visibility === "public") {
    return LESSON_PUBLIC_MEDIA_BUCKET;
  }

  return assetType === "resource" ? LESSON_PRIVATE_RESOURCE_BUCKET : LESSON_PRIVATE_MEDIA_BUCKET;
}

export async function uploadLessonAsset(
  file: File,
  options: {
    assetType: LessonAssetType;
    visibility: LessonAssetVisibility;
    folder?: string;
  }
) {
  const bucket = getLessonAssetBucket(options.assetType, options.visibility);
  const folder = options.folder ?? options.assetType;
  const result = await uploadBucketFile(file, bucket, folder);

  if (!result.success) {
    return result;
  }

  if (options.visibility === "public") {
    return {
      ...result,
      url: getBucketPublicUrl(bucket, result.path),
    };
  }

  return result;
}

export async function listLessonAssets(options: {
  assetType: LessonAssetType;
  visibility: LessonAssetVisibility;
  folder?: string;
}) {
  const bucket = getLessonAssetBucket(options.assetType, options.visibility);
  const folder = options.folder ?? options.assetType;
  return listBucketAssets(bucket, folder, options.visibility === "public");
}

export function getLessonPublicAssetUrl(
  assetType: LessonAssetType,
  storagePath: string,
  visibility: LessonAssetVisibility = "public"
) {
  const bucket = getLessonAssetBucket(assetType, visibility);
  return getBucketPublicUrl(bucket, storagePath);
}

export function normalizeLessonPublicAssetUrl(
  assetType: LessonAssetType,
  rawUrl: string,
  visibility: LessonAssetVisibility = "public"
) {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return "";
  }

  const bucket = getLessonAssetBucket(assetType, visibility);

  try {
    const parsed = new URL(trimmed);
    const signPrefix = `/storage/v1/object/sign/${bucket}/`;
    const publicPrefix = `/storage/v1/object/public/${bucket}/`;

    if (parsed.pathname.startsWith(signPrefix)) {
      const storagePath = decodeURIComponent(parsed.pathname.slice(signPrefix.length));
      return getBucketPublicUrl(bucket, storagePath);
    }

    if (parsed.pathname.startsWith(publicPrefix)) {
      const storagePath = decodeURIComponent(parsed.pathname.slice(publicPrefix.length));
      return getBucketPublicUrl(bucket, storagePath);
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export async function resolveLessonAssetUrl(options: {
  assetType: LessonAssetType;
  storagePath: string;
  visibility: LessonAssetVisibility;
}) {
  const bucket = getLessonAssetBucket(options.assetType, options.visibility);

  if (options.visibility === "public") {
    return {
      url: getBucketPublicUrl(bucket, options.storagePath),
      error: null,
    };
  }

  return createSignedAssetUrl(bucket, options.storagePath);
}

export async function resolveLessonResourceHref(
  resource: LessonResource | LessonResourceInput,
  moduleIsFree: boolean
) {
  if (resource.url) {
    return {
      href: resource.url,
      error: null,
      isExternal: true,
    };
  }

  if (!resource.storage_path) {
    return {
      href: "",
      error: "Missing resource file.",
      isExternal: false,
    };
  }

  const resolved = await resolveLessonAssetUrl({
    assetType: "resource",
    storagePath: resource.storage_path,
    visibility: moduleIsFree ? "public" : "private",
  });

  return {
    href: resolved.url ?? "",
    error: resolved.error,
    isExternal: false,
  };
}
