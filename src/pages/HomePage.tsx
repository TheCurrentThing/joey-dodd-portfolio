import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useQuery } from "@animaapp/playground-react-sdk";
import { ArrowRight, ArrowDown } from "@phosphor-icons/react";
import FeaturedGrid from "../components/FeaturedGrid";
import AboutStrip from "../components/AboutStrip";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const heroTextRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const { data: featuredProjects, isPending } = useQuery("Project", {
    where: { isFeatured: true },
    orderBy: { sortOrder: "asc" },
    limit: 6,
  });

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
          },
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
          },
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
          },
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        aria-label="Hero section"
      >
        <video
          src="https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_1.mp4"
          poster="https://c.animaapp.com/mng9lb3oV7wJtj/img/ai_1-poster.png"
          className="absolute inset-0 w-full h-full object-cover"
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
          className="relative z-10 text-center px-6 md:px-10 max-w-4xl mx-auto"
        >
          <p className="hero-animate font-mono text-label uppercase tracking-widest text-tertiary mb-4 text-sm">
            Visual Artist &amp; Illustrator
          </p>
          <h1
            className="hero-animate font-serif text-hero-text text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight"
            style={{ letterSpacing: "-0.025em" }}
          >
            Joey Dodd
          </h1>
          <p className="hero-animate font-sans text-hero-text/80 text-body-lg md:text-xl mb-10 max-w-xl mx-auto font-light">
            Crafting worlds through character, concept, and illustration — where
            imagination meets craft.
          </p>
          <div className="hero-animate flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 bg-cta-primary-bg text-cta-primary-fg font-sans font-normal uppercase tracking-widest text-label px-8 py-4 rounded-md hover:bg-tertiary transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Explore Portfolio
              <ArrowRight size={18} weight="regular" />
            </Link>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce"
          aria-hidden="true"
        >
          <ArrowDown size={24} weight="light" className="text-hero-text/50" />
        </div>
      </section>

      {/* Featured Work */}
      <section
        id="featured"
        className="py-24 md:py-32 px-6 md:px-10 bg-background"
        aria-label="Featured work"
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-12">
            <p className="font-mono text-label uppercase tracking-widest text-tertiary text-sm mb-3">
              Selected Work
            </p>
            <h2 className="font-serif text-foreground text-h2 md:text-4xl">
              Featured Projects
            </h2>
          </div>
          <FeaturedGrid projects={featuredProjects} isPending={isPending} />
        </div>
      </section>

      {/* About Strip */}
      <div ref={aboutRef} id="about">
        <AboutStrip />
      </div>

      {/* CTA Row */}
      <section
        ref={ctaRef}
        className="py-24 md:py-32 px-6 md:px-10 bg-gradient-1"
        aria-label="Call to action"
      >
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-serif text-foreground text-h2 md:text-4xl mb-3">
              Ready to collaborate?
            </h2>
            <p className="font-sans text-neutral-300 text-body-lg font-light max-w-md">
              Browse the full portfolio or reach out to discuss your next
              project.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 bg-cta-primary-bg text-cta-primary-fg font-sans font-normal uppercase tracking-widest text-label px-8 py-4 rounded-md hover:bg-tertiary transition-colors duration-300"
            >
              Full Portfolio
              <ArrowRight size={18} weight="regular" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-border text-cta-secondary-fg bg-cta-secondary-bg font-sans font-normal uppercase tracking-widest text-label px-8 py-4 rounded-md hover:border-tertiary hover:text-tertiary transition-colors duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
