import { ArrowDown, ArrowRight, Palette } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import doodlesLogo from "../assets/doodles-design-school-logo-v2.png";

export default function DoodlesDesignSchoolHero() {
  return (
    <section
      className="border-b border-border bg-gradient-1 px-6 pt-28 pb-20 md:px-10 md:pt-36 md:pb-24"
      aria-label="Doodles Design School"
    >
      <div className="mx-auto grid max-w-screen-xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-tertiary">
            Foundational Art Lessons for Kids
          </p>
          <img
            src={doodlesLogo}
            alt="Doodles Design School"
            className="mt-6 block h-auto w-full max-w-[32rem] opacity-95 sm:max-w-[40rem] lg:max-w-[46rem]"
          />
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-tight text-foreground md:text-6xl">
            Learn to Draw with Doodles Design School
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-body-lg font-light leading-relaxed text-neutral-300 md:text-xl">
            Fun, simple video lessons that teach young artists the real foundations of
            drawing, one step at a time.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/learn"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-cta-primary-bg px-8 py-4 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary"
            >
              Start Learning
              <ArrowRight size={18} weight="regular" />
            </Link>
            <a
              href="#featured"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-secondary px-8 py-4 font-sans text-label uppercase tracking-widest text-neutral-200 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
            >
              View Portfolio
              <ArrowDown size={18} weight="regular" />
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/90 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200">
              <Palette size={22} />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">
                What to Expect
              </p>
              <h2 className="mt-3 font-serif text-h3 text-foreground">
                Clear steps, strong fundamentals, real progress.
              </h2>
              <ul className="mt-5 space-y-3 font-sans text-body-lg font-light leading-relaxed text-neutral-300">
                <li>Short, approachable lessons built for young artists.</li>
                <li>Foundational drawing skills taught in a simple order.</li>
                <li>Portfolio work and artist projects continue below.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
