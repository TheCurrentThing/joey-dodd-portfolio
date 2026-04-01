import { useNavigate } from "react-router-dom";
import type { Project } from "../types/project";

type Props = {
  project: Project;
};

const FALLBACK_IMAGES = [
  "https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_2.png",
  "https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_3.png",
  "https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_4.png",
];

export default function ProjectCard({ project }: Props) {
  const navigate = useNavigate();
  const imgSrc =
    project.thumbnailUrl ||
    FALLBACK_IMAGES[
      Math.abs(project.id.charCodeAt(0)) % FALLBACK_IMAGES.length
    ];

  return (
    <article
      className="group relative overflow-hidden rounded-md cursor-pointer bg-secondary aspect-[4/5]"
      onClick={() => navigate(`/project/${project.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          navigate(`/project/${project.id}`);
      }}
      tabIndex={0}
      aria-label={`${project.title} — ${project.category}`}
      role="article"
    >
      <img
        src={imgSrc}
        alt={project.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
      {/* Hover Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-95 transition-opacity duration-400"
        style={{
          background:
            "linear-gradient(90deg, hsl(35, 25%, 20%) 0%, hsl(30, 25%, 10%) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
        <span className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-2">
          {project.category}
        </span>
        <h3 className="font-serif text-foreground text-h3">{project.title}</h3>
        {project.description && (
          <p className="font-sans text-neutral-200 text-body mt-2 font-light line-clamp-2">
            {project.description}
          </p>
        )}
      </div>
    </article>
  );
}
