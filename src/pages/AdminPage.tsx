import { useCallback, useEffect, useRef, useState } from "react";
import {
  CaretDown,
  CaretUp,
  CheckCircle,
  FloppyDisk,
  ImageSquare,
  Plus,
  SignOut,
  Star,
  TrashSimple,
  UploadSimple,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { projectImageService, projectService } from "../lib/database";
import { isVideoUrl, uniqueMediaUrls } from "../lib/media";
import { getPublicUrl, listImages, uploadImage } from "../lib/storage";
import type { ProjectWithImages } from "../types/project";

const BROWSE_FOLDERS = ["projects", "thumbnails", "heroes", "gallery"];
const CATEGORIES = [
  "Character Design",
  "Illustration",
  "Concept Art",
  "Product / Toy Design",
  "Graphic / Logo Work",
  "Personal Work",
];

type StorageFile = {
  name: string;
  folder: string;
  publicUrl: string;
};

type UploadStatus =
  | { state: "idle" }
  | { state: "uploading" }
  | { state: "done"; message: string }
  | { state: "error"; message: string };

type DragState = {
  imageId: string;
  projectId: string;
};

type ProjectFormState = {
  title: string;
  slug: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  leadImageUrl: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
};

type MediaUploadItem = {
  id: string;
  url: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getInitialForm(project?: ProjectWithImages): ProjectFormState {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    category: project?.category ?? CATEGORIES[0],
    description: project?.description ?? "",
    thumbnailUrl: project?.thumbnail_url ?? "",
    leadImageUrl: project?.images[0]?.image_url ?? "",
    featured: project?.featured ?? false,
    published: project?.published ?? true,
    sortOrder: project?.sort_order ?? 0,
  };
}

function StorageBrowser({
  initialFolder,
  onSelect,
  onClose,
}: {
  initialFolder: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [folder, setFolder] = useState(initialFolder);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFolder, setCustomFolder] = useState("");

  const loadFolder = useCallback(async (targetFolder: string) => {
    setLoading(true);
    setError(null);

    const { files: rawFiles, error: requestError } = await listImages(targetFolder);
    if (requestError) {
      setFiles([]);
      setError(requestError);
      setLoading(false);
      return;
    }

    setFiles(
      rawFiles
        .filter((file) => file.name !== ".emptyFolderPlaceholder")
        .map((file) => ({
          name: file.name,
          folder: targetFolder,
          publicUrl: getPublicUrl(`${targetFolder}/${file.name}`),
        }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFolder(folder);
  }, [folder, loadFolder]);

  const handleCustomFolder = () => {
    const nextFolder = customFolder.trim().replace(/^\/|\/$/g, "");
    if (!nextFolder) {
      return;
    }

    setFolder(nextFolder);
    void loadFolder(nextFolder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h3 className="font-serif text-lg text-white">Browse Storage</h3>
          <button
            onClick={onClose}
            className="text-xl leading-none text-neutral-400 transition-colors duration-200 hover:text-white"
            aria-label="Close storage browser"
          >
            ×
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 px-5 py-3">
          {BROWSE_FOLDERS.map((browseFolder) => (
            <button
              key={browseFolder}
              onClick={() => setFolder(browseFolder)}
              className={`rounded px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors duration-200 ${
                folder === browseFolder
                  ? "bg-amber-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {browseFolder}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <input
              value={customFolder}
              onChange={(event) => setCustomFolder(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleCustomFolder();
                }
              }}
              placeholder="Custom folder path..."
              className="w-44 rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={handleCustomFolder}
              className="rounded bg-neutral-700 px-3 py-1.5 text-xs text-white transition-colors duration-200 hover:bg-neutral-600"
            >
              Go
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded bg-neutral-800"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="py-12 text-center font-mono text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
              <ImageSquare size={40} />
              <p className="text-sm">
                No media found in{" "}
                <code className="font-mono text-amber-400">/{folder}</code>
              </p>
              {folder !== "projects" && (
                <button
                  type="button"
                  onClick={() => setFolder("projects")}
                  className="rounded border border-neutral-700 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-neutral-300 transition-colors duration-200 hover:border-amber-500 hover:text-white"
                >
                  View Legacy /projects Uploads
                </button>
              )}
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {files.map((file) => (
                <button
                  key={file.publicUrl}
                  onClick={() => {
                    onSelect(file.publicUrl);
                    onClose();
                  }}
                  className="group relative aspect-square overflow-hidden rounded bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title={file.name}
                >
                  {isVideoUrl(file.publicUrl) ? (
                    <video
                      src={file.publicUrl}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={file.publicUrl}
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/40">
                    <CheckCircle
                      size={28}
                      weight="fill"
                      className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    />
                  </div>
                  <p className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 font-mono text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {file.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageUploader({
  label,
  folder,
  value,
  helperText,
  accept = "image/*",
  onUploaded,
}: {
  label: string;
  folder: string;
  value: string;
  helperText?: string;
  accept?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>({ state: "idle" });
  const [showBrowser, setShowBrowser] = useState(false);

  const handleFile = async (file: File) => {
    setStatus({ state: "uploading" });
    const result = await uploadImage(file, folder);

    if (!result.success) {
      setStatus({ state: "error", message: result.error });
      return;
    }

    onUploaded(result.url);
    setStatus({ state: "done", message: "Uploaded successfully" });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs uppercase tracking-widest text-amber-400">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowBrowser(true)}
          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-neutral-400 transition-colors duration-200 hover:text-amber-400"
        >
          <ImageSquare size={13} />
          Browse Storage
        </button>
      </div>

      <div
        className="relative flex min-h-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-neutral-700 bg-neutral-900 transition-colors duration-300 hover:border-amber-500"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) {
            void handleFile(file);
          }
        }}
      >
        {value ? (
          isVideoUrl(value) ? (
            <video
              src={value}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={value}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-neutral-500">
            <ImageSquare size={32} />
            <span className="text-center text-sm">Click or drag to upload</span>
          </div>
        )}

        {status.state === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="animate-pulse text-sm text-white">Uploading...</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
          event.target.value = "";
        }}
      />

      {helperText && <p className="text-xs text-neutral-500">{helperText}</p>}

      {status.state === "done" && (
        <p className="flex items-center gap-1 font-mono text-xs text-green-400">
          <CheckCircle size={14} />
          {status.message}
        </p>
      )}

      {status.state === "error" && (
        <p className="flex items-center gap-1 font-mono text-xs text-red-400">
          <WarningCircle size={14} />
          {status.message}
        </p>
      )}

      {showBrowser && (
        <StorageBrowser
          initialFolder={folder}
          onSelect={(url) => {
            onUploaded(url);
            setStatus({ state: "done", message: "Selected from storage" });
          }}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}

async function ensureLeadImage(
  projectId: string,
  leadImageUrl: string,
  currentImages: ProjectWithImages["images"]
) {
  if (!leadImageUrl) {
    return { error: null as string | null };
  }

  const existing = currentImages.find((image) => image.image_url === leadImageUrl);
  if (existing) {
    const orderedIds = [
      existing.id,
      ...currentImages.filter((image) => image.id !== existing.id).map((image) => image.id),
    ];
    const { error } = await projectImageService.reorder(projectId, orderedIds);
    return { error: error ? "Failed to update lead media order." : null };
  }

  const { data, error } = await projectImageService.create({
    project_id: projectId,
    image_url: leadImageUrl,
    sort_order: currentImages.length,
  });

  if (error || !data) {
    return { error: "Failed to save lead media." };
  }

  const orderedIds = [data.id, ...currentImages.map((image) => image.id)];
  const reorderResult = await projectImageService.reorder(projectId, orderedIds);
  return { error: reorderResult.error ? "Failed to order lead media." : null };
}

function MediaTile({
  url,
  badge,
  onRemove,
}: {
  url: string;
  badge?: string;
  onRemove?: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded bg-neutral-800">
      {isVideoUrl(url) ? (
        <video
          src={url}
          className="h-full w-full object-cover"
          muted
          loop
          autoPlay
          playsInline
        />
      ) : (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      )}
      {badge && (
        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-300">
          {badge}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded bg-black/70 p-1 text-red-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          title="Remove media"
        >
          <TrashSimple size={12} />
        </button>
      )}
    </div>
  );
}

function PendingMediaUploader({
  items,
  onChange,
  onError,
}: {
  items: MediaUploadItem[];
  onChange: (items: MediaUploadItem[]) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);

  const addUrls = (urls: string[]) => {
    const next = uniqueMediaUrls([...items.map((item) => item.url), ...urls]).map((url) => ({
      id: url,
      url,
    }));
    onChange(next);
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    onError("");

    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const result = await uploadImage(file, "gallery/uploads");
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.url;
        })
      );

      addUrls(uploads);
    } catch {
      onError("Failed to upload gallery media.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
            Gallery Media ({items.length})
          </span>
          <p className="mt-1 text-xs text-neutral-500">
            Add multiple images or videos now, or add more after the project is created.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBrowser(true)}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 font-sans text-xs uppercase tracking-widest text-neutral-300 transition-colors duration-300 hover:bg-neutral-700 disabled:opacity-50"
          >
            <ImageSquare size={14} />
            Browse Storage
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded bg-neutral-700 px-3 py-1.5 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-neutral-600 disabled:opacity-50"
          >
            <UploadSimple size={14} />
            {uploading ? "Uploading..." : "Upload Media"}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(event) => {
              if (event.target.files) {
                void handleFiles(event.target.files);
              }
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {showBrowser && (
        <StorageBrowser
          initialFolder="projects"
          onSelect={(url) => addUrls([url])}
          onClose={() => setShowBrowser(false)}
        />
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
          {items.map((item, index) => (
            <MediaTile
              key={item.id}
              url={item.url}
              badge={index === 0 ? "1" : undefined}
              onRemove={() =>
                onChange(items.filter((existingItem) => existingItem.id !== item.id))
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-neutral-700 px-4 py-8 text-center text-sm text-neutral-500">
          No gallery media queued yet.
        </div>
      )}
    </div>
  );
}

function ProjectForm({
  mode,
  project,
  defaultSortOrder,
  onSaved,
  onCancel,
  onError,
}: {
  mode: "create" | "edit";
  project?: ProjectWithImages;
  defaultSortOrder: number;
  onSaved: () => Promise<void>;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState<ProjectFormState>(() =>
    project ? getInitialForm(project) : { ...getInitialForm(), sortOrder: defaultSortOrder }
  );
  const [pendingMediaItems, setPendingMediaItems] = useState<MediaUploadItem[]>(() =>
    mode === "create"
      ? []
      : (project?.images ?? []).map((image) => ({ id: image.id, url: image.image_url }))
  );
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(project?.slug));

  useEffect(() => {
    setForm(project ? getInitialForm(project) : { ...getInitialForm(), sortOrder: defaultSortOrder });
    setPendingMediaItems(
      mode === "create"
        ? []
        : (project?.images ?? []).map((image) => ({ id: image.id, url: image.image_url }))
    );
    setSlugTouched(Boolean(project?.slug));
  }, [defaultSortOrder, mode, project]);

  const setTitle = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: slugTouched ? current.slug : slugify(title),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.slug.trim()) {
      onError("Title and slug are required.");
      return;
    }

    if (!form.thumbnailUrl) {
      onError("Thumbnail image is required.");
      return;
    }

    setSaving(true);
    onError("");

    if (mode === "create") {
      const { data, error } = await projectService.create({
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        thumbnail_url: form.thumbnailUrl,
        featured: form.featured,
        published: form.published,
        sort_order: form.sortOrder,
      });

      if (error || !data) {
        setSaving(false);
        onError("Failed to create project.");
        return;
      }

      const mediaUrls = uniqueMediaUrls([
        form.leadImageUrl,
        ...pendingMediaItems.map((item) => item.url),
      ]);

      if (mediaUrls.length > 0) {
        for (const [index, mediaUrl] of mediaUrls.entries()) {
          const { error: mediaError } = await projectImageService.create({
            project_id: data.id,
            image_url: mediaUrl,
            sort_order: index,
          });

          if (mediaError) {
            setSaving(false);
            onError("Failed to save gallery media.");
            return;
          }
        }
      }

      await onSaved();
      setSaving(false);
      onCancel();
      return;
    }

    if (!project) {
      setSaving(false);
      return;
    }

    const { error } = await projectService.update(project.id, {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      thumbnail_url: form.thumbnailUrl,
      featured: form.featured,
      published: form.published,
      sort_order: form.sortOrder,
    });

    if (error) {
      setSaving(false);
      onError("Failed to update project.");
      return;
    }

    const leadResult = await ensureLeadImage(project.id, form.leadImageUrl, project.images);
    if (leadResult.error) {
      setSaving(false);
      onError(leadResult.error);
      return;
    }

    await onSaved();
    setSaving(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-lg border border-neutral-700 bg-neutral-900 p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl text-white">
            {mode === "create" ? "New Project" : "Project Details"}
          </h3>
          <p className="mt-1 text-sm text-neutral-400">
            {mode === "create"
              ? "Create the project record, upload a thumbnail, and queue gallery media."
              : "Update project metadata without leaving the artwork manager."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-neutral-500 transition-colors duration-200 hover:text-white"
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label="Title *">
          <input
            value={form.title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Project title"
            className="w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </FormField>

        <FormField label="Slug *">
          <input
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setForm((current) => ({ ...current, slug: slugify(event.target.value) }));
            }}
            placeholder="project-slug"
            className="w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label="Category">
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
            className="w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Sort Order">
          <input
            type="number"
            value={form.sortOrder}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sortOrder: Number(event.target.value) || 0,
              }))
            }
            className="w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
        </FormField>
      </div>

      <FormField label="Description">
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          rows={4}
          placeholder="Short description of the project..."
          className="w-full resize-none rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ImageUploader
          label="Thumbnail Image *"
          folder="thumbnails"
          value={form.thumbnailUrl}
          onUploaded={(url) =>
            setForm((current) => ({
              ...current,
              thumbnailUrl: url,
            }))
          }
        />
        <ImageUploader
          label="Hero / Lead Media"
          folder="heroes"
          value={form.leadImageUrl}
          accept="image/*,video/*"
          helperText="Used as the first gallery item and project-page lead media."
          onUploaded={(url) =>
            setForm((current) => ({
              ...current,
              leadImageUrl: url,
            }))
          }
        />
      </div>

      {mode === "create" && (
        <PendingMediaUploader
          items={pendingMediaItems}
          onChange={setPendingMediaItems}
          onError={onError}
        />
      )}

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-3 select-none">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) =>
              setForm((current) => ({ ...current, featured: event.target.checked }))
            }
            className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-neutral-200">Feature on home page</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3 select-none">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) =>
              setForm((current) => ({ ...current, published: event.target.checked }))
            }
            className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-neutral-200">Published</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-neutral-700 px-5 py-2 font-sans text-sm uppercase tracking-widest text-neutral-400 transition-colors duration-300 hover:border-neutral-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded bg-amber-600 px-6 py-2 font-sans text-sm uppercase tracking-widest text-white transition-colors duration-300 hover:bg-amber-500 disabled:opacity-50"
        >
          <FloppyDisk size={16} />
          {saving ? "Saving..." : mode === "create" ? "Save Project" : "Update Project"}
        </button>
      </div>
    </form>
  );
}

function GalleryImageUploader({
  project,
  onRefresh,
  onError,
}: {
  project: ProjectWithImages;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    onError("");

    try {
      const startingOrder = project.images.length;
      const uploads = Array.from(files).map(async (file, index) => {
        const result = await uploadImage(file, `gallery/${project.id}`);
        if (!result.success) {
          throw new Error(result.error);
        }

        const { error } = await projectImageService.create({
          project_id: project.id,
          image_url: result.url,
          sort_order: startingOrder + index,
        });

        if (error) {
          throw error;
        }
      });

      await Promise.all(uploads);
      await onRefresh();
    } catch {
      onError("Failed to upload gallery media.");
    } finally {
      setUploading(false);
    }
  };

  const handleBrowsePick = async (url: string) => {
    onError("");
    const { error } = await projectImageService.create({
      project_id: project.id,
      image_url: url,
      sort_order: project.images.length,
    });

    if (error) {
      onError("Failed to attach gallery media.");
      return;
    }

    await onRefresh();
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this media item from the project gallery?")) {
      return;
    }

    const { error } = await projectImageService.delete(imageId);
    if (error) {
      onError("Failed to delete media item.");
      return;
    }

    await onRefresh();
  };

  const reorderImages = async (sourceImageId: string, destinationImageId: string) => {
    if (sourceImageId === destinationImageId) {
      return;
    }

    const sourceIndex = project.images.findIndex((image) => image.id === sourceImageId);
    const destinationIndex = project.images.findIndex(
      (image) => image.id === destinationImageId
    );

    if (sourceIndex === -1 || destinationIndex === -1) {
      return;
    }

    const reordered = [...project.images];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    setSavingOrder(true);
    setDragState(null);
    setDragOverImageId(null);

    const { error } = await projectImageService.reorder(
      project.id,
      reordered.map((image) => image.id)
    );

    if (error) {
      onError("Failed to save media order.");
    }

    await onRefresh();
    setSavingOrder(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
            Gallery Media ({project.images.length})
          </span>
          <p className="mt-1 text-xs text-neutral-500">
            Drag to reorder. The first item is used as the lead media on project pages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBrowser(true)}
            disabled={uploading || savingOrder}
            className="inline-flex items-center gap-1.5 rounded border border-neutral-600 bg-neutral-800 px-3 py-1.5 font-sans text-xs uppercase tracking-widest text-neutral-300 transition-colors duration-300 hover:bg-neutral-700 disabled:opacity-50"
          >
            <ImageSquare size={14} />
            Browse Storage
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || savingOrder}
            className="inline-flex items-center gap-1.5 rounded bg-neutral-700 px-3 py-1.5 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-neutral-600 disabled:opacity-50"
          >
            <UploadSimple size={14} />
            {uploading ? "Uploading..." : "Upload New"}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
            accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
      </div>

      {showBrowser && (
        <StorageBrowser
          initialFolder={`gallery/${project.id}`}
          onSelect={(url) => {
            void handleBrowsePick(url);
          }}
          onClose={() => setShowBrowser(false)}
        />
      )}

      {project.images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
          {project.images.map((image, index) => {
            const isDragging = dragState?.imageId === image.id;
            const isDropTarget = dragOverImageId === image.id;

            return (
              <div
                key={image.id}
                className={`group relative aspect-square overflow-hidden rounded bg-neutral-800 transition-all ${
                  isDropTarget ? "ring-2 ring-amber-500/70" : ""
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
                    void reorderImages(dragState.imageId, image.id);
                  }
                }}
                onDragEnd={() => {
                  setDragState(null);
                  setDragOverImageId(null);
                }}
              >
                <MediaTile
                  url={image.image_url}
                  badge={index === 0 ? "Lead" : undefined}
                  onRemove={() => void handleDeleteImage(image.id)}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded border border-dashed border-neutral-700 px-4 py-8 text-center text-sm text-neutral-500">
          No gallery media yet. Upload artwork or video, or browse the storage bucket.
        </div>
      )}

      {savingOrder && (
        <p className="font-mono text-xs text-amber-400">Saving media order...</p>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  onRefresh,
  onDelete,
  onError,
}: {
  project: ProjectWithImages;
  onRefresh: () => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const toggleFeatured = async () => {
    onError("");
    const { error } = await projectService.update(project.id, {
      featured: !project.featured,
    });

    if (error) {
      onError("Failed to update featured state.");
      return;
    }

    await onRefresh();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900">
      <div className="flex items-center gap-4 p-4">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-neutral-800">
          {project.thumbnail_url ? (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageSquare size={20} className="text-neutral-600" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-serif text-white">{project.title}</h4>
            {project.featured && (
              <Star size={14} weight="fill" className="flex-shrink-0 text-amber-400" />
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs uppercase tracking-widest text-neutral-400">
            {project.category || "Uncategorized"}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
            <span>{project.published ? "Published" : "Draft"}</span>
            <span>{project.images.length} media items</span>
            <span>Order {project.sort_order}</span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => void toggleFeatured()}
            className={`rounded p-1.5 transition-colors duration-200 ${
              project.featured
                ? "text-amber-400 hover:text-amber-300"
                : "text-neutral-500 hover:text-amber-400"
            }`}
            title={project.featured ? "Unfeature" : "Mark as featured"}
          >
            <Star size={16} weight={project.featured ? "fill" : "regular"} />
          </button>

          <button
            onClick={() => setExpanded((current) => !current)}
            className="rounded p-1.5 text-neutral-400 transition-colors duration-200 hover:text-white"
            title="Toggle project details"
          >
            {expanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>

          {confirmingDelete ? (
            <>
              <button
                onClick={() => void onDelete(project.id)}
                className="rounded border border-red-800 px-2 py-1 font-mono text-xs text-red-400 transition-colors duration-200 hover:bg-red-900"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded border border-neutral-700 px-2 py-1 font-mono text-xs text-neutral-400 transition-colors duration-200 hover:bg-neutral-800"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded p-1.5 text-neutral-500 transition-colors duration-200 hover:text-red-400"
              title="Delete project"
            >
              <TrashSimple size={16} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800 px-4 pb-4">
          <div className="grid grid-cols-1 gap-4 pt-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <ProjectForm
              mode="edit"
              project={project}
              defaultSortOrder={project.sort_order}
              onSaved={onRefresh}
              onCancel={() => setExpanded(false)}
              onError={onError}
            />
            <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <GalleryImageUploader project={project} onRefresh={onRefresh} onError={onError} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { signOut } = useAuth();
  const [projects, setProjects] = useState<ProjectWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    const { data, error: requestError } = await projectService.getAll();

    if (requestError) {
      setError("Failed to load projects.");
      setLoading(false);
      return;
    }

    setProjects(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (projectId: string) => {
    const { error: requestError } = await projectService.delete(projectId);

    if (requestError) {
      setError("Failed to delete project.");
      return;
    }

    setError("");
    await loadProjects();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 pt-20">
        <p className="text-neutral-400">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-24">
      <div className="mx-auto max-w-screen-lg px-6 md:px-10">
        <div className="flex items-start justify-between gap-4 py-12">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-amber-400">
              Admin Panel
            </p>
            <h1 className="font-serif text-4xl text-white">Portfolio Manager</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Upload artwork, queue multiple images or videos, and manage the portfolio without
              flattening the presentation layer.
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            className="mt-1 inline-flex flex-shrink-0 items-center gap-2 rounded border border-neutral-700 px-4 py-2 font-sans text-xs uppercase tracking-widest text-neutral-400 transition-colors duration-300 hover:border-neutral-500 hover:text-neutral-200"
          >
            <SignOut size={14} />
            Sign Out
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-400 transition-colors duration-200 hover:text-red-200"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-white">
            Projects ({projects.length})
          </h2>
          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-amber-500"
            >
              <Plus size={16} weight="bold" />
              New Project
            </button>
          )}
        </div>

        {showNewForm && (
          <div className="mb-6">
            <ProjectForm
              mode="create"
              defaultSortOrder={projects.length}
              onSaved={loadProjects}
              onCancel={() => setShowNewForm(false)}
              onError={setError}
            />
          </div>
        )}

        {projects.length > 0 ? (
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onRefresh={loadProjects}
                onDelete={handleDeleteProject}
                onError={setError}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-700 py-16 text-center">
            <ImageSquare size={40} className="mx-auto mb-3 text-neutral-600" />
            <p className="text-sm text-neutral-500">
              No projects yet. Create your first one above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-xs uppercase tracking-widest text-amber-400">
        {label}
      </label>
      {children}
    </div>
  );
}
