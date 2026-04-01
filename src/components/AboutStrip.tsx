import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import type { Project } from "../types/project";
import ArtDirectedImage from "./ArtDirectedImage";
import AmbientBackdrop from "./AmbientBackdrop";
import { fallbackArt, projectImage } from "../lib/art";

type AboutStripProps = {
  projects: Project[];
};

export default function AboutStrip({ projects }: AboutStripProps) {
  const lead = projects[0];
  const supporting = projects.slice(1, 3);

  return (
    <section className="relative overflow-hidden px-4 py-24 md:py-32" aria-label="About Joey Dodd">
      <AmbientBackdrop intensity="soft" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0e0f11] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(214,168,90,0.24),rgba(13,14,16,0)_38%,rgba(13,14,16,0.8))]" />
              <ArtDirectedImage
                src={lead ? projectImage(lead, 0) : fallbackArt(0)}
                fallback={fallbackArt(0)}
                alt={lead?.title || "Featured atmospheric artwork"}
                className="aspect-[4/5]"
                imgClassName="scale-[1.02]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_42%,rgba(0,0,0,0.86)_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs uppercase tracking-[0.32em] text-[#d8b270]">Studio Mood</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-white/72">
                  Character work, atmosphere, and tonal contrast shape the overall portfolio language.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              {supporting.map((project, index) => (
                <div
                  key={project.id}
                  className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0e0f11]"
                >
                  <ArtDirectedImage
                    src={projectImage(project, index + 1)}
                    fallback={fallbackArt(index + 1)}
                    alt={project.title}
                    className="aspect-[5/4]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.82))]" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#e1bf83]">
                      {project.category || "Work"}
                    </p>
                    <p className="mt-2 font-serif text-lg text-white">{project.title}</p>
                  </div>
                </div>
              ))}
              {supporting.length < 2 && (
                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0e0f11]">
                  <ArtDirectedImage
                    src={fallbackArt(2)}
                    fallback={fallbackArt(2)}
                    alt="Atmospheric illustration texture"
                    className="aspect-[5/4]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.86))]" />
                </div>
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(228,190,122,0.12),rgba(10,10,12,0)_36%,rgba(10,10,12,0.86))]" />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.35em] text-[#deb878]">About</p>
              <h2 className="mt-6 max-w-xl font-serif text-4xl leading-tight text-white md:text-5xl">
                Crafting worlds with cinematic contrast and tactile atmosphere.
              </h2>
              <div className="mt-8 space-y-5 text-lg font-light leading-8 text-neutral-300">
                <p>
                  Joey Dodd&rsquo;s work lives in the space between illustration and
                  world-building: dramatic silhouettes, lived-in texture, and the kind
                  of atmosphere that suggests a larger story just outside the frame.
                </p>
                <p>
                  This portfolio is designed to present that work with the same
                  intentionality as the art itself, pairing editorial layout with
                  a CMS that keeps the publishing workflow clean.
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                {["Character", "Concept", "Illustration", "Atmosphere"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.28em] text-neutral-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <Link
                to="/portfolio"
                className="mt-10 inline-flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-[#e3be7a] transition-colors hover:text-white"
              >
                View Full Portfolio
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
