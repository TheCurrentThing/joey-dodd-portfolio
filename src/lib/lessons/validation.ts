import type {
  GalleryBlock,
  GalleryBlockSettings,
  GalleryImageItem,
  LessonBlock,
  LessonEditorErrors,
  LessonEditorState,
  LessonModuleInput,
  LessonResourceInput,
  ResourceBlock,
  SplitTextVideoBlock,
  VideoBlock,
} from "../../types/lesson";
import { normalizeVideoEmbedUrl } from "./video";

function hasSource(item: GalleryImageItem) {
  return Boolean(item.publicUrl || item.storagePath);
}

export function isGalleryBlockSettings(value: unknown): value is GalleryBlockSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as GalleryBlockSettings;
  if (!Array.isArray(settings.images) || settings.images.length === 0) {
    return false;
  }

  if (
    settings.columns !== undefined &&
    (!Number.isInteger(settings.columns) || settings.columns < 1 || settings.columns > 4)
  ) {
    return false;
  }

  return settings.images.every((image) => {
    if (!image || typeof image !== "object") {
      return false;
    }

    return hasSource(image);
  });
}

function validateModule(module: LessonModuleInput) {
  const errors: string[] = [];

  if (!module.title.trim()) {
    errors.push("Title is required.");
  }

  if (!module.slug.trim()) {
    errors.push("Slug is required.");
  }

  if (!module.is_free) {
    if (!module.stripe_price_id?.trim()) {
      errors.push("Paid modules need a Stripe price ID.");
    }

    if (!module.price_cents || module.price_cents <= 0) {
      errors.push("Paid modules need a valid price greater than $0.");
    }
  }

  return errors;
}

function validateResource(resource: LessonResourceInput) {
  const errors: string[] = [];

  if (!resource.label.trim()) {
    errors.push("Resource label is required.");
  }

  if (!resource.storage_path && !resource.url) {
    errors.push("Resource needs either an uploaded file or an external URL.");
  }

  if (resource.storage_path && resource.url) {
    errors.push("Managed resources should not also store a duplicate direct URL.");
  }

  return errors;
}

function validateVideoFields(block: VideoBlock | SplitTextVideoBlock, isPaid: boolean) {
  const errors: string[] = [];
  const sourceType = block.settings?.videoSourceType;
  const hasEmbed = Boolean(block.media_url);
  const hasUpload = Boolean(block.storage_path);

  if (!sourceType) {
    errors.push("Choose whether the video is an embed or an upload.");
    return errors;
  }

  if (hasEmbed === hasUpload) {
    errors.push("Video blocks must use exactly one source.");
  }

  if (sourceType === "embed") {
    if (!block.media_url) {
      errors.push("Embedded videos require a video URL.");
    } else {
      const normalized = normalizeVideoEmbedUrl(block.media_url, isPaid);
      if (normalized.error) {
        errors.push(normalized.error);
      }
    }
  }

  if (sourceType === "upload" && !block.storage_path) {
    errors.push("Uploaded videos require a stored file.");
  }

  return errors;
}

function validateResourceBlock(block: ResourceBlock, resources: LessonResourceInput[]) {
  const errors: string[] = [];
  const hasResourceId = Boolean(block.resource_id);
  const hasExternalUrl = Boolean(block.media_url?.trim());

  if (!hasResourceId && !hasExternalUrl) {
    errors.push("Resource blocks need a linked resource or an external URL.");
  }

  if (hasResourceId && hasExternalUrl) {
    errors.push("Resource blocks should use either a linked resource or an external URL, not both.");
  }

  if (hasResourceId) {
    const resource = resources.find((item) => item.id === block.resource_id);
    if (!resource) {
      errors.push("Selected resource no longer exists.");
    }
  }

  return errors;
}

function validateBlock(
  block: LessonBlock,
  resources: LessonResourceInput[],
  module: LessonModuleInput
) {
  const errors: string[] = [];
  const isPaid = !module.is_free;

  if (!block.layout_type) {
    errors.push("Block layout is required.");
  }

  switch (block.block_type) {
    case "text":
      if (!block.body.trim()) {
        errors.push("Text blocks need body copy.");
      }
      break;
    case "image":
      if (!block.media_url.trim()) {
        errors.push("Image blocks need an image URL.");
      }
      break;
    case "video":
      errors.push(...validateVideoFields(block, isPaid));
      break;
    case "split_text_image":
      if (!block.body.trim()) {
        errors.push("Split text + image blocks need text.");
      }
      if (!block.media_url.trim()) {
        errors.push("Split text + image blocks need an image.");
      }
      break;
    case "split_text_video":
      if (!block.body.trim()) {
        errors.push("Split text + video blocks need text.");
      }
      errors.push(...validateVideoFields(block, isPaid));
      break;
    case "callout":
      if (!block.body.trim()) {
        errors.push("Callout blocks need message copy.");
      }
      break;
    case "resource":
      errors.push(...validateResourceBlock(block, resources));
      break;
    case "gallery":
      if (!isGalleryBlockSettings(block.settings)) {
        errors.push("Gallery blocks need at least one valid image.");
      }
      break;
    default:
      errors.push("Unsupported block type.");
      break;
  }

  return errors;
}

export function validateLessonEditorState(state: LessonEditorState): LessonEditorErrors {
  const moduleErrors = validateModule(state.module);
  const resourceErrors: LessonEditorErrors["resources"] = {};
  const blockErrors: LessonEditorErrors["blocks"] = {};

  state.resources.forEach((resource) => {
    const current = validateResource(resource);
    if (current.length > 0) {
      resourceErrors[resource.id] = current;
    }
  });

  state.blocks.forEach((block) => {
    const current = validateBlock(block, state.resources, state.module);
    if (current.length > 0) {
      blockErrors[block.id] = current;
    }
  });

  return {
    module: moduleErrors,
    blocks: blockErrors,
    resources: resourceErrors,
  };
}

export function hasValidationErrors(errors: LessonEditorErrors) {
  return (
    errors.module.length > 0 ||
    Object.keys(errors.blocks).length > 0 ||
    Object.keys(errors.resources).length > 0
  );
}

export function sanitizeGalleryBlock(block: GalleryBlock): GalleryBlock {
  const settings = isGalleryBlockSettings(block.settings)
    ? block.settings
    : {
        images: [],
      };

  return {
    ...block,
    settings,
  };
}
