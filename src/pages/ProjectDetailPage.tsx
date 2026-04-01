import { useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@animaapp/playground-react-sdk";
import { gsap } from "gsap";
import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    data: project,
    isPending: projectPending,
    error: projectError,
  } = useQuery("Project", id!);

  const { data: images, isPending: imagesPending } = useQuery("ProjectImage", {
    where: { projectId: id },
    orderBy: { sortOrder: "asc" },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!project) return;
    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: "power2.out" },
        );
      }
      if (contentRef.current) {
        const els = contentRef.current.querySelectorAll(".content-animate");
        gsap.fromTo(
          els,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.3,
          },
        );
      }
    });
    return () => ctx.revert();
  }, [project]);

  if (projectPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <p className="font-sans text-neutral-400 text-body-lg">
          Loading project...
        </p>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-24 gap-6">
        <p className="font-sans text-warning text-body-lg">
          Project not found.
        </p>
        <button
          onClick={() => navigate("/portfolio")}
          className="inline-flex items-center gap-2 bg-cta-primary-bg text-cta-primary-fg font-sans font-normal uppercase tracking-widest text-label px-6 py-3 rounded-md hover:bg-tertiary transition-colors duration-300"
        >
          <ArrowLeft size={18} weight="regular" />
          Back to Portfolio
        </button>
      </div>
    );
  }

  const galleryImages = images?.filter((img) => !img.isProcessShot) ?? [];
  const processImages = images?.filter((img) => img.isProcessShot) ?? [];

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Image */}
      <div
        ref={heroRef}
        className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden"
      >
        <img
          src={project.heroImageUrl}
          alt={project.title}
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-10 max-w-screen-xl mx-auto">
          <span className="inline-block font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-3">
            {project.category}
          </span>
          <h1 className="font-serif text-hero-text text-h1 md:text-5xl lg:text-6xl">
            {project.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="max-w-screen-xl mx-auto px-6 md:px-10 py-16 md:py-24"
      >
        {/* Metadata */}
        <div className="content-animate grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 md:mb-24">
          <div className="md:col-span-2">
            <h2 className="font-serif text-foreground text-h3 mb-4">
              About this project
            </h2>
            <p className="font-sans text-neutral-200 text-body-lg font-light leading-relaxed">
              {project.description}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-1">
                Category
              </p>
              <p className="font-sans text-foreground text-body-lg">
                {project.category}
              </p>
            </div>
            {project.externalLink && (
              <div>
                <p className="font-mono text-label uppercase tracking-widest text-tertiary text-xs mb-1">
                  External Link
                </p>
                <a
                  href={project.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-sans text-tertiary hover:text-foreground transition-colors duration-300 text-body-lg"
                >
                  View Project
                  <ArrowSquareOut size={18} weight="regular" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        {!imagesPending && galleryImages.length > 0 && (
          <div className="content-animate mb-16 md:mb-24">
            <h2 className="font-serif text-foreground text-h3 mb-8">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-md bg-secondary"
                >
                  <img
                    src={img.url}
                    alt={img.caption ?? project.title}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  {img.caption && (
                    <p className="font-sans text-neutral-400 text-body px-4 py-3 font-light">
                      {img.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Behind the Scenes */}
        {!imagesPending && processImages.length > 0 && (
          <div className="content-animate mb-16 md:mb-24">
            <h2 className="font-serif text-foreground text-h3 mb-8">
              Behind the Scenes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {processImages.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-md bg-secondary"
                >
                  <img
                    src={img.url}
                    alt={img.caption ?? "Process shot"}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  {img.caption && (
                    <p className="font-sans text-neutral-400 text-body px-4 py-3 font-light">
                      {img.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back Navigation */}
        <div className="content-animate pt-8 border-t border-border">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 font-sans font-normal uppercase tracking-widest text-label text-neutral-300 hover:text-tertiary transition-colors duration-300"
          >
            <ArrowLeft size={18} weight="regular" />
            Back to Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
