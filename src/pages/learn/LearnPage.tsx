import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Palette, Sparkle } from "@phosphor-icons/react";
import type { LessonModule } from "../../types/lesson";
import { fetchPublishedLessonModules } from "../../lib/lessons/queries";
import LessonCard from "../../components/lessons/LessonCard";

const ALL_FILTER = "All";
const DOODLES_LOGO = "/branding/doodles-design-school-logo.png";

export default function LearnPage() {
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);

  useEffect(() => {
    let active = true;

    async function loadModules() {
      try {
        const { data, error: requestError } = await fetchPublishedLessonModules();
        if (!active) {
          return;
        }

        if (requestError) {
          setError(requestError.message);
        } else {
          setModules(data ?? []);
        }
      } catch {
        if (active) {
          setError("Failed to load lessons.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadModules();

    return () => {
      active = false;
    };
  }, []);

  const filters = useMemo(() => {
    return [
      ALL_FILTER,
      ...Array.from(
        new Set(modules.map((module) => module.category).filter((value): value is string => Boolean(value)))
      ),
    ];
  }, [modules]);

  const filteredModules =
    activeFilter === ALL_FILTER
      ? modules
      : modules.filter((module) => module.category === activeFilter);

  return (
    <div className="min-h-screen bg-background pt-24">
      <section className="border-b border-border bg-gradient-1">
        <div className="mx-auto grid max-w-screen-xl gap-10 px-6 py-20 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-tertiary">
              Art Lessons For Kids
            </p>
            <img
              src={DOODLES_LOGO}
              alt="Doodles Design School"
              className="mt-6 h-auto w-full max-w-[28rem] opacity-95 sm:max-w-[36rem] lg:max-w-[44rem]"
            />
            <div className="mt-5 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.35em] text-amber-200">
              Coming Soon: The full lesson library is still being prepared.
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight text-foreground md:text-6xl">
              A warm, guided studio space for young artists to keep making.
            </h1>
            <p className="mt-6 max-w-2xl font-sans text-body-lg font-light leading-relaxed text-neutral-300">
              Each lesson is built like a thoughtful studio session: clear steps, visual examples,
              video guidance, and printable support when it helps. Browse free previews, then log
              in as a lesson member for the full library.
            </p>
            <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-neutral-400">
              Early preview pages may appear before the full program opens. If you want first
              access when lessons go live, use the contact link below.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-6 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary"
              >
                Ask About Access
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/learn/community"
                className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-sans text-label uppercase tracking-widest text-neutral-200 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
              >
                Community Studio
              </Link>
              <Link
                to="/learn/login"
                className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-sans text-label uppercase tracking-widest text-neutral-200 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
              >
                <Sparkle size={16} />
                Member Lesson Login
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200">
                <Palette size={22} />
              </div>
              <div>
                <h2 className="font-serif text-h3 text-foreground">What families get</h2>
                <ul className="mt-4 space-y-3 font-sans text-body-lg font-light text-neutral-300">
                  <li>Project-based modules that are easy to revisit.</li>
                  <li>Free previews mixed into the full paid library.</li>
                  <li>Clear video, image, and download support where it actually helps.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-6 py-14 md:px-10 md:py-18">
        <div className="mb-8 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] transition-colors duration-300 ${
                filter === activeFilter
                  ? "border-tertiary bg-tertiary text-background"
                  : "border-border bg-secondary text-neutral-300 hover:border-tertiary hover:text-tertiary"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading && <p className="py-20 text-center text-neutral-400">Loading lessons...</p>}

        {error && <p className="py-20 text-center text-warning">{error}</p>}

        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredModules.map((module) => (
              <LessonCard key={module.id} module={module} />
            ))}
            {filteredModules.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border px-6 py-16 text-center text-neutral-400">
                {modules.length === 0
                  ? "No published lessons are live yet."
                  : "No lessons match that filter yet."}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
