import { useEffect, useState } from "react";
import type { ResolvedVideoSource, SplitTextVideoBlock, VideoBlock } from "../../../types/lesson";
import { resolveVideoSource } from "../../../lib/lessons/video";

function VideoFrame({ source }: { source: ResolvedVideoSource }) {
  const wrapperClass =
    source.aspectRatio === "1:1"
      ? "aspect-square"
      : source.aspectRatio === "4:3"
        ? "aspect-[4/3]"
        : "aspect-video";

  if (source.type === "embed") {
    return (
      <div className={`overflow-hidden rounded-xl border border-border bg-secondary ${wrapperClass}`}>
        <iframe
          src={source.src}
          title={source.caption || "Lesson video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-secondary ${wrapperClass}`}>
      <video
        src={source.src}
        poster={source.posterImageUrl ?? undefined}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function ResolvedVideo({
  block,
  moduleIsFree,
}: {
  block: VideoBlock | SplitTextVideoBlock;
  moduleIsFree: boolean;
}) {
  const [source, setSource] = useState<ResolvedVideoSource | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function run() {
      const result = await resolveVideoSource(block, { moduleIsFree });
      if (!active) {
        return;
      }

      setSource(result.data);
      setError(result.error);
    }

    void run();

    return () => {
      active = false;
    };
  }, [block, moduleIsFree]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-5 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!source) {
    return (
      <div className="aspect-video animate-pulse rounded-xl border border-border bg-secondary" />
    );
  }

  return (
    <div>
      <VideoFrame source={source} />
      {source.caption && (
        <p className="mt-3 font-sans text-sm font-light text-neutral-400">{source.caption}</p>
      )}
      {source.transcript && (
        <details className="mt-4 rounded-lg border border-border bg-black/10 px-4 py-3">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.3em] text-tertiary">
            Transcript
          </summary>
          <p className="mt-3 whitespace-pre-wrap font-sans text-sm font-light leading-relaxed text-neutral-300">
            {source.transcript}
          </p>
        </details>
      )}
    </div>
  );
}

export function VideoBlockView({
  block,
  moduleIsFree,
}: {
  block: VideoBlock;
  moduleIsFree: boolean;
}) {
  return (
    <section className="space-y-4">
      {block.title && <h2 className="font-serif text-h3 text-foreground">{block.title}</h2>}
      <ResolvedVideo block={block} moduleIsFree={moduleIsFree} />
    </section>
  );
}

export function SplitTextVideoBlockView({
  block,
  moduleIsFree,
}: {
  block: SplitTextVideoBlock;
  moduleIsFree: boolean;
}) {
  const mediaFirst = block.layout_type === "media_left";

  const media = <ResolvedVideo block={block} moduleIsFree={moduleIsFree} />;
  const text = (
    <div>
      {block.title && <h2 className="mb-4 font-serif text-h3 text-foreground">{block.title}</h2>}
      <div className="space-y-4 font-sans text-body-lg font-light leading-relaxed text-neutral-200">
        {block.body.split("\n").filter(Boolean).map((paragraph, index) => (
          <p key={`${block.id}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </div>
  );

  return (
    <section className="grid gap-8 md:grid-cols-2 md:items-center">
      {mediaFirst ? media : text}
      {mediaFirst ? text : media}
    </section>
  );
}
