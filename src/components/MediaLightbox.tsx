import { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { isVideoUrl } from "../lib/media";

type Props = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

export default function MediaLightbox({ src, alt, open, onClose }: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Expanded portfolio media"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors duration-200 hover:border-white/40 hover:bg-black/70"
        aria-label="Close expanded media"
      >
        <X size={20} />
      </button>

      <div
        className="max-h-full max-w-[min(92vw,1400px)]"
        onClick={(event) => event.stopPropagation()}
      >
        {isVideoUrl(src) ? (
          <video
            src={src}
            className="max-h-[88vh] max-w-full rounded-md object-contain shadow-2xl"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-h-[88vh] max-w-full rounded-md object-contain shadow-2xl"
          />
        )}
      </div>
    </div>
  );
}
