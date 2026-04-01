import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react";
import { projectService } from "../lib/database";
import { useState } from "react";
import type { ProjectImage, ProjectWithImages } from "../types/project";

type DetailProject = ProjectWithImages & {
  externalLink?: string;
};

function isProcessShot(image: ProjectImage) {
  return /process|wip|sketch|bts|behind/i.test(image.image_url);
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<DetailProject | null>(null);
  const [projectPending, setProjectPending] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setProjectPending(false);
      setProjectError("Project not found.");
      return;
    }

    projectService.getProjectWithImages(slug).then(({ data, error }) => {
      if (error || !data) {
        setProjectError("Project not found.");
      } else {
        setProject(data as DetailProject);
      }
      setProjectPending(false);
    });
  }, [slug]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!project) return;

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: "power2.out" }
        );
      }

      if (contentRef.current) {
        const elements = contentRef.current.querySelectorAll(".content-animate");
        gsap.fromTo(
          elements,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.3,
          }
        );
      }
    });

    return () => ctx.revert();
  }, [project]);

  if (projectPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-24">
        <p className="font-sans text-body-lg text-neutral-400">
          Loading project...
        </p>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background pt-24">
        <p className="font-sans text-body-lg text-warning">Project not found.</p>
        <button
          onClick={() => navigate("/portfolio")}
          className="inline-flex items-center gap-2 rounded-md bg-cta-primary-bg px-6 py-3 font-sans text-label font-normal uppercase tracking-widest text-cta-primary-fg transition-colors duration-300 hover:bg-tertiary"
        >
          <ArrowLeft size={18} weight="regular" />
          Back to Portfolio
        </button>
      </div>
    );
  }

  const heroImage = project.thumbnail_url || project.images[0]?.image_url || "";
  const processImages = project.images.filter(isProcessShot);
  const galleryImages = (() => {
    const regular = project.images.filter((image) => !isProcessShot(image));
    if (regular.length > 0) return regular;
    if (project.images.length > 0) return project.images;
    if (project.thumbnail_url) {
      return [
        {
          id: `${project.id}-thumbnail`,
          project_id: project.id,
          image_url: project.thumbnail_url,
          sort_order: 0,
          created_at: project.created_at,
        },
      ];
    }
    return [];
  })();

  return (
    <div className="min-h-screen bg-background pt-20">
      <div
        ref={heroRef}
        className="relative h-[60vh] w-full overflow-hidden md:h-[75vh]"
      >
        {heroImage && (
          <img
            src={heroImage}
            alt={project.title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-screen-xl px-6 pb-10 md:px-10">
          <span className="mb-3 inline-block font-mono text-xs uppercase tracking-widest text-tertiary">
            {project.category || "Uncategorized"}
          </span>
          <h1 className="font-serif text-h1 text-hero-text md:text-5xl lg:text-6xl">
            {project.title}
          </h1>
        </div>
      </div>

      <div
        ref={contentRef}
        className="mx-auto max-w-screen-xl px-6 py-16 md:px-10 md:py-24"
      >
        <div className="content-animate mb-16 grid grid-cols-1 gap-12 md:mb-24 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="mb-4 font-serif text-h3 text-foreground">
              About this project
            </h2>
            <p className="font-sans text-body-lg font-light leading-relaxed text-neutral-200">
              {project.description}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-tertiary">
                Category
              </p>
              <p className="font-sans text-body-lg text-foreground">
                {project.category || "Uncategorized"}
              </p>
            </div>
            {project.externalLink && (
              <div>
                <p className="mb-1 font-mono text-xs uppercase tracking-widest text-tertiary">
                  External Link
                </p>
                <a
                  href={project.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-sans text-body-lg text-tertiary transition-colors duration-300 hover:text-foreground"
                >
                  View Project
                  <ArrowSquareOut size={18} weight="regular" />
                </a>
              </div>
            )}
          </div>
        </div>

        {galleryImages.length > 0 && (
          <div className="content-animate mb-16 md:mb-24">
            <h2 className="mb-8 font-serif text-h3 text-foreground">Gallery</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {galleryImages.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-md bg-secondary">
                  <img
                    src={image.image_url}
                    alt={project.title}
                    className="h-auto w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {processImages.length > 0 && (
          <div className="content-animate mb-16 md:mb-24">
            <h2 className="mb-8 font-serif text-h3 text-foreground">
              Behind the Scenes
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {processImages.map((image) => (
                <div key={image.id} className="overflow-hidden rounded-md bg-secondary">
                  <img
                    src={image.image_url}
                    alt="Process shot"
                    className="h-auto w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="content-animate border-t border-border pt-8">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 font-sans text-label font-normal uppercase tracking-widest text-neutral-300 transition-colors duration-300 hover:text-tertiary"
          >
            <ArrowLeft size={18} weight="regular" />
            Back to Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
