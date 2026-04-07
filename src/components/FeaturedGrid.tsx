import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "../types/project";
import ProjectThumbnail from "./ProjectThumbnail";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  projects: Project[] | undefined;
  isPending: boolean;
};

export default function FeaturedGrid({ projects, isPending }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!gridRef.current || isPending) return;

    const ctx = gsap.context(() => {
      const cards = gridRef.current!.querySelectorAll(".featured-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 80%" },
        }
      );
    });

    return () => ctx.revert();
  }, [projects, isPending]);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse rounded-md bg-secondary"
          />
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-body-lg text-neutral-400">
          No featured projects yet.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Featured projects"
    >
      {projects.map((project) => {
        return (
          <article
            key={project.id}
            role="listitem"
            className="featured-card group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-md bg-secondary"
            onClick={() => navigate(`/portfolio/${project.slug}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                navigate(`/portfolio/${project.slug}`);
              }
            }}
            tabIndex={0}
            aria-label={`${project.title} - ${project.category || "Uncategorized"}`}
          >
            <ProjectThumbnail
              src={project.thumbnail_url}
              title={project.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 bg-gradient-2 opacity-0 transition-opacity duration-400 group-hover:opacity-90"
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
              <span className="mb-2 font-mono text-xs uppercase tracking-widest text-tertiary">
                {project.category || "Uncategorized"}
              </span>
              <h3 className="font-serif text-h3 text-foreground">{project.title}</h3>
            </div>
          </article>
        );
      })}
    </div>
  );
}
