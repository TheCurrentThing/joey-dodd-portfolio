import type { LessonBlock, LessonResource, LessonResourceInput } from "../../types/lesson";
import { cn } from "../../lib/utils";
import { CalloutBlockView, TextBlockView } from "./blocks/TextAndCalloutBlocks";
import {
  GalleryBlockView,
  ImageBlockView,
  SplitTextImageBlockView,
} from "./blocks/ImageAndGalleryBlocks";
import { ResourceBlockView } from "./blocks/ResourceBlockView";
import { SplitTextVideoBlockView, VideoBlockView } from "./blocks/VideoBlocks";

function getLayoutClass(layout: LessonBlock["layout_type"]) {
  switch (layout) {
    case "full_width":
      return "w-full max-w-none";
    case "narrow":
      return "mx-auto w-full max-w-2xl";
    case "two_column":
      return "w-full max-w-6xl";
    case "media_left":
    case "media_right":
      return "w-full max-w-6xl";
    default:
      return "mx-auto w-full max-w-3xl";
  }
}

export default function LessonBlockRenderer({
  blocks,
  resources,
  moduleIsFree,
}: {
  blocks: LessonBlock[];
  resources: Array<LessonResource | LessonResourceInput>;
  moduleIsFree: boolean;
}) {
  return (
    <div className="space-y-10 md:space-y-14">
      {blocks.map((block) => (
        <div key={block.id} className={cn("content-animate", getLayoutClass(block.layout_type))}>
          {block.block_type === "text" && <TextBlockView block={block} />}
          {block.block_type === "callout" && <CalloutBlockView block={block} />}
          {block.block_type === "image" && <ImageBlockView block={block} />}
          {block.block_type === "split_text_image" && <SplitTextImageBlockView block={block} />}
          {block.block_type === "gallery" && <GalleryBlockView block={block} />}
          {block.block_type === "video" && (
            <VideoBlockView block={block} moduleIsFree={moduleIsFree} />
          )}
          {block.block_type === "split_text_video" && (
            <SplitTextVideoBlockView block={block} moduleIsFree={moduleIsFree} />
          )}
          {block.block_type === "resource" && (
            <ResourceBlockView block={block} resources={resources} moduleIsFree={moduleIsFree} />
          )}
        </div>
      ))}
    </div>
  );
}
