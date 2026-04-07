import { Copy, TrashSimple } from "@phosphor-icons/react";
import type { LessonEditorErrors, LessonResourceInput } from "../../types/lesson";
import { duplicateLessonResource } from "../../lib/lessons/admin";
import { moveOrderedItem, normalizeSortOrder } from "../../lib/lessons/ordering";
import FormField from "./FormField";
import MediaPicker from "./MediaPicker";

export default function LessonResourceEditor({
  resources,
  moduleIsFree,
  errors,
  onChange,
}: {
  resources: LessonResourceInput[];
  moduleIsFree: boolean;
  errors: LessonEditorErrors["resources"];
  onChange: (resources: LessonResourceInput[]) => void;
}) {
  const normalized = normalizeSortOrder(resources);

  return (
    <div className="space-y-4">
      {normalized.map((resource, index) => (
        <div key={resource.id} className="rounded-xl border border-border bg-secondary p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-serif text-h4 text-foreground">{resource.label || `Resource ${index + 1}`}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                Managed lesson resource
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange(moveOrderedItem(normalized, index, index - 1))}
                disabled={index === 0}
                className="rounded border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 disabled:opacity-40"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => onChange(moveOrderedItem(normalized, index, index + 1))}
                disabled={index === normalized.length - 1}
                className="rounded border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 disabled:opacity-40"
              >
                Down
              </button>
              <button
                type="button"
                onClick={() => onChange(duplicateLessonResource(normalized, resource.id))}
                className="rounded border border-border px-3 py-1.5 text-neutral-300"
                title="Duplicate resource"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => onChange(normalized.filter((item) => item.id !== resource.id))}
                className="rounded border border-red-500/30 px-3 py-1.5 text-red-300"
                title="Delete resource"
              >
                <TrashSimple size={14} />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField label="Label">
              <input
                value={resource.label}
                onChange={(event) =>
                  onChange(
                    normalized.map((item) =>
                      item.id === resource.id ? { ...item, label: event.target.value } : item
                    )
                  )
                }
                className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </FormField>
            <FormField label="External URL" helperText="Use this only for truly external materials.">
              <input
                type="url"
                value={resource.url ?? ""}
                onChange={(event) =>
                  onChange(
                    normalized.map((item) =>
                      item.id === resource.id
                        ? { ...item, url: event.target.value || null, storage_path: null }
                        : item
                    )
                  )
                }
                className="w-full rounded-md border border-border bg-neutral-900 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
                placeholder="https://..."
              />
            </FormField>
          </div>

          <div className="mt-5">
            <MediaPicker
              label="Managed File"
              assetType="resource"
              visibility={moduleIsFree ? "public" : "private"}
              value={{
                storagePath: resource.storage_path,
                publicUrl: null,
                fileKind: resource.file_kind,
              }}
              onChange={(value) =>
                onChange(
                  normalized.map((item) =>
                    item.id === resource.id
                      ? {
                          ...item,
                          storage_path: value.storagePath ?? null,
                          file_kind: value.fileKind ?? null,
                          url: null,
                        }
                      : item
                  )
                )
              }
              helperText="Managed lesson files live here so blocks and the module resources list can both reuse them."
              accept=".pdf,.zip,.doc,.docx,image/*"
              folder="resources"
            />
          </div>

          {errors[resource.id]?.length ? (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">
              {errors[resource.id].join(" ")}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
