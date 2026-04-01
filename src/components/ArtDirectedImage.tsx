import { useState } from "react";
import { cn } from "../lib/utils";

type ArtDirectedImageProps = {
  src?: string | null;
  fallback: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  loading?: "eager" | "lazy";
};

export default function ArtDirectedImage({
  src,
  fallback,
  alt,
  className,
  imgClassName,
  loading = "lazy",
}: ArtDirectedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback);

  return (
    <div className={cn("overflow-hidden", className)}>
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        onError={() => {
          if (currentSrc !== fallback) {
            setCurrentSrc(fallback);
          }
        }}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
