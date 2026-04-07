import { useNavigate } from "react-router-dom";
import type { Project } from "../types/project";
import ProjectThumbnail from "./ProjectThumbnail";

type Props = {
  project: Project;
};

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();

  return (
    <article
      className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-md bg-secondary"
      onClick={() => navigate(`/portfolio/${project.slug}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          navigate(`/portfolio/${project.slug}`);
        }
      }}
      tabIndex={0}
      aria-label={`${project.title} - ${project.category || "Uncategorized"}`}
      role="article"
    >
      <ProjectThumbnail
        src={project.thumbnail_url}
        title={project.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-95"
        style={{
          background:
            "linear-gradient(90deg, hsl(35, 25%, 20%) 0%, hsl(30, 25%, 10%) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
        <span className="mb-2 font-mono text-xs uppercase tracking-widest text-tertiary">
          {project.category || "Uncategorized"}
        </span>
        <h3 className="font-serif text-h3 text-foreground">{project.title}</h3>
        {project.description && (
          <p className="mt-2 font-sans text-body font-light text-neutral-200 line-clamp-2">
            {project.description}
          </p>
        )}
      </div>
    </article>
  );
}
