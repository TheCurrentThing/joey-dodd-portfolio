import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth, useMutation, useQuery } from "@animaapp/playground-react-sdk";
import {
  UploadSimple,
  Trash,
  Plus,
  CaretDown,
  CaretUp,
  Star,
  StarHalf,
  ImageSquare,
  CheckCircle,
  WarningCircle,
  SignOut,
} from "@phosphor-icons/react";
import { uploadImage, listFolder, getPublicUrl } from "../lib/storage";

// ── Storage Browser ──────────────────────────────────────────────────────────

const BROWSE_FOLDERS = ["thumbnails", "heroes", "gallery"];

type StorageFile = { name: string; folder: string; publicUrl: string };

function StorageBrowser({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [folder, setFolder] = useState(BROWSE_FOLDERS[0]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFolder, setCustomFolder] = useState("");

  const load = useCallback(async (f: string) => {
    setLoading(true);
    setError(null);
    const { files: raw, error: err } = await listFolder(f);
    if (err) {
      setError(err);
      setFiles([]);
    } else {
      setFiles(
        raw
          .filter((r) => r.name !== ".emptyFolderPlaceholder")
          .map((r) => ({
            name: r.name,
            folder: f,
            publicUrl: getPublicUrl(`${f}/${r.name}`),
          }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(folder);
  }, [folder, load]);

  const handleCustomFolder = () => {
    const f = customFolder.trim().replace(/^\/|\/$/g, "");
    if (f) { setFolder(f); load(f); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h3 className="font-serif text-white text-lg">Browse Storage</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Folder tabs + custom */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-neutral-800">
          {BROWSE_FOLDERS.map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`font-mono text-xs uppercase tracking-widest px-3 py-1.5 rounded transition-colors duration-200 ${
                folder === f
                  ? "bg-amber-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <input
              value={customFolder}
              onChange={(e) => setCustomFolder(e.target.value)}
              placeholder="Custom folder path…"
              onKeyDown={(e) => e.key === "Enter" && handleCustomFolder()}
              className="bg-neutral-800 border border-neutral-700 text-white text-xs px-2 py-1.5 rounded w-44 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleCustomFolder}
              className="bg-neutral-700 text-white text-xs px-3 py-1.5 rounded hover:bg-neutral-600 transition-colors duration-200"
            >
              Go
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square bg-neutral-800 rounded animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-red-400 text-sm font-mono text-center py-12">{error}</p>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-500">
              <ImageSquare size={40} />
              <p className="font-sans text-sm">No images found in <code className="font-mono text-amber-400">/{folder}</code></p>
            </div>
          )}

          {!loading && !error && files.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {files.map((f) => (
                <button
                  key={f.publicUrl}
                  onClick={() => { onSelect(f.publicUrl); onClose(); }}
                  className="group relative aspect-square bg-neutral-800 rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-amber-500"
                  title={f.name}
                >
                  <img
                    src={f.publicUrl}
                    alt={f.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                    <CheckCircle
                      size={28}
                      weight="fill"
                      className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    />
                  </div>
                  <p className="absolute bottom-0 inset-x-0 bg-black/60 text-xs text-white font-mono px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {f.name}
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

// ── ImageUploader (with browse button) ───────────────────────────────────────

const CATEGORIES = [
  "Character Design",
  "Illustration",
  "Concept Art",
  "Product / Toy Design",
  "Graphic / Logo Work",
  "Personal Work",
];

type UploadStatus = { state: "idle" | "uploading" | "done" | "error"; message?: string };

function ImageUploader({
  label,
  onUploaded,
  folder,
  accept = "image/*",
}: {
  label: string;
  folder: string;
  onUploaded: (url: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>({ state: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setStatus({ state: "uploading" });
    const result = await uploadImage(file, folder);
    if (result.success) {
      onUploaded(result.publicUrl);
      setStatus({ state: "done", message: "Uploaded successfully" });
    } else {
      setStatus({ state: "error", message: result.error });
    }
  };

  const handleBrowsePick = (url: string) => {
    setPreview(url);
    onUploaded(url);
    setStatus({ state: "done", message: "Selected from storage" });
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
          className="font-mono text-xs uppercase tracking-widest text-neutral-400 hover:text-amber-400 transition-colors duration-200 flex items-center gap-1"
        >
          <ImageSquare size={13} /> Browse Storage
        </button>
      </div>
      <div
        className="relative border-2 border-dashed border-neutral-700 rounded-md overflow-hidden cursor-pointer hover:border-amber-500 transition-colors duration-300 flex items-center justify-center bg-neutral-900"
        style={{ minHeight: 120 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-500 p-4">
            <ImageSquare size={32} weight="regular" />
            <span className="font-sans text-sm text-center">
              Click or drag to upload
            </span>
          </div>
        )}
        {status.state === "uploading" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="font-sans text-white text-sm animate-pulse">
              Uploading...
            </span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {status.state === "done" && (
        <p className="flex items-center gap-1 text-green-400 text-xs font-mono">
          <CheckCircle size={14} /> {status.message}
        </p>
      )}
      {status.state === "error" && (
        <p className="flex items-center gap-1 text-red-400 text-xs font-mono">
          <WarningCircle size={14} /> {status.message}
        </p>
      )}
      {showBrowser && (
        <StorageBrowser
          onSelect={handleBrowsePick}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}

function NewProjectForm({ onClose }: { onClose: () => void }) {
  const { create, isPending } = useMutation("Project");
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    description: "",
    thumbnailUrl: "",
    heroImageUrl: "",
    isFeatured: false,
    sortOrder: 0,
    externalLink: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.thumbnailUrl) { setError("Thumbnail image is required."); return; }
    if (!form.heroImageUrl) { setError("Hero image is required."); return; }
    setError("");
    try {
      await create({
        title: form.title,
        category: form.category,
        description: form.description,
        thumbnailUrl: form.thumbnailUrl,
        heroImageUrl: form.heroImageUrl,
        isFeatured: form.isFeatured,
        sortOrder: form.sortOrder,
        externalLink: form.externalLink || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 flex flex-col gap-5"
    >
      <h3 className="font-serif text-white text-xl mb-1">New Project</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-widest text-amber-400">Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Project title"
            className="bg-neutral-800 border border-neutral-600 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-widest text-amber-400">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="bg-neutral-800 border border-neutral-600 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-amber-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs uppercase tracking-widest text-amber-400">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Short description of the project..."
          rows={3}
          className="bg-neutral-800 border border-neutral-600 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-amber-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ImageUploader
          label="Thumbnail Image *"
          folder="thumbnails"
          onUploaded={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))}
        />
        <ImageUploader
          label="Hero Image *"
          folder="heroes"
          onUploaded={(url) => setForm((f) => ({ ...f, heroImageUrl: url }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-widest text-amber-400">Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            className="bg-neutral-800 border border-neutral-600 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs uppercase tracking-widest text-amber-400">External Link</label>
          <input
            type="url"
            value={form.externalLink}
            onChange={(e) => setForm((f) => ({ ...f, externalLink: e.target.value }))}
            placeholder="https://artstation.com/..."
            className="bg-neutral-800 border border-neutral-600 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors duration-200 ${form.isFeatured ? "bg-amber-500 border-amber-500" : "border-neutral-600 bg-neutral-800"}`}
          onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
        >
          {form.isFeatured && <Star size={12} weight="fill" className="text-black" />}
        </div>
        <span className="font-sans text-neutral-200 text-sm">
          Feature on home page
        </span>
      </label>

      {error && (
        <p className="flex items-center gap-1 text-red-400 text-sm font-mono">
          <WarningCircle size={14} /> {error}
        </p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className="font-sans text-sm uppercase tracking-widest text-neutral-400 px-5 py-2 border border-neutral-700 rounded hover:border-neutral-500 transition-colors duration-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="font-sans text-sm uppercase tracking-widest bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-500 transition-colors duration-300 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Project"}
        </button>
      </div>
    </form>
  );
}

function GalleryImageUploader({ projectId }: { projectId: string }) {
  const { create, remove, isPending } = useMutation("ProjectImage");
  const { data: images } = useQuery("ProjectImage", {
    where: { projectId },
    orderBy: { sortOrder: "asc" },
  });
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showGalleryBrowser, setShowGalleryBrowser] = useState(false);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadImage(file, `gallery/${projectId}`);
      if (result.success) {
        await create({
          projectId,
          url: result.publicUrl,
          isProcessShot: false,
          sortOrder: (images?.length ?? 0) + i,
        });
      }
    }
    setUploading(false);
  };

  const handleBrowsePick = async (url: string) => {
    await create({
      projectId,
      url,
      isProcessShot: false,
      sortOrder: images?.length ?? 0,
    });
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
          Gallery Images ({images?.length ?? 0})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGalleryBrowser(true)}
            disabled={uploading || isPending}
            className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded hover:bg-neutral-700 transition-colors duration-300 disabled:opacity-50 border border-neutral-600"
          >
            <ImageSquare size={14} />
            Browse Storage
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || isPending}
            className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest bg-neutral-700 text-white px-3 py-1.5 rounded hover:bg-neutral-600 transition-colors duration-300 disabled:opacity-50"
          >
            <UploadSimple size={14} />
            {uploading ? "Uploading..." : "Upload New"}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
      </div>
      {showGalleryBrowser && (
        <StorageBrowser
          onSelect={async (url) => { await handleBrowsePick(url); }}
          onClose={() => setShowGalleryBrowser(false)}
        />
      )}
      {images && images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square bg-neutral-800 rounded overflow-hidden">
              <img
                src={img.url}
                alt={img.caption ?? "Gallery image"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                onClick={() => remove(img.id)}
                className="absolute top-1 right-1 bg-black/70 text-red-400 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Remove image"
              >
                <Trash size={12} />
              </button>
              {img.isProcessShot && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-amber-400 text-xs text-center py-0.5 font-mono">
                  Process
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project }: { project: { id: string; title: string; category: string; thumbnailUrl: string; isFeatured: boolean; sortOrder: number } }) {
  const { remove, update } = useMutation("Project");
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="border border-neutral-700 rounded-lg overflow-hidden bg-neutral-900">
      <div className="flex items-center gap-4 p-4">
        <div className="w-14 h-14 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
          {project.thumbnailUrl ? (
            <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageSquare size={20} className="text-neutral-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-white truncate">{project.title}</h4>
            {project.isFeatured && (
              <StarHalf size={14} weight="fill" className="text-amber-400 flex-shrink-0" title="Featured" />
            )}
          </div>
          <p className="font-mono text-xs text-neutral-400 uppercase tracking-widest mt-0.5">
            {project.category}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => update(project.id, { isFeatured: !project.isFeatured })}
            className={`p-1.5 rounded transition-colors duration-200 ${project.isFeatured ? "text-amber-400 hover:text-amber-300" : "text-neutral-500 hover:text-amber-400"}`}
            title={project.isFeatured ? "Unfeature" : "Mark as featured"}
          >
            <Star size={16} weight={project.isFeatured ? "fill" : "regular"} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded text-neutral-400 hover:text-white transition-colors duration-200"
            title="Toggle gallery"
          >
            {expanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={() => { remove(project.id); setConfirmDelete(false); }}
                className="text-xs font-mono text-red-400 px-2 py-1 border border-red-800 rounded hover:bg-red-900 transition-colors duration-200"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-mono text-neutral-400 px-2 py-1 border border-neutral-700 rounded hover:bg-neutral-800 transition-colors duration-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded text-neutral-500 hover:text-red-400 transition-colors duration-200"
              title="Delete project"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-neutral-800 px-4 pb-4">
          <GalleryImageUploader projectId={project.id} />
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, isPending: authPending, isAnonymous, login, logout } = useAuth();
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: projects, isPending: projectsPending } = useQuery("Project", {
    orderBy: { sortOrder: "asc" },
  });

  if (authPending) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="font-sans text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (isAnonymous || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="font-serif text-white text-3xl mb-2">Admin Panel</h1>
          <p className="font-sans text-neutral-400 text-sm">Sign in to manage your portfolio</p>
        </div>
        <button
          onClick={login}
          className="bg-amber-600 text-white font-sans font-normal uppercase tracking-widest text-sm px-8 py-4 rounded-md hover:bg-amber-500 transition-colors duration-300"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-24">
      <div className="max-w-screen-lg mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="py-12 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-2">
              Admin Panel
            </p>
            <h1 className="font-serif text-white text-4xl">Portfolio Manager</h1>
            <p className="font-sans text-neutral-400 text-sm mt-2">
              Upload artwork to Supabase Storage and manage your projects.
            </p>
          </div>
          <button
            onClick={logout}
            className="flex-shrink-0 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-neutral-400 border border-neutral-700 px-4 py-2 rounded hover:border-neutral-500 hover:text-neutral-200 transition-colors duration-300 mt-1"
          >
            <SignOut size={14} />
            Sign Out
          </button>
        </div>

        {/* New Project Button */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-white text-2xl">
            Projects ({projects?.length ?? 0})
          </h2>
          {!showNewForm && (
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-2 bg-amber-600 text-white font-sans font-normal uppercase tracking-widest text-xs px-5 py-2.5 rounded-md hover:bg-amber-500 transition-colors duration-300"
            >
              <Plus size={16} weight="bold" />
              New Project
            </button>
          )}
        </div>

        {/* New Project Form */}
        {showNewForm && (
          <div className="mb-6">
            <NewProjectForm onClose={() => setShowNewForm(false)} />
          </div>
        )}

        {/* Project List */}
        {projectsPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects && projects.length > 0 ? (
              projects.map((p) => <ProjectRow key={p.id} project={p} />)
            ) : (
              <div className="py-16 text-center border border-dashed border-neutral-700 rounded-lg">
                <ImageSquare size={40} className="text-neutral-600 mx-auto mb-3" />
                <p className="font-sans text-neutral-500 text-sm">No projects yet. Create your first one above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
