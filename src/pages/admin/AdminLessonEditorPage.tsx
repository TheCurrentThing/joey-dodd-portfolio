import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FloppyDisk, Plus, TrashSimple } from "@phosphor-icons/react";
import type { LessonEditorErrors, LessonEditorState, LessonModule } from "../../types/lesson";
import {
  createNewLessonEditorState,
  deleteLessonModule,
  normalizeModuleForSave,
  saveLessonEditorState,
} from "../../lib/lessons/admin";
import { fetchAdminLessonEditor, fetchAdminLessonModules } from "../../lib/lessons/queries";
import { normalizeSortOrder } from "../../lib/lessons/ordering";
import { useUnsavedChangesWarning } from "../../hooks/useUnsavedChangesWarning";
import LessonContentView from "../../components/lessons/LessonContentView";
import AdminPortalNav from "../../components/admin/AdminPortalNav";
import FormField from "../../components/admin/FormField";
import MediaPicker from "../../components/admin/MediaPicker";
import LessonBlockEditor, { createLessonBlock } from "../../components/admin/LessonBlockEditor";
import LessonResourceEditor from "../../components/admin/LessonResourceEditor";

const EMPTY_ERRORS: LessonEditorErrors = {
  module: [],
  blocks: {},
  resources: {},
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toEditorState(module: LessonModule & { blocks: any[]; resources: any[] }): LessonEditorState {
  return {
    module: {
      id: module.id,
      title: module.title,
      slug: module.slug,
      short_description: module.short_description ?? "",
      cover_image_url: module.cover_image_url ?? "",
      is_free: module.is_free,
      is_published: module.is_published,
      sort_order: module.sort_order,
      category: module.category ?? "",
      level: module.level ?? "",
      age_range: module.age_range ?? "",
    },
    blocks: module.blocks,
    resources: module.resources,
  };
}

function snapshotState(state: LessonEditorState) {
  return JSON.stringify({
    module: state.module,
    blocks: normalizeSortOrder(state.blocks),
    resources: normalizeSortOrder(state.resources),
  });
}

function toPreviewModule(module: LessonEditorState["module"]): LessonModule {
  const now = new Date().toISOString();
  return {
    ...module,
    short_description: module.short_description || null,
    cover_image_url: module.cover_image_url || null,
    category: module.category || null,
    level: module.level || null,
    age_range: module.age_range || null,
    created_at: now,
    updated_at: now,
  };
}

export default function AdminLessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [editorState, setEditorState] = useState<LessonEditorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<LessonEditorErrors>(EMPTY_ERRORS);
  const [previewMode, setPreviewMode] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        if (isNew) {
          const { data: modules, error: modulesError } = await fetchAdminLessonModules();
          if (!active) {
            return;
          }

          const nextState = createNewLessonEditorState(modules?.length ?? 0);
          setEditorState(nextState);
          setSavedSnapshot(snapshotState(nextState));
          setValidationErrors(EMPTY_ERRORS);
          setError(modulesError?.message ?? null);
          return;
        }

        const { data, error: requestError } = await fetchAdminLessonEditor(id!);
        if (!active) {
          return;
        }

        if (requestError || !data) {
          setError(requestError?.message || "Lesson not found.");
          setEditorState(null);
          return;
        }

        const nextState = toEditorState(data);
        setEditorState(nextState);
        setSavedSnapshot(snapshotState(nextState));
        setValidationErrors(EMPTY_ERRORS);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setEditorState(isNew ? createNewLessonEditorState(0) : null);
        setError(loadError instanceof Error ? loadError.message : "Failed to load lesson editor.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [id, isNew]);

  const dirty = useMemo(() => {
    if (!editorState) {
      return false;
    }

    return savedSnapshot !== snapshotState(editorState);
  }, [editorState, savedSnapshot]);

  useUnsavedChangesWarning(dirty, "You have unsaved lesson changes. Leave without saving?");

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 pt-24 text-center text-neutral-400">Loading editor...</div>;
  }

  if (!editorState) {
    return (
      <div className="min-h-screen bg-neutral-950 pt-24 pb-24">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <div className="rounded-2xl border border-red-500/20 bg-red-950/20 px-6 py-8 text-red-200">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-red-300">Lesson Editor Error</p>
            <h1 className="mt-3 font-serif text-3xl text-white">Unable to load this lesson editor</h1>
            <p className="mt-3 text-sm text-red-100">{error ?? "An unexpected error occurred."}</p>
            <div className="mt-6">
              <Link
                to="/admin/lessons"
                className="inline-flex rounded border border-red-400/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-red-100 transition-colors duration-300 hover:border-red-300 hover:text-white"
              >
                Back to Lessons
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const previewModule = toPreviewModule(editorState.module);

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-24">
      <div className="mx-auto max-w-screen-xl px-6 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4 py-10">
          <div>
            <Link
              to="/admin/lessons"
              className="font-mono text-xs uppercase tracking-[0.35em] text-neutral-500 transition-colors duration-300 hover:text-tertiary"
            >
              Back to Lessons
            </Link>
            <h1 className="mt-3 font-serif text-4xl text-white">
              {isNew ? "New Lesson Module" : "Edit Lesson Module"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-400">
              Build the lesson in stacked blocks, reuse canonical resources, and preview the full
              flow before publishing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode((current) => !current)}
              className={`rounded border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] ${
                previewMode
                  ? "border-tertiary bg-tertiary text-background"
                  : "border-border text-neutral-200"
              }`}
            >
              {previewMode ? "Back To Edit" : "Preview"}
            </button>
            {!isNew && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("Delete this lesson module?")) {
                    return;
                  }

                  const { error: deleteError } = await deleteLessonModule(editorState.module.id);
                  if (deleteError) {
                    setError(deleteError.message);
                    return;
                  }

                  navigate("/admin/lessons");
                }}
                className="rounded border border-red-500/30 px-4 py-2 text-red-300"
              >
                <TrashSimple size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                setSaving(true);
                setError(null);

                const normalized = {
                  ...editorState,
                  module: normalizeModuleForSave(editorState.module),
                };

                const result = await saveLessonEditorState(normalized);
                setSaving(false);
                setValidationErrors(result.validationErrors);

                if (result.error || !result.data) {
                  setError(result.error?.message || "Failed to save lesson.");
                  return;
                }

                const nextState = toEditorState(result.data);
                setEditorState(nextState);
                setSavedSnapshot(snapshotState(nextState));
                setSlugTouched(true);

                if (isNew) {
                  navigate(`/admin/lessons/${nextState.module.id}/edit`, { replace: true });
                }
              }}
              className="inline-flex items-center gap-2 rounded bg-amber-600 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-amber-500 disabled:opacity-50"
              disabled={saving}
            >
              <FloppyDisk size={16} />
              {saving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
            </button>
          </div>
        </div>

        <AdminPortalNav />

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {validationErrors.module.length > 0 && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            {validationErrors.module.join(" ")}
          </div>
        )}

        {previewMode ? (
          <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
            <LessonContentView
              module={previewModule}
              blocks={normalizeSortOrder(editorState.blocks)}
              resources={normalizeSortOrder(editorState.resources)}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-secondary p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Module Metadata</p>
                  <h2 className="mt-2 font-serif text-h3 text-foreground">Overview</h2>
                </div>
                {dirty && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200">
                    Unsaved Changes
                  </span>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Title">
                  <input
                    value={editorState.module.title}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: {
                                ...current.module,
                                title: event.target.value,
                                slug: slugTouched ? current.module.slug : slugify(event.target.value),
                              },
                            }
                          : current
                      )
                    }
                    className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                  />
                </FormField>
                <FormField label="Slug" helperText="Auto-generated until you edit it manually.">
                  <input
                    value={editorState.module.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: {
                                ...current.module,
                                slug: slugify(event.target.value),
                              },
                            }
                          : current
                      );
                    }}
                    className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                  />
                </FormField>
                <FormField label="Category">
                  <input
                    value={editorState.module.category ?? ""}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: { ...current.module, category: event.target.value },
                            }
                          : current
                      )
                    }
                    className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                  />
                </FormField>
                <FormField label="Level">
                  <input
                    value={editorState.module.level ?? ""}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: { ...current.module, level: event.target.value },
                            }
                          : current
                      )
                    }
                    className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                  />
                </FormField>
                <FormField label="Age Range">
                  <input
                    value={editorState.module.age_range ?? ""}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: { ...current.module, age_range: event.target.value },
                            }
                          : current
                      )
                    }
                    className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                  />
                </FormField>
                <FormField label="Sort Order">
                  <input
                    type="number"
                    value={editorState.module.sort_order}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: {
                                ...current.module,
                                sort_order: Number(event.target.value) || 0,
                              },
                            }
                          : current
                      )
                    }
                    className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                  />
                </FormField>
              </div>

              <div className="mt-5">
                <FormField label="Short Description">
                  <textarea
                    rows={4}
                    value={editorState.module.short_description ?? ""}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: {
                                ...current.module,
                                short_description: event.target.value,
                              },
                            }
                          : current
                      )
                    }
                    className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                  />
                </FormField>
              </div>

              <div className="mt-5">
                <MediaPicker
                  label="Cover Image"
                  assetType="cover"
                  visibility="public"
                  value={{ publicUrl: editorState.module.cover_image_url }}
                  onChange={(value) =>
                    setEditorState((current) =>
                      current
                        ? {
                            ...current,
                            module: {
                              ...current.module,
                              cover_image_url: value.publicUrl || "",
                            },
                          }
                        : current
                    )
                  }
                  accept="image/*"
                  folder="covers"
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-6">
                <label className="flex items-center gap-3 text-sm text-neutral-200">
                  <input
                    type="checkbox"
                    checked={editorState.module.is_free}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: { ...current.module, is_free: event.target.checked },
                            }
                          : current
                      )
                    }
                    className="h-4 w-4 rounded border-border bg-neutral-900 text-amber-500 focus:ring-amber-500"
                  />
                  Free Preview
                </label>
                <label className="flex items-center gap-3 text-sm text-neutral-200">
                  <input
                    type="checkbox"
                    checked={editorState.module.is_published}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              module: { ...current.module, is_published: event.target.checked },
                            }
                          : current
                      )
                    }
                    className="h-4 w-4 rounded border-border bg-neutral-900 text-amber-500 focus:ring-amber-500"
                  />
                  Published
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-secondary p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Lesson Blocks</p>
                  <h2 className="mt-2 font-serif text-h3 text-foreground">Ordered Content</h2>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "text",
                  "image",
                  "video",
                  "split_text_image",
                  "split_text_video",
                  "callout",
                  "resource",
                  "gallery",
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              blocks: [
                                ...normalizeSortOrder(current.blocks),
                                createLessonBlock(type as any, current.blocks.length),
                              ],
                            }
                          : current
                      )
                    }
                    className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-200"
                  >
                    <Plus size={12} />
                    {type.replaceAll("_", " ")}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <LessonBlockEditor
                  blocks={editorState.blocks}
                  resources={editorState.resources}
                  moduleIsFree={editorState.module.is_free}
                  errors={validationErrors.blocks}
                  onChange={(blocks) =>
                    setEditorState((current) => (current ? { ...current, blocks } : current))
                  }
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-secondary p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Resources</p>
                  <h2 className="mt-2 font-serif text-h3 text-foreground">Canonical Downloads</h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditorState((current) =>
                      current
                        ? {
                            ...current,
                            resources: [
                              ...normalizeSortOrder(current.resources),
                              {
                                id: crypto.randomUUID(),
                                module_id: current.module.id,
                                label: "",
                                url: null,
                                storage_path: null,
                                file_kind: null,
                                sort_order: current.resources.length,
                              },
                            ],
                          }
                        : current
                    )
                  }
                  className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-200"
                >
                  <Plus size={12} />
                  Add Resource
                </button>
              </div>

              <div className="mt-6">
                <LessonResourceEditor
                  resources={editorState.resources}
                  moduleIsFree={editorState.module.is_free}
                  errors={validationErrors.resources}
                  onChange={(resources) =>
                    setEditorState((current) => (current ? { ...current, resources } : current))
                  }
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
