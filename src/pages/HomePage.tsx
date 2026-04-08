import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import type { Project } from "../types/project";
import { projects } from "../lib/database";
import { REFERENCE_MEDIA } from "../lib/referenceMedia";
import FeaturedGrid from "../components/FeaturedGrid";
import AboutStrip from "../components/AboutStrip";
import DoodlesDesignSchoolHero from "../components/DoodlesDesignSchoolHero";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const heroTextRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [featureError, setFeatureError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFeatured() {
      try {
        const { data, error } = await projects.getFeatured();
        if (!active) {
          return;
        }

        if (error) {
          setFeatureError(error.message || "Failed to load featured projects.");
          setFeaturedProjects([]);
        } else {
          setFeatureError(null);
          setFeaturedProjects(data || []);
        }
      } catch {
        if (active) {
          setFeatureError("Failed to load featured projects.");
          setFeaturedProjects([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFeatured();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (heroTextRef.current) {
        const children = heroTextRef.current.querySelectorAll(".hero-animate");
        gsap.fromTo(
          children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out",
            delay: 0.3,
          }
        );
      }

      if (aboutRef.current) {
        gsap.fromTo(
          aboutRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: aboutRef.current, start: "top 80%" },
          }
        );
      }

      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: ctaRef.current, start: "top 80%" },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <DoodlesDesignSchoolHero />

      <section
        id="home"
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        aria-label="Hero section"
      >
        <video
          src={REFERENCE_MEDIA.heroVideo}
          poster={REFERENCE_MEDIA.heroPoster}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-video-overlay"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-background/50" aria-hidden="true" />

        <div
          ref={heroTextRef}
          className="relative z-10 mx-auto max-w-4xl px-6 text-center md:px-10"
        >
          <p className="hero-animate mb-4 font-mono text-sm uppercase tracking-widest text-tertiary">
            Visual Artist &amp; Illustrator
          </p>
          <h1
            className="hero-animate mb-6 font-serif text-5xl leading-tight text-hero-text md:text-7xl lg:text-8xl"
            style={{ letterSpacing: "-0.025em" }}
          >
            Joey Dodd
          </h1>
          <p className="hero-animate mx-auto mb-10 max-w-xl font-sans text-body-lg font-light text-hero-text/80 md:text-xl">
            Crafting worlds through character, concept, and illustration, where
            imagination meets craft.
          </p>
          <div className="hero-animate flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-8 py-4 font-sans text-label font-normal uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary focus-visible:outline-2 focus-visible:outline-ring"
            >
              Explore Portfolio
              <ArrowRight size={18} weight="regular" />
            </Link>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce"
          aria-hidden="true"
        >
          <ArrowDown size={24} weight="light" className="text-hero-text/50" />
        </div>
      </section>

      <section
        id="featured"
        className="bg-background px-6 py-24 md:px-10 md:py-32"
        aria-label="Featured work"
      >
        <div className="mx-auto max-w-screen-xl">
          <div className="mb-12">
            <p className="mb-3 font-mono text-sm uppercase tracking-widest text-tertiary">
              Selected Work
            </p>
          <h2 className="font-serif text-h2 text-foreground md:text-4xl">
            Featured Projects
          </h2>
          {featureError && (
            <p className="mt-4 font-sans text-sm text-warning">{featureError}</p>
          )}
        </div>
        <FeaturedGrid projects={featuredProjects} isPending={loading} />
      </div>
      </section>

      <div ref={aboutRef} id="about">
        <AboutStrip />
      </div>

      <section
        ref={ctaRef}
        className="bg-gradient-1 px-6 py-24 md:px-10 md:py-32"
        aria-label="Call to action"
      >
        <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-8 md:flex-row">
          <div>
            <h2 className="mb-3 font-serif text-h2 text-foreground md:text-4xl">
              Ready to collaborate?
            </h2>
            <p className="max-w-md font-sans text-body-lg font-light text-neutral-300">
              Browse the full portfolio or reach out to discuss your next
              project.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-8 py-4 font-sans text-label font-normal uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary"
            >
              Full Portfolio
              <ArrowRight size={18} weight="regular" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-cta-secondary-bg px-8 py-4 font-sans text-label font-normal uppercase tracking-widest text-cta-secondary-fg transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
