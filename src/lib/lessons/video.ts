import type {
  ResolvedVideoSource,
  SplitTextVideoBlock,
  VideoAspectRatio,
  VideoBlock,
  VideoProvider,
} from "../../types/lesson";
import { resolveLessonAssetUrl } from "./media";

type VideoCapableBlock = VideoBlock | SplitTextVideoBlock;

function normalizeAspectRatio(value?: string | null): VideoAspectRatio {
  if (value === "4:3" || value === "1:1") {
    return value;
  }

  return "16:9";
}

function extractYoutubeId(input: URL) {
  if (input.hostname === "youtu.be") {
    return input.pathname.replace("/", "");
  }

  if (input.pathname === "/watch") {
    return input.searchParams.get("v");
  }

  if (input.pathname.startsWith("/embed/")) {
    return input.pathname.split("/").pop() ?? null;
  }

  return null;
}

function extractVimeoId(input: URL) {
  const segments = input.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  return segments[segments.length - 1] ?? null;
}

function extractLoomId(input: URL) {
  const segments = input.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  return segments[segments.length - 1] ?? null;
}

export function normalizeVideoEmbedUrl(rawUrl: string, isPaid: boolean) {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.replace(/^www\./, "");
    let provider: VideoProvider | null = null;
    let embedUrl: string | null = null;

    if (hostname === "youtube.com" || hostname === "youtu.be" || hostname === "m.youtube.com") {
      if (isPaid) {
        return {
          data: null,
          error: "Paid lessons cannot rely on YouTube embeds. Use a private upload or an approved provider.",
        };
      }

      const videoId = extractYoutubeId(parsed);
      if (!videoId) {
        return { data: null, error: "Invalid YouTube URL." };
      }

      provider = "youtube";
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (hostname === "vimeo.com" || hostname === "player.vimeo.com") {
      const videoId = extractVimeoId(parsed);
      if (!videoId) {
        return { data: null, error: "Invalid Vimeo URL." };
      }

      provider = "vimeo";
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    } else if (hostname === "loom.com" || hostname === "www.loom.com") {
      const videoId = extractLoomId(parsed);
      if (!videoId) {
        return { data: null, error: "Invalid Loom URL." };
      }

      provider = "loom";
      embedUrl = `https://www.loom.com/embed/${videoId}`;
    } else {
      return {
        data: null,
        error: "Unsupported video provider. Use Vimeo or Loom for paid lessons, or YouTube only for free previews.",
      };
    }

    return {
      data: {
        provider,
        embedUrl,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Enter a valid video URL." };
  }
}

export async function resolveVideoSource(
  block: VideoCapableBlock,
  options: { moduleIsFree: boolean }
): Promise<{ data: ResolvedVideoSource | null; error: string | null }> {
  const aspectRatio = normalizeAspectRatio(block.settings?.aspectRatio);
  const transcript = block.settings?.transcript ?? null;

  if (block.settings.videoSourceType === "embed") {
    if (!block.media_url) {
      return { data: null, error: "Missing embed URL." };
    }

    const normalized = normalizeVideoEmbedUrl(block.media_url, !options.moduleIsFree);
    if (normalized.error || !normalized.data) {
      return { data: null, error: normalized.error ?? "Invalid embed URL." };
    }

    return {
      data: {
        type: "embed",
        provider: normalized.data.provider,
        src: normalized.data.embedUrl,
        aspectRatio,
        posterImageUrl: block.poster_image_url ?? null,
        caption: block.caption ?? null,
        transcript,
      },
      error: null,
    };
  }

  if (!block.storage_path) {
    return { data: null, error: "Missing uploaded video path." };
  }

  const visibility = options.moduleIsFree ? "public" : "private";
  const resolved = await resolveLessonAssetUrl({
    assetType: "video",
    storagePath: block.storage_path,
    visibility,
  });

  if (resolved.error || !resolved.url) {
    return { data: null, error: resolved.error ?? "Unable to load video." };
  }

  return {
    data: {
      type: "upload",
      provider: "upload",
      src: resolved.url,
      aspectRatio,
      posterImageUrl: block.poster_image_url ?? null,
      caption: block.caption ?? null,
      transcript,
    },
    error: null,
  };
}
