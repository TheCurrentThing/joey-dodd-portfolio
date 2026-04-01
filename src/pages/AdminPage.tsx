import { useEffect, useState } from "react";
import {
  FloppyDisk,
  PencilSimple,
  Plus,
  TrashSimple,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { projectImageService, projectService } from "../lib/database";
import { uploadImage } from "../lib/storage";
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectWithImages,
} from "../types/project";

type DragState = {
  imageId: string;
  projectId: string;
};

export default function AdminPage() {
  const { signOut } = useAuth();
  const [projects, setProjects] = useState<ProjectWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<ProjectWithImages | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    title: "",
    slug: "",
    description: "",
    category: "",
    featured: false,
    published: true,
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingImageOrderFor, setSavingImageOrderFor] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data, error: requestError } = await projectService.getAll();

    if (requestError) {
      setError("Failed to load projects");
    } else {
      setProjects(data || []);
    }

    setLoading(false);
  };

  const toProjectPayload = (): ProjectCreateInput => ({
    title: formData.title?.trim() || "",
    slug: formData.slug?.trim() || "",
    description: formData.description?.trim() || null,
    category: formData.category?.trim() || null,
    thumbnail_url: editingProject?.thumbnail_url || null,
    featured: formData.featured ?? false,
    published: formData.published ?? true,
    sort_order: editingProject?.sort_order ?? projects.length,
  });

  const handleCreateProject = async () => {
    if (!formData.title || !formData.slug) {
      setError("Title and slug are required");
      return;
    }

    const { data, error: requestError } = await projectService.create(toProjectPayload());
    if (requestError || !data) {
      setError("Failed to create project");
      return;
    }

    setProjects([...projects, { ...data, images: [] }]);
    setShowCreateForm(false);
    resetForm();
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !formData.title || !formData.slug) {
      setError("Title and slug are required");
      return;
    }

    const updates: ProjectUpdateInput = {
      ...toProjectPayload(),
      thumbnail_url: editingProject.thumbnail_url,
      sort_order: editingProject.sort_order,
    };

    const { error: requestError } = await projectService.update(editingProject.id, updates);
    if (requestError) {
      setError("Failed to update project");
      return;
    }

    setProjects(
      projects.map((project) =>
        project.id === editingProject.id ? { ...project, ...updates } : project
      )
    );
    setEditingProject(null);
    resetForm();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    const { error: requestError } = await projectService.delete(projectId);
    if (requestError) {
      setError("Failed to delete project");
      return;
    }

    setProjects(projects.filter((project) => project.id !== projectId));
  };

  const handleImageUpload = async (projectId: string, files: FileList) => {
    setUploadingImages(true);
    setError("");

    try {
      const currentProject = projects.find((project) => project.id === projectId);
      const startingOrder = currentProject?.images.length ?? 0;
      let firstUploadedUrl: string | null = null;

      const uploadPromises = Array.from(files).map(async (file, index) => {
        const result = await uploadImage(file);
        if (!result.success) {
          throw new Error(result.error);
        }

        if (!firstUploadedUrl) {
          firstUploadedUrl = result.url;
        }

        const { error: createError } = await projectImageService.create({
          project_id: projectId,
          image_url: result.url,
          sort_order: startingOrder + index,
        });

        if (createError) {
          throw createError;
        }
      });

      await Promise.all(uploadPromises);

      if (firstUploadedUrl && !currentProject?.thumbnail_url) {
        await projectService.update(projectId, { thumbnail_url: firstUploadedUrl });
      }

      await loadProjects();
    } catch {
      setError("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    const { error: requestError } = await projectImageService.delete(imageId);
    if (requestError) {
      setError("Failed to delete image");
      return;
    }

    await loadProjects();
  };

  const reorderImages = async (
    projectId: string,
    sourceImageId: string,
    destinationImageId: string
  ) => {
    if (sourceImageId === destinationImageId) {
      return;
    }

    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    const sourceIndex = project.images.findIndex((image) => image.id === sourceImageId);
    const destinationIndex = project.images.findIndex(
      (image) => image.id === destinationImageId
    );

    if (sourceIndex === -1 || destinationIndex === -1) {
      return;
    }

    const reorderedImages = [...project.images];
    const [movedImage] = reorderedImages.splice(sourceIndex, 1);
    reorderedImages.splice(destinationIndex, 0, movedImage);

    const normalizedImages = reorderedImages.map((image, index) => ({
      ...image,
      sort_order: index,
    }));

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === projectId ? { ...item, images: normalizedImages } : item
      )
    );
    setSavingImageOrderFor(projectId);
    setDragState(null);
    setDragOverImageId(null);

    const { error: requestError } = await projectImageService.reorder(
      projectId,
      normalizedImages.map((image) => image.id)
    );

    if (requestError) {
      setError("Failed to save image order");
      await loadProjects();
    }

    setSavingImageOrderFor(null);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      category: "",
      featured: false,
      published: true,
    });
    setError("");
  };

  const startEditing = (project: ProjectWithImages) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      slug: project.slug,
      description: project.description || "",
      category: project.category || "",
      featured: project.featured,
      published: project.published,
    });
  };

  const categories = [
    "Photography",
    "Digital Art",
    "Mixed Media",
    "Sculpture",
    "Installation",
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={() => void signOut()}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-600 p-4 text-white">
            {error}
            <button onClick={() => setError("")} className="float-right ml-4">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={20} />
            Create New Project
          </button>
        </div>

        {(showCreateForm || editingProject) && (
          <div className="mb-8 rounded-lg bg-gray-800 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingProject(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Title *">
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(event) =>
                    setFormData({ ...formData, title: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  required
                />
              </Field>

              <Field label="Slug *">
                <input
                  type="text"
                  value={formData.slug || ""}
                  onChange={(event) =>
                    setFormData({ ...formData, slug: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  required
                />
              </Field>

              <Field label="Category">
                <select
                  value={formData.category || ""}
                  onChange={(event) =>
                    setFormData({ ...formData, category: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.featured || false}
                    onChange={(event) =>
                      setFormData({ ...formData, featured: event.target.checked })
                    }
                    className="rounded"
                  />
                  Featured
                </label>

                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.published || false}
                    onChange={(event) =>
                      setFormData({ ...formData, published: event.target.checked })
                    }
                    className="rounded"
                  />
                  Published
                </label>
              </div>

              <Field label="Description" className="md:col-span-2">
                <textarea
                  value={formData.description || ""}
                  onChange={(event) =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingProject(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-300 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  void (editingProject ? handleUpdateProject() : handleCreateProject())
                }
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white transition-colors hover:bg-green-700"
              >
                <FloppyDisk size={20} />
                {editingProject ? "Update" : "Create"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg bg-gray-800 p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{project.title}</h3>
                  <p className="text-gray-400">{project.category || "Uncategorized"}</p>
                  <div className="mt-2 flex gap-2">
                    {project.featured && (
                      <span className="rounded bg-yellow-600 px-2 py-1 text-xs">
                        Featured
                      </span>
                    )}
                    {project.published ? (
                      <span className="rounded bg-green-600 px-2 py-1 text-xs">
                        Published
                      </span>
                    ) : (
                      <span className="rounded bg-red-600 px-2 py-1 text-xs">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(project)}
                    className="p-2 text-blue-400 hover:text-blue-300"
                  >
                    <PencilSimple size={20} />
                  </button>
                  <button
                    onClick={() => void handleDeleteProject(project.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <TrashSimple size={20} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-white">
                      Images ({project.images.length})
                    </h4>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-gray-500">
                      Drag and drop to reorder
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(event) =>
                        event.target.files &&
                        void handleImageUpload(project.id, event.target.files)
                      }
                      className="hidden"
                      id={`upload-${project.id}`}
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor={`upload-${project.id}`}
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                    >
                      <UploadSimple size={16} />
                      {uploadingImages ? "Uploading..." : "Upload Images"}
                    </label>
                  </div>
                </div>

                {project.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {project.images.map((image, index) => {
                      const isDragging = dragState?.imageId === image.id;
                      const isDropTarget = dragOverImageId === image.id;

                      return (
                        <div
                          key={image.id}
                          className={`group relative rounded-lg border transition-all ${
                            isDropTarget
                              ? "border-blue-400 ring-2 ring-blue-500/40"
                              : "border-transparent"
                          } ${isDragging ? "opacity-50" : "opacity-100"}`}
                          draggable
                          onDragStart={() => {
                            setDragState({ imageId: image.id, projectId: project.id });
                            setDragOverImageId(image.id);
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            if (dragState?.projectId === project.id) {
                              setDragOverImageId(image.id);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverImageId === image.id) {
                              setDragOverImageId(null);
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (dragState?.projectId === project.id) {
                              void reorderImages(project.id, dragState.imageId, image.id);
                            }
                          }}
                          onDragEnd={() => {
                            setDragState(null);
                            setDragOverImageId(null);
                          }}
                        >
                          <img
                            src={image.image_url}
                            alt=""
                            className="h-24 w-full rounded-lg object-cover"
                          />
                          <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white">
                            {index + 1}
                          </div>
                          <button
                            onClick={() => void handleDeleteImage(image.id)}
                            className="absolute right-1 top-1 rounded bg-red-600 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No images uploaded yet</p>
                )}

                {savingImageOrderFor === project.id && (
                  <p className="mt-3 text-sm text-blue-300">Saving image order...</p>
                )}
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-gray-400">
                No projects yet. Create your first project.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      {children}
    </div>
  );
}
