import { useEffect, useState } from "react";
import type { Project } from "../types/project";
import { projects } from "../lib/database";
import AmbientBackdrop from "../components/AmbientBackdrop";
import FilterBar from "../components/FilterBar";
import ProjectCard from "../components/ProjectCard";

const ALL_CATEGORY = "All";

export default function PortfolioPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projects.getAll().then(({ data }) => {
      if (data) {
        setAllProjects(data);
        setFilteredProjects(data);
      }

      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (activeCategory === ALL_CATEGORY) {
      setFilteredProjects(allProjects);
      return;
    }

    setFilteredProjects(
      allProjects.filter((project) => project.category === activeCategory)
    );
  }, [activeCategory, allProjects]);

  const categories = [
    ALL_CATEGORY,
    ...Array.from(
      new Set(
        allProjects
          .map((project) => project.category)
          .filter((category): category is string => Boolean(category))
      )
    ),
  ];

  return (
    <div className="min-h-screen overflow-hidden pt-24">
      <section className="relative px-4 pb-12 pt-8 md:pb-16 md:pt-12">
        <AmbientBackdrop intensity="strong" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.36em] text-[#ddb779]">All Work</p>
            <h1 className="mt-5 font-serif text-[clamp(3rem,7vw,5.6rem)] leading-[0.96] text-white">
              Portfolio
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300 md:text-xl">
              A gallery-oriented view of illustration, concept work, and image-led
              storytelling. Filter by category, but keep the art doing most of the talking.
            </p>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-24 md:pb-32">
        <div className="mx-auto max-w-7xl">
          <FilterBar
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]"
                >
                  <div className="aspect-[4/5] shimmer" />
                </div>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-8 py-24 text-center">
              <p className="text-lg text-neutral-300">
                {activeCategory === ALL_CATEGORY
                  ? "No projects found."
                  : `No projects found in ${activeCategory}.`}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
