import { supabase } from "../supabase";
import type {
  CalloutBlock,
  GalleryBlock,
  GalleryBlockSettings,
  ImageBlock,
  LessonBlock,
  LessonModule,
  LessonModuleBlockRecord,
  LessonModuleInput,
  LessonModuleWithContent,
  LessonResource,
  LessonResourceInput,
  ResourceBlock,
  SplitTextImageBlock,
  SplitTextVideoBlock,
  TextBlock,
  VideoBlock,
} from "../../types/lesson";
import { normalizeSortOrder, sortBySortOrder } from "./ordering";

type ServiceResult<T> = Promise<{ data: T | null; error: Error | null }>;

function castObject(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function defaultVideoSettings(settings: Record<string, unknown> | null) {
  return {
    videoSourceType:
      settings?.videoSourceType === "upload" ? "upload" : ("embed" as const),
    aspectRatio:
      settings?.aspectRatio === "4:3" || settings?.aspectRatio === "1:1"
        ? settings.aspectRatio
        : ("16:9" as const),
    transcript: typeof settings?.transcript === "string" ? settings.transcript : undefined,
  };
}

function defaultCalloutSettings(settings: Record<string, unknown> | null) {
  return {
    tone:
      settings?.tone === "tip" || settings?.tone === "encouragement"
        ? settings.tone
        : ("note" as const),
  };
}

function defaultResourceSettings(settings: Record<string, unknown> | null) {
  return {
    displayStyle: settings?.displayStyle === "inline" ? "inline" : ("card" as const),
  };
}

function defaultGallerySettings(settings: Record<string, unknown> | null): GalleryBlockSettings {
  const rawImages = Array.isArray(settings?.images) ? settings.images : [];
  const images = rawImages
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      storagePath: typeof item.storagePath === "string" ? item.storagePath : undefined,
      publicUrl: typeof item.publicUrl === "string" ? item.publicUrl : undefined,
      caption: typeof item.caption === "string" ? item.caption : undefined,
      alt: typeof item.alt === "string" ? item.alt : undefined,
    }))
    .filter((item) => item.storagePath || item.publicUrl);

  const columns =
    typeof settings?.columns === "number" &&
    Number.isInteger(settings.columns) &&
    settings.columns >= 1 &&
    settings.columns <= 4
      ? settings.columns
      : 2;

  return { images, columns };
}

export function mapBlockRecordToBlock(record: LessonModuleBlockRecord): LessonBlock {
  const settings = castObject(record.settings);

  switch (record.block_type) {
    case "text":
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "text",
        layout_type: record.layout_type,
        title: record.title,
        body: record.body ?? "",
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies TextBlock;
    case "image":
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "image",
        layout_type: record.layout_type,
        title: record.title,
        media_url: record.media_url ?? "",
        caption: record.caption,
        alt_text: record.alt_text,
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies ImageBlock;
    case "video":
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "video",
        layout_type: record.layout_type,
        title: record.title,
        media_url: record.media_url,
        storage_path: record.storage_path,
        poster_image_url: record.poster_image_url,
        caption: record.caption,
        settings: defaultVideoSettings(settings),
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies VideoBlock;
    case "split_text_image":
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "split_text_image",
        layout_type: record.layout_type,
        title: record.title,
        body: record.body ?? "",
        media_url: record.media_url ?? "",
        caption: record.caption,
        alt_text: record.alt_text,
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies SplitTextImageBlock;
    case "split_text_video":
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "split_text_video",
        layout_type: record.layout_type,
        title: record.title,
        body: record.body ?? "",
        media_url: record.media_url,
        storage_path: record.storage_path,
        poster_image_url: record.poster_image_url,
        caption: record.caption,
        settings: defaultVideoSettings(settings),
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies SplitTextVideoBlock;
    case "callout":
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "callout",
        layout_type: record.layout_type,
        title: record.title,
        body: record.body ?? "",
        settings: defaultCalloutSettings(settings),
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies CalloutBlock;
    case "resource":
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "resource",
        layout_type: record.layout_type,
        title: record.title,
        body: record.body,
        resource_id: record.resource_id,
        media_url: record.media_url,
        settings: defaultResourceSettings(settings),
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies ResourceBlock;
    case "gallery":
    default:
      return {
        id: record.id,
        module_id: record.module_id,
        block_type: "gallery",
        layout_type: record.layout_type,
        title: record.title,
        body: record.body,
        settings: defaultGallerySettings(settings),
        sort_order: record.sort_order,
        created_at: record.created_at,
        updated_at: record.updated_at,
      } satisfies GalleryBlock;
  }
}

