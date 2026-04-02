const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg"];

function normalizePath(value: string) {
  try {
    return new URL(value).pathname.toLowerCase();
  } catch {
    return value.toLowerCase().split("?")[0];
  }
}

export function isVideoUrl(value: string) {
  const path = normalizePath(value);
  return VIDEO_EXTENSIONS.some((extension) => path.endsWith(extension));
}

export function uniqueMediaUrls(urls: string[]) {
  return Array.from(
    new Map(
      urls
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => [url, url])
    ).values()
  );
}
