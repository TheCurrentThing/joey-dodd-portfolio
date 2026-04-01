import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projects } from "../lib/database";
import type { Project } from "../types/project";

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
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">Portfolio</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-300">
            Explore a collection of digital artwork, illustration, and process-led
            project presentation.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                activeCategory === category
                  ? "bg-white text-black"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-lg bg-gray-800"
              />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/portfolio/${project.slug}`}
                className="group block"
              >
                <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-gray-800">
                  <img
                    src={project.thumbnail_url || imageFallback(project.title)}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="mb-1 text-xl font-semibold text-white transition-colors group-hover:text-gray-300">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {project.category || "Uncategorized"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-400">
              {activeCategory === ALL_CATEGORY
                ? "No projects found."
                : `No projects found in ${activeCategory}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function imageFallback(seed: string): string {
  const encoded = encodeURIComponent(seed.slice(0, 2).toUpperCase() || "JD");
  return `https://placehold.co/1200x1200/111827/F9FAFB?text=${encoded}`;
}
