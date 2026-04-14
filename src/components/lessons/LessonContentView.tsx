import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, List, X } from "@phosphor-icons/react";
import type { LessonBlock, LessonModule, LessonResource, LessonResourceInput } from "../../types/lesson";
import { normalizeLessonPublicAssetUrl } from "../../lib/lessons/media";
import LessonBlockRenderer from "./LessonBlockRenderer";
import LessonTagRow from "./LessonTagRow";
import ModuleResourceList from "./ModuleResourceList";
import LessonStepNav, { type LessonStep } from "./LessonStepNav";

type BlockGroup = {
  title: string;
  blocks: LessonBlock[];
};

function groupBlocksIntoSteps(blocks: LessonBlock[]) {
  if (blocks.length === 0) {
    return [];
  }

  const groups: BlockGroup[] = [];
  let currentGroup: BlockGroup | null = null;

  for (const block of blocks) {
    if (block.title) {
      if (currentGroup) {
        groups.push(currentGroup);
      }

      currentGroup = {
        title: block.title,
        blocks: [block],
      };
      continue;
    }

    if (!currentGroup) {
      currentGroup = {
        title: "Introduction",
        blocks: [],
      };
    }

    currentGroup.blocks.push(block);
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = total <= 1 ? 100 : Math.round(((current + 1) / total) * 100);

  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-tertiary transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

type Props = {
  module: LessonModule;
  blocks: LessonBlock[];
  resources: Array<LessonResource | LessonResourceInput>;
};

export default function LessonContentView({ module, blocks, resources }: Props) {
  const coverUrl = module.cover_image_url
    ? normalizeLessonPublicAssetUrl("cover", module.cover_image_url)
    : "";
  const groups = groupBlocksIntoSteps(blocks);
  const hasSteps = groups.length > 1;
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveStep(0);
    setCompletedSteps(new Set());
    setSidebarOpen(false);
  }, [module.id]);

  useEffect(() => {
    if (activeStep < groups.length) {
      return;
    }

    setActiveStep(Math.max(groups.length - 1, 0));
  }, [activeStep, groups.length]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  if (!hasSteps) {
    return (
      <div className="space-y-12 md:space-y-16">
        <div className="space-y-5">
          <LessonTagRow module={module} />
          <div>
            <h1 className="font-serif text-h1 text-foreground md:text-5xl">{module.title}</h1>
            {module.short_description && (
              <p className="mt-4 max-w-3xl font-sans text-body-lg font-light leading-relaxed text-neutral-300">
                {module.short_description}
              </p>
            )}
          </div>
        </div>

        {coverUrl && (
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
            <img src={coverUrl} alt={module.title} className="max-h-[32rem] w-full object-cover" />
          </div>
        )}

        <LessonBlockRenderer blocks={blocks} resources={resources} moduleIsFree={module.is_free} />
        <ModuleResourceList resources={resources} moduleIsFree={module.is_free} />
      </div>
    );
  }

  const steps: LessonStep[] = groups.map((group, index) => ({
    index,
    title: group.title,
  }));
  const currentGroup = groups[activeStep] ?? groups[0];
  const currentBlocks = currentGroup.blocks.map((block, index) =>
    index === 0 && block.title === currentGroup.title ? { ...block, title: null } : block
  );

  function goTo(index: number) {
    setCompletedSteps((current) => {
      const next = new Set(current);
      if (index > activeStep) {
        next.add(activeStep);
      }
      return next;
    });

    setActiveStep(index);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrev() {
    if (activeStep === 0) {
      return;
    }

    goTo(activeStep - 1);
  }

  function goNext() {
    if (activeStep >= groups.length - 1) {
      return;
    }

    goTo(activeStep + 1);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <LessonTagRow module={module} />
        <h1 className="font-serif text-h1 text-foreground md:text-5xl">{module.title}</h1>
        {module.short_description && (
          <p className="max-w-3xl font-sans text-body-lg font-light leading-relaxed text-neutral-300">
            {module.short_description}
          </p>
        )}
      </div>

      {coverUrl && (
        <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
          <img src={coverUrl} alt={module.title} className="max-h-[28rem] w-full object-cover" />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
          <span>
            Lesson {activeStep + 1} of {groups.length}
          </span>
          <span>{completedSteps.size} completed</span>
        </div>
        <ProgressBar current={activeStep} total={groups.length} />
      </div>

      <div className="relative flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-28">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              Lessons
            </p>
            <LessonStepNav
              steps={steps}
              activeIndex={activeStep}
              completedIndices={completedSteps}
              onSelect={goTo}
            />
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <button
              type="button"
              aria-label="Close lesson list"
              className="absolute inset-0 bg-black/60"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-50 ml-auto h-full w-72 overflow-y-auto border-l border-border bg-background p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Lessons
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-neutral-400 transition-colors hover:text-neutral-100"
                >
                  <X size={18} />
                </button>
              </div>
              <LessonStepNav
                steps={steps}
                activeIndex={activeStep}
                completedIndices={completedSteps}
                onSelect={goTo}
              />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-10">
          <div className="flex items-center justify-between lg:hidden">
            <p className="font-sans text-sm font-semibold text-foreground">{currentGroup.title}</p>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-100"
            >
              <List size={14} />
              All lessons
            </button>
          </div>

          <div className="hidden lg:block">
            <h2 className="font-serif text-h2 text-foreground">{currentGroup.title}</h2>
          </div>

          <LessonBlockRenderer
            blocks={currentBlocks}
            resources={resources}
            moduleIsFree={module.is_free}
          />

          {activeStep === groups.length - 1 && (
            <ModuleResourceList resources={resources} moduleIsFree={module.is_free} />
          )}

          <div className="flex items-center justify-between border-t border-border pt-8">
            <button
              type="button"
              onClick={goPrev}
              disabled={activeStep === 0}
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-neutral-400 transition-colors hover:text-neutral-100 disabled:pointer-events-none disabled:opacity-30"
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            {activeStep < groups.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 rounded-xl bg-tertiary px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-background transition-opacity hover:opacity-80"
              >
                Next lesson
                <ArrowRight size={14} />
              </button>
            ) : (
              <div className="rounded-xl bg-green-500/20 px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.25em] text-green-400">
                Module complete
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
