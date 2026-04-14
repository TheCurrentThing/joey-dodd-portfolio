import { useMemo, useState } from "react";
import { CaretDown, CaretUp, Copy, Plus, TrashSimple } from "@phosphor-icons/react";
import type {
  GalleryBlock,
  GalleryImageItem,
  LessonBlock,
  LessonBlockType,
  LessonEditorErrors,
  LessonLayoutType,
  LessonResourceInput,
} from "../../types/lesson";
import { LESSON_BLOCK_TYPE_OPTIONS, LESSON_LAYOUT_OPTIONS } from "../../types/lesson";
import { duplicateLessonBlock } from "../../lib/lessons/admin";
import { moveOrderedItem, normalizeSortOrder } from "../../lib/lessons/ordering";
import FormField from "./FormField";
import MediaPicker from "./MediaPicker";

function createBlock(type: LessonBlockType, sortOrder: number): LessonBlock {
  const base = {
    id: crypto.randomUUID(),
    layout_type: "standard" as LessonLayoutType,
    title: null,
    sort_order: sortOrder,
  };

  switch (type) {
    case "text":
      return { ...base, block_type: "text", body: "" };
    case "image":
      return { ...base, block_type: "image", media_url: "", caption: null, alt_text: null };
    case "video":
      return {
        ...base,
        block_type: "video",
        media_url: null,
        storage_path: null,
        poster_image_url: null,
        caption: null,
        settings: { videoSourceType: "embed", aspectRatio: "16:9" },
      };
    case "split_text_image":
      return {
        ...base,
        block_type: "split_text_image",
        layout_type: "media_right",
        body: "",
        media_url: "",
        caption: null,
        alt_text: null,
      };
    case "split_text_video":
      return {
        ...base,
        block_type: "split_text_video",
        layout_type: "media_right",
        body: "",
        media_url: null,
        storage_path: null,
        poster_image_url: null,
        caption: null,
        settings: { videoSourceType: "embed", aspectRatio: "16:9" },
      };
    case "callout":
      return {
        ...base,
        block_type: "callout",
        body: "",
        settings: { tone: "note" },
      };
    case "resource":
      return {
        ...base,
        block_type: "resource",
        body: "",
        resource_id: null,
        media_url: null,
        settings: { displayStyle: "card" },
      };
    case "gallery":
    default:
      return {
        ...base,
        block_type: "gallery",
        body: "",
        settings: {
          images: [],
          columns: 2,
        },
      };
  }
}

function BlockSummary({ block, resources }: { block: LessonBlock; resources: LessonResourceInput[] }) {
  switch (block.block_type) {
    case "text":
    case "callout":
      return block.body.slice(0, 80) || "No text yet";
    case "image":
      return block.media_url || "No image selected";
    case "video":
    case "split_text_video":
      return block.settings.videoSourceType === "embed"
        ? block.media_url || "No embed URL"
        : block.storage_path || "No uploaded video";
    case "split_text_image":
      return block.media_url || "No image selected";
    case "resource":
      return (
        resources.find((resource) => resource.id === block.resource_id)?.label ||
        block.media_url ||
        "No resource linked"
      );
    case "gallery":
      return `${block.settings.images.length} image${block.settings.images.length === 1 ? "" : "s"}`;
  }
}

function GalleryImageEditor({
  image,
  onChange,
  onDelete,
}: {
  image: GalleryImageItem;
  onChange: (image: GalleryImageItem) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-neutral-900/50 p-4">
      <div className="flex justify-end">
        <button type="button" onClick={onDelete} className="text-red-300">
          <TrashSimple size={14} />
        </button>
      </div>
      <MediaPicker
        label="Gallery Image"
        assetType="image"
        visibility="public"
        value={{ storagePath: image.storagePath ?? null, publicUrl: image.publicUrl ?? null }}
        onChange={(value) =>
          onChange({
            ...image,
            storagePath: value.storagePath ?? undefined,
            publicUrl: value.publicUrl ?? undefined,
          })
        }
        accept="image/*"
        folder="gallery"
      />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField label="Caption">
          <input
            value={image.caption ?? ""}
            onChange={(event) => onChange({ ...image, caption: event.target.value })}
            className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
          />
        </FormField>
        <FormField label="Alt Text">
          <input
            value={image.alt ?? ""}
            onChange={(event) => onChange({ ...image, alt: event.target.value })}
            className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
          />
        </FormField>
      </div>
    </div>
  );
}

