import type { Project } from "../types/project";
import ProjectCard from "./ProjectCard";

type FeaturedGridProps = {
  projects: Project[];
  loading: boolean;
};

export default function FeaturedGrid({ projects, loading }: FeaturedGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] ${
              index === 0 ? "xl:col-span-7" : index === 1 ? "xl:col-span-5" : "xl:col-span-4"
            }`}
          >
            <div className={`${index < 2 ? "aspect-[4/3]" : "aspect-[4/5]"} shimmer`} />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-8 py-16 text-center">
        <p className="text-lg text-neutral-300">No featured projects yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
      {projects.map((project, index) => {
        const layoutClass =
          index === 0
            ? "xl:col-span-7"
            : index === 1
              ? "xl:col-span-5"
              : "xl:col-span-4";

        const aspect = index < 2 ? "square" : "portrait";

        return (
          <div key={project.id} className={layoutClass}>
            <ProjectCard project={project} index={index} aspect={aspect} />
          </div>
        );
      })}
    </div>
  );
}
