import type { LessonModule } from "../../types/lesson";

function formatPrice(priceCents: number | null) {
  if (!priceCents || priceCents <= 0) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export default function LessonTagRow({ module }: { module: LessonModule }) {
  const priceLabel = formatPrice(module.price_cents);
  const tags = [
    module.category,
    module.level,
    module.age_range,
  ].filter((value): value is string => Boolean(value));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] ${
          module.is_free
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/40 bg-amber-500/10 text-amber-200"
        }`}
      >
        {module.is_free ? "Free Preview" : "Paid Module"}
      </span>
      {!module.is_free && priceLabel && (
        <span className="rounded-full border border-amber-500/20 bg-black/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-100">
          {priceLabel}
        </span>
      )}
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
