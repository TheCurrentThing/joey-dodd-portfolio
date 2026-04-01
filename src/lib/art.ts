import type { Project, ProjectWithImages } from "../types/project";

export const ART_FALLBACKS = [
  "/art/atmosphere-1.svg",
  "/art/atmosphere-2.svg",
  "/art/atmosphere-3.svg",
];

export function fallbackArt(indexOrSeed: number | string): string {
  if (typeof indexOrSeed === "number") {
    return ART_FALLBACKS[Math.abs(indexOrSeed) % ART_FALLBACKS.length];
  }

  const hash = Array.from(indexOrSeed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );

  return ART_FALLBACKS[hash % ART_FALLBACKS.length];
}

export function projectImage(project: Project, index: number = 0): string {
  return project.thumbnail_url || fallbackArt(project.slug || index);
}

export function projectHeroImage(project: ProjectWithImages): string {
  return project.images[0]?.image_url || project.thumbnail_url || fallbackArt(project.slug);
}
