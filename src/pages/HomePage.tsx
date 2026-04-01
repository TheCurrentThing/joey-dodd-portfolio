import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import type { Project } from "../types/project";
import { projects } from "../lib/database";
import { fallbackArt, projectImage } from "../lib/art";
import AmbientBackdrop from "../components/AmbientBackdrop";
import ArtDirectedImage from "../components/ArtDirectedImage";
import FeaturedGrid from "../components/FeaturedGrid";
import AboutStrip from "../components/AboutStrip";

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

  const heroProjects = featuredProjects.slice(0, 3);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 pb-24 pt-28 md:pb-32 md:pt-36">
        <AmbientBackdrop intensity="strong" />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(7,7,8,0.08),rgba(7,7,8,0.58),rgba(7,7,8,0.94))]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.36em] text-[#ddb779]">
              Artist Portfolio
            </p>
            <h1 className="mt-6 font-serif text-[clamp(3.6rem,8vw,7.2rem)] leading-[0.94] text-white">
              Joey Dodd
            </h1>
            <p className="mt-7 max-w-lg text-xl font-light leading-8 text-neutral-300">
              Cinematic illustration, concept-forward image-making, and a portfolio
              experience designed to let atmosphere carry the first impression.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e0bc7b] px-8 py-4 text-sm uppercase tracking-[0.28em] text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#ecc98a]"
              >
                View Portfolio
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-8 py-4 text-sm uppercase tracking-[0.28em] text-white backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-white/[0.06]"
              >
                Contact
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-4">
              <HeroStat label="Medium" value="Digital" />
              <HeroStat label="Focus" value="Worlds" />
              <HeroStat
                label="Featured"
                value={String(featuredProjects.length || 0).padStart(2, "0")}
              />
            </div>
          </div>

          <div className="relative h-[34rem] md:h-[42rem]">
            <div className="absolute inset-0 rounded-[2.25rem] border border-white/10 bg-white/[0.03] backdrop-blur-[2px]" />
            <div className="float-slow absolute left-[4%] top-[8%] h-[72%] w-[42%] overflow-hidden rounded-[1.9rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <ArtDirectedImage
                src={heroProjects[0] ? projectImage(heroProjects[0], 0) : fallbackArt(0)}
                fallback={fallbackArt(0)}
                alt={heroProjects[0]?.title || "Atmospheric artwork"}
                loading="eager"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.72))]" />
            </div>
            <div className="float-delay absolute right-[4%] top-0 h-[48%] w-[45%] overflow-hidden rounded-[1.7rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <ArtDirectedImage
                src={heroProjects[1] ? projectImage(heroProjects[1], 1) : fallbackArt(1)}
                fallback={fallbackArt(1)}
                alt={heroProjects[1]?.title || "Portfolio texture"}
                loading="eager"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.7))]" />
            </div>
            <div className="absolute bottom-[4%] right-[10%] h-[42%] w-[52%] overflow-hidden rounded-[1.8rem] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <ArtDirectedImage
                src={heroProjects[2] ? projectImage(heroProjects[2], 2) : fallbackArt(2)}
                fallback={fallbackArt(2)}
                alt={heroProjects[2]?.title || "Illustration background"}
                loading="eager"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.84))]" />
            </div>
            <div className="absolute bottom-[7%] left-[14%] rounded-full border border-white/15 bg-black/55 px-5 py-3 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#e4be7a]">
                Atmospheric Illustration
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-24 md:py-32">
        <AmbientBackdrop intensity="soft" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.36em] text-[#ddb779]">
                Featured Work
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-4xl text-white md:text-5xl">
                A curated front row for the newest and most representative work.
              </h2>
            </div>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.28em] text-white/80 transition-colors hover:text-white"
            >
              Browse all work
              <ArrowRight size={18} />
            </Link>
          </div>

          <FeaturedGrid projects={featuredProjects} loading={loading} />
        </div>
      </section>

      <AboutStrip projects={featuredProjects} />

      <section className="relative overflow-hidden px-4 py-24 md:py-28">
        <AmbientBackdrop intensity="medium" />
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 py-12 md:px-12 md:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(227,190,122,0.16),rgba(10,10,12,0)_36%,rgba(10,10,12,0.88))]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-[#ddb779]">Next Project</p>
              <h2 className="mt-4 font-serif text-4xl text-white md:text-5xl">
                Ready to build something textured, dramatic, and memorable.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-300">
                Commission inquiries, collaborations, and selected freelance projects
                are welcome. The contact flow stays simple; the presentation does not.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full bg-[#e0bc7b] px-8 py-4 text-sm uppercase tracking-[0.28em] text-black transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#ecc98a]"
            >
              Start a Conversation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#ddb779]">{label}</p>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
    </div>
  );
}
