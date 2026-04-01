import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projects } from "../lib/database";
import type { Project } from "../types/project";

export default function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projects.getFeatured().then(({ data }) => {
      if (data) {
        setFeaturedProjects(data);
      }

      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative flex h-screen items-center justify-center bg-gray-900">
        <div className="space-y-8 px-4 text-center">
          <h1 className="text-5xl font-bold text-white md:text-7xl">Joey Dodd</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-300 md:text-2xl">
            Digital Artist &amp; Illustrator
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/portfolio"
              className="rounded-lg bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-gray-200"
            >
              View Portfolio
            </Link>
            <Link
              to="/contact"
              className="rounded-lg border border-white px-8 py-3 font-medium text-white transition-colors hover:bg-white hover:text-black"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-4xl font-bold text-white">
            Featured Work
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-lg bg-gray-800"
                />
              ))}
            </div>
          ) : featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/portfolio/${project.slug}`}
                  className="group block"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-800">
                    <img
                      src={project.thumbnail_url || imageFallback(project.title)}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-white transition-colors group-hover:text-gray-300">
                      {project.title}
                    </h3>
                    <p className="text-gray-400">{project.category || "Uncategorized"}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-lg text-gray-400">No featured projects yet.</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-3 text-white transition-colors hover:bg-gray-700"
            >
              View All Work
            </Link>
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-gray-800 px-4 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-gray-400">About</p>
            <h2 className="text-3xl font-bold text-white md:text-5xl">
              Illustration, concept work, and visual storytelling.
            </h2>
            <p className="text-lg leading-8 text-gray-300">
              Joey Dodd&rsquo;s portfolio is built to foreground the artwork while
              keeping the publishing workflow simple on the CMS side. Featured
              projects, full galleries, and admin updates all route through the same
              Supabase-backed content model.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-lg border border-gray-700 px-6 py-3 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              Start a Conversation
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <Stat
                label="Featured"
                value={String(featuredProjects.length || 0).padStart(2, "0")}
              />
              <Stat label="Medium" value="Digital" />
              <Stat label="Format" value="Portfolio" />
              <Stat label="Editing" value="CMS" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function imageFallback(seed: string): string {
  const encoded = encodeURIComponent(seed.slice(0, 2).toUpperCase() || "JD");
  return `https://placehold.co/1200x1200/111827/F9FAFB?text=${encoded}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
