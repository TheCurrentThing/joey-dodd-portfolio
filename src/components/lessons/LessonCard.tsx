import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import type { LessonModule } from "../../types/lesson";
import { normalizeLessonPublicAssetUrl } from "../../lib/lessons/media";
import LessonTagRow from "./LessonTagRow";

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

export default function LessonCard({ module }: { module: LessonModule }) {
  const coverUrl = module.cover_image_url
    ? normalizeLessonPublicAssetUrl("cover", module.cover_image_url)
    : "";
  const priceLabel = formatPrice(module.price_cents);

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-secondary">
      <Link to={`/learn/module/${module.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-800">
          {!module.is_free && priceLabel && (
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-amber-400/30 bg-black/70 px-4 py-2 shadow-lg backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-200">
                Module
              </p>
              <p className="mt-1 font-serif text-2xl leading-none text-white">{priceLabel}</p>
            </div>
          )}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={module.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-2 px-6 text-center font-serif text-h3 text-foreground">
              {module.title}
            </div>
          )}
        </div>
        <div className="space-y-4 p-6">
          <LessonTagRow module={module} />
          <div>
            <h3 className="font-serif text-h3 text-foreground">{module.title}</h3>
            {module.short_description && (
              <p className="mt-3 font-sans text-body-lg font-light leading-relaxed text-neutral-300">
                {module.short_description}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-tertiary">
            {module.is_free ? "Start Preview" : "View Module"}
            <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </article>
  );
}