export function serializeBlockForUpsert(block: LessonBlock, moduleId: string) {
  const base = {
    id: block.id,
    module_id: moduleId,
    block_type: block.block_type,
    layout_type: block.layout_type,
    title: block.title,
    sort_order: block.sort_order,
  };

  switch (block.block_type) {
    case "text":
      return {
        ...base,
        media_kind: null,
        body: block.body,
        media_url: null,
        storage_path: null,
        poster_image_url: null,
        caption: null,
        alt_text: null,
        resource_id: null,
        settings: null,
      };
    case "image":
      return {
        ...base,
        media_kind: "image",
        body: null,
        media_url: block.media_url,
        storage_path: null,
        poster_image_url: null,
        caption: block.caption,
        alt_text: block.alt_text,
        resource_id: null,
        settings: null,
      };
    case "video":
      return {
        ...base,
        media_kind: "video",
        body: null,
        media_url: block.media_url,
        storage_path: block.storage_path,
        poster_image_url: block.poster_image_url,
        caption: block.caption,
        alt_text: null,
        resource_id: null,
        settings: block.settings,
      };
    case "split_text_image":
      return {
        ...base,
        media_kind: "image",
        body: block.body,
        media_url: block.media_url,
        storage_path: null,
        poster_image_url: null,
        caption: block.caption,
        alt_text: block.alt_text,
        resource_id: null,
        settings: null,
      };
    case "split_text_video":
      return {
        ...base,
        media_kind: "video",
        body: block.body,
        media_url: block.media_url,
        storage_path: block.storage_path,
        poster_image_url: block.poster_image_url,
        caption: block.caption,
        alt_text: null,
        resource_id: null,
        settings: block.settings,
      };
    case "callout":
      return {
        ...base,
        media_kind: null,
        body: block.body,
        media_url: null,
        storage_path: null,
        poster_image_url: null,
        caption: null,
        alt_text: null,
        resource_id: null,
        settings: block.settings,
      };
    case "resource":
      return {
        ...base,
        media_kind: "resource",
        body: block.body,
        media_url: block.media_url,
        storage_path: null,
        poster_image_url: null,
        caption: null,
        alt_text: null,
        resource_id: block.resource_id,
        settings: block.settings,
      };
    case "gallery":
      return {
        ...base,
        media_kind: "gallery",
        body: block.body,
        media_url: null,
        storage_path: null,
        poster_image_url: null,
        caption: null,
        alt_text: null,
        resource_id: null,
        settings: block.settings,
      };
  }
}

export function serializeResourceForUpsert(resource: LessonResourceInput, moduleId: string) {
  return {
    id: resource.id,
    module_id: moduleId,
    label: resource.label,
    url: resource.url,
    storage_path: resource.storage_path,
    file_kind: resource.file_kind,
    sort_order: resource.sort_order,
  };
}

export async function fetchPublishedLessonModules(): ServiceResult<LessonModule[]> {
  const { data, error } = await supabase
    .from("lesson_modules")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return { data: data ?? null, error: error ? new Error(error.message) : null };
}

export async function fetchAdminLessonModules(): ServiceResult<LessonModule[]> {
  const { data, error } = await supabase
    .from("lesson_modules")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return { data: data ?? null, error: error ? new Error(error.message) : null };
}

export async function fetchLessonModuleBySlug(slug: string): ServiceResult<LessonModule> {
  const { data, error } = await supabase
    .from("lesson_modules")
    .select("*")
    .eq("slug", slug)
    .single();

  return { data: data ?? null, error: error ? new Error(error.message) : null };
}

export async function fetchLessonModuleById(id: string): ServiceResult<LessonModule> {
  const { data, error } = await supabase
    .from("lesson_modules")
    .select("*")
    .eq("id", id)
    .single();

  return { data: data ?? null, error: error ? new Error(error.message) : null };
}

export async function fetchLessonBlocks(moduleId: string): ServiceResult<LessonBlock[]> {
  const { data, error } = await supabase
    .from("lesson_module_blocks")
    .select("*")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  return {
    data: data ? normalizeSortOrder(data.map(mapBlockRecordToBlock)) : null,
    error: error ? new Error(error.message) : null,
  };
}

export async function fetchLessonResources(moduleId: string): ServiceResult<LessonResource[]> {
  const { data, error } = await supabase
    .from("lesson_resources")
    .select("*")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  return {
    data: data ? normalizeSortOrder(data as LessonResource[]) : null,
    error: error ? new Error(error.message) : null,
  };
}

export async function fetchAdminLessonEditor(id: string): ServiceResult<LessonModuleWithContent> {
  const [
    { data: module, error: moduleError },
    { data: blocks, error: blocksError },
    { data: resources, error: resourcesError },
  ] = await Promise.all([
    fetchLessonModuleById(id),
    fetchLessonBlocks(id),
    fetchLessonResources(id),
  ]);

  if (moduleError) {
    return { data: null, error: moduleError };
  }

  if (blocksError) {
    return { data: null, error: blocksError };
  }

  if (resourcesError) {
    return { data: null, error: resourcesError };
  }

  if (!module) {
    return { data: null, error: new Error("Lesson module not found.") };
  }

  return {
    data: {
      ...module,
      blocks: sortBySortOrder(blocks ?? []),
      resources: sortBySortOrder(resources ?? []),
    },
    error: null,
  };
}

export function createEmptyLessonModule(overrides?: Partial<LessonModuleInput>): LessonModuleInput {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    short_description: "",
    cover_image_url: "",
    is_free: false,
    is_published: false,
    sort_order: 0,
    category: "",
    level: "",
    age_range: "",
    ...overrides,
  };
}

export function createEmptyLessonResource(moduleId = ""): LessonResourceInput {
  return {
    id: crypto.randomUUID(),
    module_id: moduleId,
    label: "",
    url: null,
    storage_path: null,
    file_kind: null,
    sort_order: 0,
  };
}
