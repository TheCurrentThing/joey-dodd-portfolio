import type { LessonBlock, LessonModule, LessonResource, LessonResourceInput } from "../../types/lesson";
import LessonBlockRenderer from "./LessonBlockRenderer";
import LessonTagRow from "./LessonTagRow";
import ModuleResourceList from "./ModuleResourceList";

export default function LessonContentView({
  module,
  blocks,
  resources,
}: {
  module: LessonModule;
  blocks: LessonBlock[];
  resources: Array<LessonResource | LessonResourceInput>;
}) {
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

      {module.cover_image_url && (
        <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
          <img src={module.cover_image_url} alt={module.title} className="max-h-[32rem] w-full object-cover" />
        </div>
      )}

      <LessonBlockRenderer blocks={blocks} resources={resources} moduleIsFree={module.is_free} />
      <ModuleResourceList resources={resources} moduleIsFree={module.is_free} />
    </div>
  );
}
