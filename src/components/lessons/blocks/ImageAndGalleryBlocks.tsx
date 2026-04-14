import type {
  GalleryBlock,
  GalleryImageItem,
  ImageBlock,
  SplitTextImageBlock,
} from "../../../types/lesson";
import { getLessonPublicAssetUrl } from "../../../lib/lessons/media";

function resolveGalleryImage(image: GalleryImageItem) {
  if (image.publicUrl) {
    return image.publicUrl;
  }

  if (image.storagePath) {
    return getLessonPublicAssetUrl("image", image.storagePath);
  }

  return "";
}

function ImageCaption({ caption }: { caption?: string | null }) {
  if (!caption) {
    return null;
  }

  return <p className="mt-3 font-sans text-sm font-light text-neutral-400">{caption}</p>;
}

export function ImageBlockView({ block }: { block: ImageBlock }) {
  return (
    <section className="space-y-4">
      {block.title && <h2 className="font-serif text-h3 text-foreground">{block.title}</h2>}
      <figure className="overflow-hidden rounded-xl border border-border bg-secondary">
        <img src={block.media_url} alt={block.alt_text || block.title || "Lesson image"} className="w-full object-cover" />
      </figure>
      <ImageCaption caption={block.caption} />
    </section>
  );
}

export function SplitTextImageBlockView({ block }: { block: SplitTextImageBlock }) {
  const imageFirst = block.layout_type === "media_left";

  const media = (
    <div className="overflow-hidden rounded-xl border border-border bg-secondary">
      <img src={block.media_url} alt={block.alt_text || block.title || "Lesson image"} className="h-full w-full object-cover" />
    </div>
  );

  const text = (
    <div>
      {block.title && <h2 className="mb-4 font-serif text-h3 text-foreground">{block.title}</h2>}
      <div className="space-y-4 font-sans text-body-lg font-light leading-relaxed text-neutral-200">
        {block.body.split("\n").filter(Boolean).map((paragraph, index) => (
          <p key={`${block.id}-${index}`}>{paragraph}</p>
        ))}
      </div>
      <ImageCaption caption={block.caption} />
    </div>
  );

  return (
    <section className="grid gap-8 md:grid-cols-2 md:items-center">
      {imageFirst ? media : text}
      {imageFirst ? text : media}
    </section>
  );
}

export function GalleryBlockView({ block }: { block: GalleryBlock }) {
  const columns = Math.min(Math.max(block.settings.columns ?? 2, 1), 4);
  const gridClass =
    columns === 1
      ? "md:grid-cols-1"
      : columns === 3
        ? "md:grid-cols-3"
        : columns >= 4
          ? "md:grid-cols-4"
          : "md:grid-cols-2";

  return (
    <section className="space-y-6">
      {block.title && <h2 className="font-serif text-h3 text-foreground">{block.title}</h2>}
      {block.body && (
        <p className="w-full font-sans text-body-lg font-light leading-relaxed text-neutral-300">
          {block.body}
        </p>
      )}
      <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
        {block.settings.images.map((image, index) => (
          <figure key={`${block.id}-${index}`} className="overflow-hidden rounded-xl border border-border bg-secondary">
            <img
              src={resolveGalleryImage(image)}
              alt={image.alt || block.title || "Gallery image"}
              className="h-full w-full object-cover"
            />
            {image.caption && (
              <figcaption className="px-4 py-3 font-sans text-sm font-light text-neutral-300">
                {image.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
