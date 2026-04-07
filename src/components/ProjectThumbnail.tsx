import { useState } from "react";

export default function ProjectThumbnail({
  src,
  title,
  className = "",
}: {
  src?: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full items-end bg-gradient-2 p-6 ${className}`}
        aria-hidden="true"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-200/80">
            Joey Dodd
          </p>
          <p className="mt-2 max-w-[12rem] font-serif text-h3 leading-tight text-foreground">
            {title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
