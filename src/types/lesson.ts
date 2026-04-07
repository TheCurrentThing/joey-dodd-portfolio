export type LessonLayoutType =
  | "standard"
  | "full_width"
  | "narrow"
  | "media_left"
  | "media_right"
  | "two_column";

export type LessonBlockType =
  | "text"
  | "image"
  | "video"
  | "split_text_image"
  | "split_text_video"
  | "callout"
  | "resource"
  | "gallery";

export type VideoSourceType = "embed" | "upload";
export type VideoAspectRatio = "16:9" | "4:3" | "1:1";
export type VideoProvider = "vimeo" | "youtube" | "loom" | "upload";
export type CalloutTone = "note" | "tip" | "encouragement";

export type LessonModule = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  cover_image_url: string | null;
  is_free: boolean;
  is_published: boolean;
  sort_order: number;
  category: string | null;
  level: string | null;
  age_range: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonModuleInput = Omit<LessonModule, "created_at" | "updated_at">;

export type LessonResource = {
  id: string;
  module_id: string;
  label: string;
  url: string | null;
  storage_path: string | null;
  file_kind: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type LessonResourceInput = Omit<LessonResource, "created_at" | "updated_at">;

export type ResolvedLessonResource = LessonResource & {
  href: string;
  is_external: boolean;
};

export type GalleryImageItem = {
  storagePath?: string;
  publicUrl?: string;
  caption?: string;
  alt?: string;
};

export type GalleryBlockSettings = {
  images: GalleryImageItem[];
  columns?: number;
};

export type VideoBlockSettings = {
  videoSourceType: VideoSourceType;
  aspectRatio?: VideoAspectRatio;
  transcript?: string;
};

export type CalloutBlockSettings = {
  tone?: CalloutTone;
};

export type ResourceBlockSettings = {
  displayStyle?: "inline" | "card";
};

type LessonBlockBase<TType extends LessonBlockType> = {
  id: string;
  module_id?: string;
  block_type: TType;
  layout_type: LessonLayoutType;
  title: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type TextBlock = LessonBlockBase<"text"> & {
  body: string;
};

export type ImageBlock = LessonBlockBase<"image"> & {
  media_url: string;
  caption: string | null;
  alt_text: string | null;
};

export type VideoBlock = LessonBlockBase<"video"> & {
  media_url: string | null;
  storage_path: string | null;
  poster_image_url: string | null;
  caption: string | null;
  settings: VideoBlockSettings;
};

export type SplitTextImageBlock = LessonBlockBase<"split_text_image"> & {
  body: string;
  media_url: string;
  caption: string | null;
  alt_text: string | null;
};

export type SplitTextVideoBlock = LessonBlockBase<"split_text_video"> & {
  body: string;
  media_url: string | null;
  storage_path: string | null;
  poster_image_url: string | null;
  caption: string | null;
  settings: VideoBlockSettings;
};

export type CalloutBlock = LessonBlockBase<"callout"> & {
  body: string;
  settings: CalloutBlockSettings;
};

export type ResourceBlock = LessonBlockBase<"resource"> & {
  body: string | null;
  resource_id: string | null;
  media_url: string | null;
  settings: ResourceBlockSettings | null;
};

export type GalleryBlock = LessonBlockBase<"gallery"> & {
  body: string | null;
  settings: GalleryBlockSettings;
};

export type LessonBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | SplitTextImageBlock
  | SplitTextVideoBlock
  | CalloutBlock
  | ResourceBlock
  | GalleryBlock;

export type LessonModuleBlockRecord = {
  id: string;
  module_id: string;
  block_type: LessonBlockType;
  layout_type: LessonLayoutType;
  title: string | null;
  body: string | null;
  media_kind: string | null;
  media_url: string | null;
  storage_path: string | null;
  poster_image_url: string | null;
  caption: string | null;
  alt_text: string | null;
  resource_id: string | null;
  settings: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type LessonModuleWithContent = LessonModule & {
  blocks: LessonBlock[];
  resources: LessonResource[];
};

export type LessonEditorState = {
  module: LessonModuleInput;
  blocks: LessonBlock[];
  resources: LessonResourceInput[];
};

export type LessonEditorErrors = {
  module: string[];
  blocks: Record<string, string[]>;
  resources: Record<string, string[]>;
};

export type ResolvedVideoSource = {
  type: VideoSourceType;
  provider: VideoProvider;
  src: string;
  aspectRatio: VideoAspectRatio;
  posterImageUrl: string | null;
  caption: string | null;
  transcript: string | null;
};

export const LESSON_BLOCK_TYPE_OPTIONS: {
  value: LessonBlockType;
  label: string;
}[] = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "split_text_image", label: "Split Text + Image" },
  { value: "split_text_video", label: "Split Text + Video" },
  { value: "callout", label: "Callout" },
  { value: "resource", label: "Resource" },
  { value: "gallery", label: "Gallery" },
];

export const LESSON_LAYOUT_OPTIONS: {
  value: LessonLayoutType;
  label: string;
}[] = [
  { value: "standard", label: "Standard" },
  { value: "full_width", label: "Full Width" },
  { value: "narrow", label: "Narrow" },
  { value: "media_left", label: "Media Left" },
  { value: "media_right", label: "Media Right" },
  { value: "two_column", label: "Two Column" },
];
