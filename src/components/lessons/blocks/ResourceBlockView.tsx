import { useEffect, useState } from "react";
import { ArrowSquareOut, DownloadSimple } from "@phosphor-icons/react";
import type { LessonResource, LessonResourceInput, ResourceBlock } from "../../../types/lesson";
import { resolveLessonResourceHref } from "../../../lib/lessons/media";

export function ResourceBlockView({
  block,
  moduleIsFree,
  resources,
}: {
  block: ResourceBlock;
  moduleIsFree: boolean;
  resources: Array<LessonResource | LessonResourceInput>;
}) {
  const linkedResource = block.resource_id
    ? resources.find((resource) => resource.id === block.resource_id) ?? null
    : null;
  const [href, setHref] = useState(block.media_url ?? "");
  const [isExternal, setIsExternal] = useState(Boolean(block.media_url));

  useEffect(() => {
    let active = true;

    async function run() {
      if (!linkedResource) {
        setHref(block.media_url ?? "");
        setIsExternal(Boolean(block.media_url));
        return;
      }

      const resolved = await resolveLessonResourceHref(linkedResource, moduleIsFree);
      if (!active) {
        return;
      }

      setHref(resolved.href);
      setIsExternal(resolved.isExternal);
    }

    void run();

    return () => {
      active = false;
    };
  }, [block.media_url, linkedResource, moduleIsFree]);

  const label = linkedResource?.label || block.title || "Resource";
  const description = block.body || null;

  return (
    <section className="rounded-xl border border-border bg-secondary p-5">
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer noopener" : undefined}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h3 className="font-serif text-h4 text-foreground">{label}</h3>
          {description && (
            <p className="mt-2 max-w-2xl font-sans text-body font-light leading-relaxed text-neutral-300">
              {description}
            </p>
          )}
        </div>
        {isExternal ? (
          <ArrowSquareOut size={18} className="flex-shrink-0 text-tertiary" />
        ) : (
          <DownloadSimple size={18} className="flex-shrink-0 text-tertiary" />
        )}
      </a>
    </section>
  );
}
