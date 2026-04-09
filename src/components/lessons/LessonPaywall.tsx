import { Link } from "react-router-dom";
import { LockSimple, Sparkle } from "@phosphor-icons/react";
import MembershipCheckoutButton from "./MembershipCheckoutButton";
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

export default function LessonPaywall({ module }: { module: LessonModule }) {
  const priceLabel = formatPrice(module.price_cents);

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-2 p-8 text-center md:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-black/20 text-amber-200">
        <LockSimple size={24} weight="duotone" />
      </div>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.4em] text-amber-200">Module Access</p>
      <h2 className="mt-3 font-serif text-h2 text-foreground">This lesson opens after purchase.</h2>
      <p className="mx-auto mt-4 max-w-2xl font-sans text-body-lg font-light leading-relaxed text-neutral-200">
        You can browse the overview here, then unlock this module for your family or sign in if you
        already own it.
      </p>
      {priceLabel && (
        <p className="mt-4 font-mono text-sm uppercase tracking-[0.3em] text-amber-100">
          Module Price {priceLabel}
        </p>
      )}
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <MembershipCheckoutButton
          icon
          moduleId={module.id}
          returnTo={`/learn/module/${module.slug}`}
          label={priceLabel ? `Unlock This Module ${priceLabel}` : "Unlock This Module"}
          className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-6 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary disabled:opacity-60"
        />
        <Link
          to={`/learn/login?returnTo=${encodeURIComponent(`/learn/module/${module.slug}`)}`}
          className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-6 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary"
        >
          <Sparkle size={16} />
          Lesson Login
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-black/10 px-6 py-3 font-sans text-label uppercase tracking-widest text-neutral-200 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
        >
          Family Questions
        </Link>
      </div>
    </div>
  );
}
