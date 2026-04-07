import { Link } from "react-router-dom";
import { LockSimple, Sparkle } from "@phosphor-icons/react";

export default function LessonPaywall() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-2 p-8 text-center md:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-black/20 text-amber-200">
        <LockSimple size={24} weight="duotone" />
      </div>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.4em] text-amber-200">
        Member Access
      </p>
      <h2 className="mt-3 font-serif text-h2 text-foreground">This lesson opens for enrolled members.</h2>
      <p className="mx-auto mt-4 max-w-2xl font-sans text-body-lg font-light leading-relaxed text-neutral-200">
        You can browse the overview here, then sign in as a lesson member or get in touch to
        arrange access for your family.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          to="/learn/login"
          className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-6 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary"
        >
          <Sparkle size={16} />
          Member Lesson Login
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-black/10 px-6 py-3 font-sans text-label uppercase tracking-widest text-neutral-200 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
        >
          Ask About Access
        </Link>
      </div>
    </div>
  );
}
