import { useRef, useEffect } from "react";
import { gsap } from "gsap";

type Props = {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
};

export default function FilterBar({
  categories,
  activeCategory,
  onSelect,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        barRef.current!.querySelectorAll(".filter-btn"),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" },
      );
    });
    return () => ctx.revert();
  }, [categories]);

  return (
    <div
      ref={barRef}
      className="flex flex-wrap gap-3 mb-10 overflow-x-auto pb-2"
      role="group"
      aria-label="Filter projects by category"
    >
      {categories.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`filter-btn font-mono text-label uppercase tracking-widest text-xs px-5 py-3 rounded-md border transition-colors duration-300 whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-tertiary text-tertiary-foreground border-tertiary"
                : "bg-transparent text-neutral-300 border-border hover:border-tertiary hover:text-tertiary"
            }`}
            aria-pressed={isActive}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
