import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Project } from "../types/project";
import { projects } from "../lib/database";
import ProjectCard from "../components/ProjectCard";
import FilterBar from "../components/FilterBar";

const ALL_CATEGORY = "All";

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    projects.getAll().then(({ data, error: requestError }) => {
      if (requestError) {
        setError(requestError.message || "Unknown error");
      } else {
        setProjectsData(data || []);
      }
      setIsPending(false);
    });
  }, []);

  const categories = [
    ALL_CATEGORY,
    ...Array.from(
      new Set(
        projectsData
          .map((project) => project.category)
          .filter((category): category is string => Boolean(category))
      )
    ),
  ];

  const filtered =
    activeCategory === ALL_CATEGORY
      ? projectsData
      : projectsData.filter((project) => project.category === activeCategory);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.querySelectorAll(".header-animate"),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!gridRef.current || isPending) return;

    const ctx = gsap.context(() => {
      const cards = gridRef.current!.querySelectorAll(".project-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" }
      );
    });

    return () => ctx.revert();
  }, [filtered, isPending]);

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="mx-auto max-w-screen-xl px-6 md:px-10">
        <div ref={headerRef} className="py-16 md:py-20">
          <p className="header-animate mb-3 font-mono text-sm uppercase tracking-widest text-tertiary">
            All Work
          </p>
          <h1 className="header-animate mb-6 font-serif text-h1 text-foreground md:text-5xl">
            Portfolio
          </h1>
          <p className="header-animate max-w-xl font-sans text-body-lg font-light text-neutral-300">
            A collection of character designs, illustrations, concept art, and
            more.
          </p>
        </div>

        <FilterBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        {isPending && (
          <div className="py-32 text-center">
            <p className="font-sans text-body-lg text-neutral-400">
              Loading projects...
            </p>
          </div>
        )}

        {error && (
          <div className="py-32 text-center">
            <p className="font-sans text-body-lg text-warning">
              Error loading projects: {error}
            </p>
          </div>
        )}

        {!isPending && !error && (
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-6 pb-32 md:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-label="Portfolio projects"
          >
            {filtered.map((project) => (
              <div key={project.id} role="listitem" className="project-card">
                <ProjectCard project={project} />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-24 text-center">
                <p className="font-sans text-body-lg text-neutral-400">
                  No projects in this category yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
