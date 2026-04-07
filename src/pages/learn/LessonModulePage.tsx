import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import type { LessonBlock, LessonModule, LessonResource } from "../../types/lesson";
import { useAuth } from "../../hooks/useAuth";
import { isLessonLocked } from "../../lib/lessons/access";
import {
  fetchLessonBlocks,
  fetchLessonModuleBySlug,
  fetchLessonResources,
  fetchPublishedLessonModules,
} from "../../lib/lessons/queries";
import LessonContentView from "../../components/lessons/LessonContentView";
import LessonPaywall from "../../components/lessons/LessonPaywall";
import LessonTagRow from "../../components/lessons/LessonTagRow";

export default function LessonModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { hasLessonsAccess, isAdmin, loading: authLoading } = useAuth();
  const [module, setModule] = useState<LessonModule | null>(null);
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [moduleList, setModuleList] = useState<LessonModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Lesson not found.");
      setLoading(false);
      return;
    }

    let active = true;

    async function run() {
      setLoading(true);
      const [{ data: moduleData, error: moduleError }, { data: listData }] = await Promise.all([
        fetchLessonModuleBySlug(slug),
        fetchPublishedLessonModules(),
      ]);

      if (!active) {
        return;
      }

      setModuleList(listData ?? []);

      if (moduleError || !moduleData || (!moduleData.is_published && !isAdmin)) {
        setError("Lesson not found.");
        setLoading(false);
        return;
      }

      setModule(moduleData);
      setError(null);
      setLoading(false);
    }

    void run();

    return () => {
      active = false;
    };
  }, [isAdmin, slug]);

  const isLocked = useMemo(() => {
    if (!module) {
      return false;
    }

    return isLessonLocked(module, { isAdmin, hasLessonsAccess });
  }, [hasLessonsAccess, isAdmin, module]);

  useEffect(() => {
    if (!module) {
      return;
    }

    if (module.is_free) {
      setContentLoading(true);
    } else if (authLoading) {
      return;
    } else if (isLocked) {
      setBlocks([]);
      setResources([]);
      return;
    } else {
      setContentLoading(true);
    }

    let active = true;

    async function run() {
      const [{ data: blockData, error: blockError }, { data: resourceData, error: resourceError }] =
        await Promise.all([fetchLessonBlocks(module.id), fetchLessonResources(module.id)]);

      if (!active) {
        return;
      }

      if (blockError || resourceError) {
        setError(blockError?.message || resourceError?.message || "Failed to load lesson content.");
      } else {
        setBlocks(blockData ?? []);
        setResources(resourceData ?? []);
      }

      setContentLoading(false);
    }

    void run();

    return () => {
      active = false;
    };
  }, [authLoading, isLocked, module]);

  if (loading) {
    return <div className="min-h-screen bg-background pt-24 text-center text-neutral-400">Loading lesson...</div>;
  }

  if (error || !module) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background pt-24">
        <p className="text-warning">{error || "Lesson not found."}</p>
        <button
          onClick={() => navigate("/learn")}
          className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-6 py-3 font-sans text-label uppercase tracking-widest text-cta-primary-fg"
        >
          <ArrowLeft size={16} />
          Back to Lessons
        </button>
      </div>
    );
  }

  const orderedModules = [...moduleList].sort((left, right) => left.sort_order - right.sort_order);
  const index = orderedModules.findIndex((item) => item.id === module.id);
  const previous = index > 0 ? orderedModules[index - 1] : null;
  const next = index >= 0 && index < orderedModules.length - 1 ? orderedModules[index + 1] : null;

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-screen-xl px-6 py-12 md:px-10 md:py-16">
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 transition-colors duration-300 hover:text-tertiary"
        >
          <ArrowLeft size={14} />
          Back to Lessons
        </Link>

        <div className="mt-8">
          {isLocked ? (
            <div className="space-y-10">
              <div className="space-y-5">
                <LessonTagRow module={module} />
                <h1 className="font-serif text-h1 text-foreground md:text-5xl">{module.title}</h1>
                {module.short_description && (
                  <p className="max-w-3xl font-sans text-body-lg font-light leading-relaxed text-neutral-300">
                    {module.short_description}
                  </p>
                )}
                {module.cover_image_url && (
                  <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
                    <img src={module.cover_image_url} alt={module.title} className="max-h-[32rem] w-full object-cover" />
                  </div>
                )}
              </div>
              <LessonPaywall />
            </div>
          ) : contentLoading ? (
            <div className="py-16 text-center text-neutral-400">Loading lesson content...</div>
          ) : (
            <LessonContentView module={module} blocks={blocks} resources={resources} />
          )}
        </div>

        <div className="mt-16 grid gap-4 border-t border-border pt-8 md:grid-cols-2">
          <div>
            {previous && (
              <Link to={`/learn/module/${previous.slug}`} className="block rounded-xl border border-border bg-secondary p-5 transition-colors duration-300 hover:border-tertiary">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">Previous Module</p>
                <p className="mt-2 font-serif text-h4 text-foreground">{previous.title}</p>
              </Link>
            )}
          </div>
          <div>
            {next && (
              <Link to={`/learn/module/${next.slug}`} className="block rounded-xl border border-border bg-secondary p-5 text-left transition-colors duration-300 hover:border-tertiary">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">Next Module</p>
                <p className="mt-2 font-serif text-h4 text-foreground">{next.title}</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
