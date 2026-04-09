import { Star } from "@phosphor-icons/react";

type SubmissionStarsProps = {
  count: number;
  interactive?: boolean;
  onChange?: (count: number) => void;
  size?: number;
  showLabel?: boolean;
};

function clampStars(count: number) {
  return Math.max(0, Math.min(3, Math.round(count)));
}

export default function SubmissionStars({
  count,
  interactive = false,
  onChange,
  size = 18,
  showLabel = false,
}: SubmissionStarsProps) {
  const safeCount = clampStars(count);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((value) => {
          const filled = value <= safeCount;

          if (!interactive) {
            return (
              <span
                key={value}
                className={filled ? "text-amber-300" : "text-neutral-700"}
                aria-hidden="true"
              >
                <Star size={size} weight={filled ? "fill" : "regular"} />
              </span>
            );
          }

          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange?.(value)}
              className={`rounded-md p-1 transition-colors duration-200 ${
                filled
                  ? "text-amber-300 hover:text-amber-200"
                  : "text-neutral-600 hover:text-neutral-400"
              }`}
              aria-label={`Set ${value} ${value === 1 ? "star" : "stars"}`}
            >
              <Star size={size} weight={filled ? "fill" : "regular"} />
            </button>
          );
        })}
        {interactive && (
          <button
            type="button"
            onClick={() => onChange?.(0)}
            className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors duration-200 ${
              safeCount === 0
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : "border-border text-neutral-400 hover:border-tertiary hover:text-tertiary"
            }`}
          >
            Clear
          </button>
        )}
      </div>
      {showLabel && (
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          {safeCount === 0 ? "No Stars Yet" : `${safeCount} ${safeCount === 1 ? "Star" : "Stars"}`}
        </span>
      )}
    </div>
  );
}
