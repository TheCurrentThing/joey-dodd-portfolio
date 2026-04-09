import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import type { LessonBlock, LessonModule, LessonResource } from "../../types/lesson";
import { useAuth } from "../../hooks/useAuth";
import { isLessonLocked } from "../../lib/lessons/access";
import { normalizeLessonPublicAssetUrl } from "../../lib/lessons/media";
import {
  fetchLessonBlocks,
  fetchLessonModuleBySlug,
  fetchLessonResources,
  fetchPublishedLessonModules,
} from "../../lib/lessons/queries";
import LessonContentView from "../../components/lessons/LessonContentView";
import LessonPaywall from "../../components/lessons/LessonPaywall";
import LessonSubmissionSection from "../../components/lessons/LessonSubmissionSection";
import LessonTagRow from "../../components/lessons/LessonTagRow";

export default function LessonModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasLessonsAccess, ownedLessonModuleIds, isAdmin, loading: authLoading, user, refreshProfile } = useAuth();
  const [module, setModule] = useState<LessonModule | null>(null);
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [moduleList, setModuleList] = useState<LessonModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingNotice, setBillingNotice] = useState<string | null>(null);

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

    const hasModuleAccess = hasLessonsAccess || ownedLessonModuleIds.includes(module.id);

    return isLessonLocked(module, { isAdmin, hasModuleAccess });
  }, [hasLessonsAccess, isAdmin, module, ownedLessonModuleIds]);

  const lockedCoverUrl = module?.cover_image_url
    ? normalizeLessonPublicAssetUrl("cover", module.cover_image_url)
    : "";

  useEffect(() => {
    const billingState = searchParams.get("billing");

    if (billingState === "cancelled") {
      setBillingNotice("Checkout was cancelled. You can unlock this module whenever you're ready.");
      return;
    }

    if (billingState !== "success") {
      setBillingNotice(null);
      return;
    }

    if (isAdmin || (module && (hasLessonsAccess || ownedLessonModuleIds.includes(module.id)))) {
      setBillingNotice("Purchase confirmed. This module is ready.");
      return;
    }

    if (!user) {
      setBillingNotice("Purchase completed. Sign in again if you do not see the module unlock.");
      return;
    }

    setBillingNotice("Payment received. Syncing this module into your lesson account...");

    let active = true;
    let attempts = 0;

    const intervalId = window.setInterval(() => {
      attempts += 1;

      void refreshProfile().then(() => {
        if (!active) {
          return;
        }

        const nowUnlocked = module && (hasLessonsAccess || ownedLessonModuleIds.includes(module.id));

        if (nowUnlocked) {
          window.clearInterval(intervalId);
          setBillingNotice("Purchase confirmed. This module is ready.");
          return;
        }

        if (attempts >= 5) {
          window.clearInterval(intervalId);
          setBillingNotice(
            "Payment succeeded, but access is still syncing. Refresh in a moment if the module stays locked."
          );
        }
      });
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [searchParams, user, hasLessonsAccess, ownedLessonModuleIds, isAdmin, module, refreshProfile]);

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
          {billingNotice && (
            <div className="mb-6 inline-flex rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {billingNotice}
            </div>
          )}
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
                {lockedCoverUrl && (
                  <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
                    <img src={lockedCoverUrl} alt={module.title} className="max-h-[32rem] w-full object-cover" />
                  </div>
                )}
              </div>
              <LessonPaywall module={module} />
            </div>
          ) : contentLoading ? (
            <div className="py-16 text-center text-neutral-400">Loading lesson content...</div>
          ) : (
            <div className="space-y-12">
              <LessonContentView module={module} blocks={blocks} resources={resources} />
              <LessonSubmissionSection module={module} />
            </div>
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
