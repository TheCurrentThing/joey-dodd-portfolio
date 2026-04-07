import { useEffect, useState } from "react";
import { ArrowSquareOut, DownloadSimple } from "@phosphor-icons/react";
import type { LessonResource, LessonResourceInput, ResolvedLessonResource } from "../../types/lesson";
import { resolveLessonResourceHref } from "../../lib/lessons/media";

type Props = {
  resources: Array<LessonResource | LessonResourceInput>;
  moduleIsFree: boolean;
};

export default function ModuleResourceList({ resources, moduleIsFree }: Props) {
  const [resolvedResources, setResolvedResources] = useState<ResolvedLessonResource[]>([]);

  useEffect(() => {
    let active = true;

    async function run() {
      const next = await Promise.all(
        resources.map(async (resource) => {
          const resolved = await resolveLessonResourceHref(resource, moduleIsFree);
          return {
            ...(resource as LessonResource),
            href: resolved.href,
            is_external: resolved.isExternal,
          };
        })
      );

      if (active) {
        setResolvedResources(next);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [moduleIsFree, resources]);

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-secondary p-6">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-tertiary">Resources</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {resolvedResources.map((resource) => (
          <a
            key={resource.id}
            href={resource.href}
            target={resource.is_external ? "_blank" : undefined}
            rel={resource.is_external ? "noreferrer noopener" : undefined}
            className="flex items-center justify-between rounded-lg border border-border bg-neutral-900/70 px-4 py-4 transition-colors duration-300 hover:border-tertiary"
          >
            <div className="min-w-0">
              <p className="truncate font-sans text-body-lg text-foreground">{resource.label}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                {resource.file_kind || (resource.is_external ? "External Link" : "Download")}
              </p>
            </div>
            {resource.is_external ? (
              <ArrowSquareOut size={18} className="flex-shrink-0 text-tertiary" />
            ) : (
              <DownloadSimple size={18} className="flex-shrink-0 text-tertiary" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