function BlockFields({
  block,
  moduleIsFree,
  resources,
  onChange,
}: {
  block: LessonBlock;
  moduleIsFree: boolean;
  resources: LessonResourceInput[];
  onChange: (block: LessonBlock) => void;
}) {
  const resourceOptions = useMemo(
    () =>
      resources.map((resource) => ({
        value: resource.id,
        label: resource.label || "Untitled resource",
      })),
    [resources]
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          label="Heading"
          helperText="Headings still render above the block. When a module has multiple headings, the lesson page can also use them as step navigation sections."
        >
          <input
            value={block.title ?? ""}
            onChange={(event) => onChange({ ...block, title: event.target.value || null })}
            className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
          />
        </FormField>
        <FormField label="Layout">
          <select
            value={block.layout_type}
            onChange={(event) =>
              onChange({ ...block, layout_type: event.target.value as LessonLayoutType })
            }
            className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
          >
            {LESSON_LAYOUT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {(block.block_type === "text" || block.block_type === "callout") && (
        <FormField label="Body">
          <textarea
            rows={7}
            value={block.body}
            onChange={(event) => onChange({ ...block, body: event.target.value })}
            className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
          />
        </FormField>
      )}

      {block.block_type === "callout" && (
        <FormField label="Tone">
          <select
            value={block.settings.tone ?? "note"}
            onChange={(event) =>
              onChange({
                ...block,
                settings: {
                  tone: event.target.value as "note" | "tip" | "encouragement",
                },
              })
            }
            className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
          >
            <option value="note">Note</option>
            <option value="tip">Tip</option>
            <option value="encouragement">Encouragement</option>
          </select>
        </FormField>
      )}

      {(block.block_type === "image" || block.block_type === "split_text_image") && (
        <>
          {block.block_type === "split_text_image" && (
            <FormField label="Body">
              <textarea
                rows={6}
                value={block.body}
                onChange={(event) => onChange({ ...block, body: event.target.value })}
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </FormField>
          )}
          <MediaPicker
            label="Image"
            assetType="image"
            visibility="public"
            value={{ publicUrl: block.media_url, storagePath: null }}
            onChange={(value) =>
              onChange({
                ...block,
                media_url: value.publicUrl || "",
              } as LessonBlock)
            }
            accept="image/*"
            folder="images"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Caption">
              <input
                value={block.caption ?? ""}
                onChange={(event) =>
                  onChange({ ...block, caption: event.target.value || null } as LessonBlock)
                }
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </FormField>
            <FormField label="Alt Text">
              <input
                value={block.alt_text ?? ""}
                onChange={(event) =>
                  onChange({ ...block, alt_text: event.target.value || null } as LessonBlock)
                }
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </FormField>
          </div>
        </>
      )}

      {(block.block_type === "video" || block.block_type === "split_text_video") && (
        <>
          {block.block_type === "split_text_video" && (
            <FormField label="Body">
              <textarea
                rows={6}
                value={block.body}
                onChange={(event) => onChange({ ...block, body: event.target.value })}
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </FormField>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Video Mode">
              <select
                value={block.settings.videoSourceType}
                onChange={(event) =>
                  onChange({
                    ...block,
                    media_url: event.target.value === "embed" ? block.media_url : null,
                    storage_path: event.target.value === "upload" ? block.storage_path : null,
                    settings: {
                      ...block.settings,
                      videoSourceType: event.target.value as "embed" | "upload",
                    },
                  })
                }
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              >
                <option value="embed">Embed Video</option>
                <option value="upload">Uploaded Video</option>
              </select>
            </FormField>
            <FormField label="Aspect Ratio">
              <select
                value={block.settings.aspectRatio ?? "16:9"}
                onChange={(event) =>
                  onChange({
                    ...block,
                    settings: {
                      ...block.settings,
                      aspectRatio: event.target.value as "16:9" | "4:3" | "1:1",
                    },
                  })
                }
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              >
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
              </select>
            </FormField>
          </div>

          {block.settings.videoSourceType === "embed" ? (
            <MediaPicker
              label="Embed URL"
              assetType="video"
              visibility={moduleIsFree ? "public" : "private"}
              value={{ embedUrl: block.media_url }}
              onChange={() => {}}
              onExternalUrlChange={(url) =>
                onChange({
                  ...block,
                  media_url: url || null,
                  storage_path: null,
                })
              }
              externalLabel="Embed URL"
              helperText={
                moduleIsFree
                  ? "Free lessons can use public embeds. Paid lessons should use Vimeo/Loom or private uploads."
                  : "Paid lessons reject YouTube as the security model. Use Vimeo/Loom or a private upload."
              }
            />
          ) : (
            <MediaPicker
              label="Uploaded Video"
              assetType="video"
              visibility={moduleIsFree ? "public" : "private"}
              value={{ storagePath: block.storage_path }}
              onChange={(value) =>
                onChange({
                  ...block,
                  storage_path: value.storagePath ?? null,
                  media_url: null,
                })
              }
              accept="video/*"
              folder="videos"
            />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Poster Image URL">
              <input
                value={block.poster_image_url ?? ""}
                onChange={(event) =>
                  onChange({ ...block, poster_image_url: event.target.value || null })
                }
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </FormField>
            <FormField label="Caption">
              <input
                value={block.caption ?? ""}
                onChange={(event) => onChange({ ...block, caption: event.target.value || null })}
                className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              />
            </FormField>
          </div>

          <FormField label="Transcript">
            <textarea
              rows={5}
              value={block.settings.transcript ?? ""}
              onChange={(event) =>
                onChange({
                  ...block,
                  settings: {
                    ...block.settings,
                    transcript: event.target.value || undefined,
                  },
                })
              }
              className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            />
          </FormField>
        </>
      )}

      {block.block_type === "resource" && (
        <>
          <FormField
            label="Managed Resource"
            helperText="Choose a canonical lesson resource when this block points to a managed file."
          >
            <select
              value={block.resource_id ?? ""}
              onChange={(event) =>
                onChange({
                  ...block,
                  resource_id: event.target.value || null,
                  media_url: event.target.value ? null : block.media_url,
                })
              }
              className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            >
              <option value="">Select a resource from the Resources section</option>
              {resourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="External URL"
            helperText="Only use this when the resource lives outside the lesson system."
          >
            <input
              type="url"
              value={block.media_url ?? ""}
              onChange={(event) =>
                onChange({
                  ...block,
                  media_url: event.target.value || null,
                  resource_id: event.target.value ? null : block.resource_id,
                })
              }
              className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
              placeholder="https://..."
            />
          </FormField>
          <FormField label="Optional Description">
            <textarea
              rows={4}
              value={block.body ?? ""}
              onChange={(event) => onChange({ ...block, body: event.target.value || null })}
              className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            />
          </FormField>
        </>
      )}

      {block.block_type === "gallery" && (
        <>
          <FormField label="Intro Text">
            <textarea
              rows={4}
              value={block.body ?? ""}
              onChange={(event) => onChange({ ...block, body: event.target.value || null })}
              className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            />
          </FormField>
          <FormField label="Columns">
            <select
              value={block.settings.columns ?? 2}
              onChange={(event) =>
                onChange({
                  ...block,
                  settings: {
                    ...block.settings,
                    columns: Number(event.target.value),
                  },
                })
              }
              className="w-full rounded-md border border-border bg-neutral-950 px-4 py-3 text-white focus:border-tertiary focus:outline-none"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </FormField>
          <div className="space-y-3">
            {block.settings.images.map((image, imageIndex) => (
              <GalleryImageEditor
                key={`${block.id}-${imageIndex}`}
                image={image}
                onChange={(nextImage) => {
                  const nextImages = [...block.settings.images];
                  nextImages[imageIndex] = nextImage;
                  onChange({
                    ...block,
                    settings: {
                      ...block.settings,
                      images: nextImages,
                    },
                  } as GalleryBlock);
                }}
                onDelete={() =>
                  onChange({
                    ...block,
                    settings: {
                      ...block.settings,
                      images: block.settings.images.filter(
                        (_, currentIndex) => currentIndex !== imageIndex
                      ),
                    },
                  } as GalleryBlock)
                }
              />
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...block,
                  settings: {
                    ...block.settings,
                    images: [...block.settings.images, {}],
                  },
                } as GalleryBlock)
              }
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-neutral-300"
            >
              <Plus size={12} />
              Add Gallery Image
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function createLessonBlock(type: LessonBlockType, sortOrder: number) {
  return createBlock(type, sortOrder);
}

export default function LessonBlockEditor({
  blocks,
  resources,
  moduleIsFree,
  errors,
  onChange,
}: {
  blocks: LessonBlock[];
  resources: LessonResourceInput[];
  moduleIsFree: boolean;
  errors: LessonEditorErrors["blocks"];
  onChange: (blocks: LessonBlock[]) => void;
}) {
  const normalized = normalizeSortOrder(blocks);
  const [expandedId, setExpandedId] = useState<string | null>(normalized[0]?.id ?? null);

  return (
    <div className="space-y-4">
      {normalized.map((block, index) => {
        const isExpanded = expandedId === block.id;

        return (
          <div key={block.id} className="rounded-xl border border-border bg-secondary">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : block.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                <div className="min-w-0">
                  <p className="font-serif text-h4 text-foreground">
                    {
                      LESSON_BLOCK_TYPE_OPTIONS.find((option) => option.value === block.block_type)
                        ?.label
                    }
                  </p>
                  <p className="truncate font-sans text-sm text-neutral-400">
                    <BlockSummary block={block} resources={resources} />
                  </p>
                </div>
              </button>

              <div className="flex flex-wrap gap-2">
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
                  onClick={() => onChange(duplicateLessonBlock(normalized, block.id))}
                  className="rounded border border-border px-3 py-1.5 text-neutral-300"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(normalized.filter((item) => item.id !== block.id))}
                  className="rounded border border-red-500/30 px-3 py-1.5 text-red-300"
                >
                  <TrashSimple size={14} />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-border px-5 py-5">
                <BlockFields
                  block={block}
                  moduleIsFree={moduleIsFree}
                  resources={resources}
                  onChange={(nextBlock) =>
                    onChange(normalized.map((item) => (item.id === block.id ? nextBlock : item)))
                  }
                />
                {errors[block.id]?.length ? (
                  <div className="mt-5 rounded-lg border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">
                    {errors[block.id].join(" ")}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
