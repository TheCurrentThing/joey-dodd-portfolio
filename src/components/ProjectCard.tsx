import { Link } from "react-router-dom";
import type { Project } from "../types/project";
import ArtDirectedImage from "./ArtDirectedImage";
import { fallbackArt, projectImage } from "../lib/art";

type ProjectCardProps = {
  project: Project;
  index?: number;
  aspect?: "portrait" | "square";
};

export default function ProjectCard({
  project,
  index = 0,
  aspect = "portrait",
}: ProjectCardProps) {
  const image = projectImage(project, index);
  const ratioClass = aspect === "square" ? "aspect-square" : "aspect-[4/5]";

  return (
    <Link
      to={`/portfolio/${project.slug}`}
      className="group block focus-visible:outline-none"
      aria-label={`${project.title} ${project.category ? `in ${project.category}` : ""}`}
    >
      <article className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d0d0f] shadow-[0_20px_80px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:-translate-y-1.5">
        <div className={`relative ${ratioClass} overflow-hidden`}>
          <ArtDirectedImage
            src={image}
            fallback={fallbackArt(index)}
            alt={project.title}
            imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_18%,rgba(0,0,0,0.22)_45%,rgba(0,0,0,0.92)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,221,167,0.16),transparent_35%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute left-5 top-5">
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[#f2d8a4] backdrop-blur-sm">
              {project.category || "Selected Work"}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
            <div className="translate-y-3 transition-transform duration-500 group-hover:translate-y-0">
              <h3 className="font-serif text-[1.65rem] leading-tight text-white drop-shadow-[0_5px_20px_rgba(0,0,0,0.55)]">
                {project.title}
              </h3>
              {project.description && (
                <p className="mt-3 max-w-md text-sm font-light leading-6 text-white/72 opacity-0 transition-all duration-500 group-hover:opacity-100">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
