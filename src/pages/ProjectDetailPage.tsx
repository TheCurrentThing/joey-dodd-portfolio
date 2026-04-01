import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { projectService } from "../lib/database";
import type { ProjectWithImages } from "../types/project";

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
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

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/portfolio"
          className="mb-8 inline-flex items-center gap-2 text-gray-300 transition-colors hover:text-white"
        >
          <ArrowLeft size={20} />
          Back to Portfolio
        </Link>

        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">
            {project.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-300">
            <span className="rounded-full bg-gray-800 px-3 py-1 text-sm">
              {project.category || "Uncategorized"}
            </span>
          </div>
        </div>

        {project.description && (
          <div className="mb-12 max-w-3xl">
            <p className="text-lg leading-relaxed text-gray-300">
              {project.description}
            </p>
          </div>
        )}

        {project.images.length > 0 && (
          <div className="space-y-8">
            {project.images.map((image, index) => (
              <div key={image.id} className="w-full">
                <img
                  src={image.image_url}
                  alt={`${project.title} - Image ${index + 1}`}
                  className="h-auto w-full rounded-lg shadow-lg"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {project.images.length === 0 && project.thumbnail_url && (
          <div className="w-full">
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="h-auto w-full rounded-lg shadow-lg"
              loading="lazy"
            />
          </div>
        )}

        {project.images.length === 0 && !project.thumbnail_url && (
          <div className="py-20 text-center">
            <p className="text-lg text-gray-400">
              No images available for this project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
