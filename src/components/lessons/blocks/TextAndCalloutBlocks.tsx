import type { CalloutBlock, TextBlock } from "../../../types/lesson";

export function TextBlockView({ block }: { block: TextBlock }) {
  return (
    <section className="mx-auto max-w-3xl">
      {block.title && <h2 className="mb-4 font-serif text-h3 text-foreground">{block.title}</h2>}
      <div className="space-y-4 font-sans text-body-lg font-light leading-relaxed text-neutral-200">
        {block.body.split("\n").filter(Boolean).map((paragraph, index) => (
          <p key={`${block.id}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export function CalloutBlockView({ block }: { block: CalloutBlock }) {
  const toneClasses =
    block.settings.tone === "encouragement"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : block.settings.tone === "tip"
        ? "border-sky-500/30 bg-sky-500/10"
        : "border-amber-500/30 bg-amber-500/10";

  return (
    <section className={`rounded-2xl border p-6 md:p-8 ${toneClasses}`}>
      {block.title && <h2 className="mb-3 font-serif text-h3 text-foreground">{block.title}</h2>}
      <div className="space-y-4 font-sans text-body-lg font-light leading-relaxed text-neutral-100">
        {block.body.split("\n").filter(Boolean).map((paragraph, index) => (
          <p key={`${block.id}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
