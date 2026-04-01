import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "../types/project";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  projects: Project[] | undefined;
  isPending: boolean;
};

const FALLBACK_IMAGES = [
  "https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_2.png",
  "https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_3.png",
  "https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_4.png",
];

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
        },
      );
    });
    return () => ctx.revert();
  }, [projects, isPending]);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] bg-secondary rounded-md animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-sans text-neutral-400 text-body-lg">
          No featured projects yet.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="list"
      aria-label="Featured projects"
    >
      {projects.map((project, index) => {
        const imgSrc =
          project.thumbnailUrl ||
          FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
        return (
          <article
            key={project.id}
            role="listitem"
            className="featured-card group relative overflow-hidden rounded-md cursor-pointer bg-secondary aspect-[4/5]"
            onClick={() => navigate(`/project/${project.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                navigate(`/project/${project.id}`);
            }}
            tabIndex={0}
            aria-label={`${project.title} — ${project.category}`}
          >
            <img
              src={imgSrc}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-gradient-2 opacity-0 group-hover:opacity-90 transition-opacity duration-400"
              aria-hidden="true"
            />
            <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
              <span className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-2">
                {project.category}
              </span>
              <h3 className="font-serif text-foreground text-h3">
                {project.title}
              </h3>
            </div>
          </article>
        );
      })}
    </div>
  );
}
