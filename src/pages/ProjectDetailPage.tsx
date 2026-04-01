import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { projectService } from "../lib/database";
import type { ProjectWithImages } from "../types/project";
import AmbientBackdrop from "../components/AmbientBackdrop";
import ArtDirectedImage from "../components/ArtDirectedImage";
import { fallbackArt, projectHeroImage } from "../lib/art";

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ProjectWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Project not found");
      return;
    }

    projectService.getProjectWithImages(slug).then(({ data, error: requestError }) => {
      if (requestError) {
        setError("Project not found");
      } else if (data) {
        setProject(data);
      }

      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-8 py-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">Project Not Found</h1>
          <Link
            to="/portfolio"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = projectHeroImage(project);
  const gallery = project.images.length > 0
    ? project.images
    : project.thumbnail_url
      ? [
          {
            id: `${project.id}-thumbnail`,
            image_url: project.thumbnail_url,
            project_id: project.id,
            sort_order: 0,
            created_at: project.created_at,
          },
        ]
      : [];

  return (
    <div className="min-h-screen overflow-hidden pt-20">
      <section className="relative min-h-[72vh]">
        <AmbientBackdrop intensity="strong" />
        <ArtDirectedImage
          src={heroImage}
          fallback={fallbackArt(project.slug)}
          alt={project.title}
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,6,0.18)_0%,rgba(5,5,6,0.48)_42%,rgba(5,5,6,0.96)_100%)]" />
        <div className="relative mx-auto flex min-h-[72vh] max-w-7xl items-end px-4 pb-12 pt-28 md:pb-16">
          <div className="max-w-3xl">
            <Link
              to="/portfolio"
              className="mb-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.28em] text-white/72 transition-colors hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to Portfolio
            </Link>
            <div>
              <span className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.32em] text-[#ddb779] backdrop-blur-sm">
                {project.category || "Selected Work"}
              </span>
              <h1 className="mt-6 font-serif text-[clamp(3rem,7vw,5.8rem)] leading-[0.96] text-white">
                {project.title}
              </h1>
              {project.description && (
                <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-200/90 md:text-xl">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.34fr_0.66fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ddb779]">Project Notes</p>
              <div className="mt-6 grid gap-5 text-sm text-neutral-300">
                <InfoRow label="Category" value={project.category || "Uncategorized"} />
                <InfoRow label="Images" value={String(gallery.length)} />
                <InfoRow label="Status" value={project.published ? "Published" : "Draft"} />
              </div>
            </div>
          </aside>

          <div className="grid gap-6 md:grid-cols-2">
            {gallery.length > 0 ? (
              gallery.map((image, index) => {
                const featured = index % 3 === 0;

                return (
                  <figure
                    key={image.id}
                    className={`overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d0d0f] shadow-[0_24px_70px_rgba(0,0,0,0.35)] ${
                      featured ? "md:col-span-2" : ""
                    }`}
                  >
                    <ArtDirectedImage
                      src={image.image_url}
                      fallback={fallbackArt(`${project.slug}-${index}`)}
                      alt={`${project.title} image ${index + 1}`}
                      imgClassName={`w-full ${featured ? "max-h-[42rem]" : "max-h-[30rem]"} object-cover transition-transform duration-700 hover:scale-[1.02]`}
                    />
                  </figure>
                );
              })
            ) : (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-8 py-20 text-center md:col-span-2">
                <p className="text-lg text-neutral-300">No images available for this project.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
      <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-500">{label}</p>
      <p className="mt-2 text-base text-white">{value}</p>
    </div>
  );
}
