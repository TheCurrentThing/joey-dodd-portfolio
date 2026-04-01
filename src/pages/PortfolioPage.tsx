import { useEffect, useRef, useState } from "react";
import { useQuery } from "@animaapp/playground-react-sdk";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProjectCard from "../components/ProjectCard";
import FilterBar from "../components/FilterBar";

gsap.registerPlugin(ScrollTrigger);

const ALL_CATEGORY = "All";

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const {
    data: projects,
    isPending,
    error,
  } = useQuery("Project", {
    orderBy: { sortOrder: "asc" },
  });

  const categories = projects
    ? [ALL_CATEGORY, ...Array.from(new Set(projects.map((p) => p.category)))]
    : [ALL_CATEGORY];

  const filtered = projects
    ? activeCategory === ALL_CATEGORY
      ? projects
      : projects.filter((p) => p.category === activeCategory)
    : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.querySelectorAll(".header-animate"),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
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
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" },
      );
    });
    return () => ctx.revert();
  }, [filtered, isPending]);

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10">
        <div ref={headerRef} className="py-16 md:py-20">
          <p className="header-animate font-mono text-label uppercase tracking-widest text-tertiary text-sm mb-3">
            All Work
          </p>
          <h1 className="header-animate font-serif text-foreground text-h1 md:text-5xl mb-6">
            Portfolio
          </h1>
          <p className="header-animate font-sans text-neutral-300 text-body-lg font-light max-w-xl">
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
            <p className="font-sans text-neutral-400 text-body-lg">
              Loading projects...
            </p>
          </div>
        )}

        {error && (
          <div className="py-32 text-center">
            <p className="font-sans text-warning text-body-lg">
              Error loading projects: {error.message}
            </p>
          </div>
        )}

        {!isPending && !error && (
          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-32"
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
                <p className="font-sans text-neutral-400 text-body-lg">
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
