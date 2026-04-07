import { supabase } from "../supabase";
import type { LessonBlock, LessonEditorState, LessonModuleInput, LessonResourceInput } from "../../types/lesson";
import {
  createEmptyLessonModule,
  fetchAdminLessonEditor,
  serializeBlockForUpsert,
  serializeResourceForUpsert,
} from "./queries";
import { duplicateOrderedItem, normalizeSortOrder } from "./ordering";
import { hasValidationErrors, validateLessonEditorState } from "./validation";

function toDeleteFilter(ids: string[]) {
  return `(${ids.map((id) => `"${id}"`).join(",")})`;
}

export function duplicateLessonBlock(blocks: LessonBlock[], targetId: string) {
  return duplicateOrderedItem(blocks, targetId, (block) => ({
    ...block,
    id: crypto.randomUUID(),
  }));
}

export function duplicateLessonResource(resources: LessonResourceInput[], targetId: string) {
  return duplicateOrderedItem(resources, targetId, (resource) => ({
    ...resource,
    id: crypto.randomUUID(),
  }));
}

export async function saveLessonEditorState(state: LessonEditorState) {
  const normalizedState: LessonEditorState = {
    module: {
      ...state.module,
      sort_order: Math.max(0, state.module.sort_order),
    },
    blocks: normalizeSortOrder(state.blocks),
    resources: normalizeSortOrder(state.resources),
  };

  const errors = validateLessonEditorState(normalizedState);
  if (hasValidationErrors(errors)) {
    return {
      data: null,
      error: new Error("Fix validation errors before saving."),
      validationErrors: errors,
    };
  }

  const modulePayload = {
    id: normalizedState.module.id,
    title: normalizedState.module.title,
    slug: normalizedState.module.slug,
    short_description: normalizedState.module.short_description,
    cover_image_url: normalizedState.module.cover_image_url,
    is_free: normalizedState.module.is_free,
    is_published: normalizedState.module.is_published,
    sort_order: normalizedState.module.sort_order,
    category: normalizedState.module.category,
    level: normalizedState.module.level,
    age_range: normalizedState.module.age_range,
  };

  const { error: moduleError } = await supabase
    .from("lesson_modules")
    .upsert(modulePayload, { onConflict: "id" });

  if (moduleError) {
    return {
      data: null,
      error: new Error(moduleError.message),
      validationErrors: errors,
    };
  }

  const blockPayload = normalizedState.blocks.map((block) =>
    serializeBlockForUpsert(block, normalizedState.module.id)
  );
  const resourcePayload = normalizedState.resources.map((resource) =>
    serializeResourceForUpsert(resource, normalizedState.module.id)
  );

  if (blockPayload.length > 0) {
    const { error } = await supabase
      .from("lesson_module_blocks")
      .upsert(blockPayload, { onConflict: "id" });

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        validationErrors: errors,
      };
    }
  }

  if (resourcePayload.length > 0) {
    const { error } = await supabase
      .from("lesson_resources")
      .upsert(resourcePayload, { onConflict: "id" });

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        validationErrors: errors,
      };
    }
  }

  const keepBlockIds = normalizedState.blocks.map((block) => block.id);
  const keepResourceIds = normalizedState.resources.map((resource) => resource.id);

  let deleteBlocksQuery = supabase
    .from("lesson_module_blocks")
    .delete()
    .eq("module_id", normalizedState.module.id);

  if (keepBlockIds.length > 0) {
    deleteBlocksQuery = deleteBlocksQuery.not("id", "in", toDeleteFilter(keepBlockIds));
  }

  const { error: deleteBlocksError } = await deleteBlocksQuery;
  if (deleteBlocksError) {
    return {
      data: null,
      error: new Error(deleteBlocksError.message),
      validationErrors: errors,
    };
  }

  let deleteResourcesQuery = supabase
    .from("lesson_resources")
    .delete()
    .eq("module_id", normalizedState.module.id);

  if (keepResourceIds.length > 0) {
    deleteResourcesQuery = deleteResourcesQuery.not(
      "id",
      "in",
      toDeleteFilter(keepResourceIds)
    );
  }

  const { error: deleteResourcesError } = await deleteResourcesQuery;
  if (deleteResourcesError) {
    return {
      data: null,
      error: new Error(deleteResourcesError.message),
      validationErrors: errors,
    };
  }

  const refreshed = await fetchAdminLessonEditor(normalizedState.module.id);
  return {
    data: refreshed.data,
    error: refreshed.error,
    validationErrors: errors,
  };
}

export async function deleteLessonModule(moduleId: string) {
  const { error } = await supabase.from("lesson_modules").delete().eq("id", moduleId);
  return { error: error ? new Error(error.message) : null };
}

export function createNewLessonEditorState(defaultSortOrder: number): LessonEditorState {
  const module = createEmptyLessonModule({ sort_order: defaultSortOrder });
  return {
    module,
    blocks: [],
    resources: [],
  };
}

export function normalizeModuleForSave(module: LessonModuleInput) {
  return {
    ...module,
    title: module.title.trim(),
    slug: module.slug.trim(),
    short_description: module.short_description?.trim() ?? "",
    category: module.category?.trim() ?? "",
    level: module.level?.trim() ?? "",
    age_range: module.age_range?.trim() ?? "",
    cover_image_url: module.cover_image_url?.trim() ?? "",
  };
}
