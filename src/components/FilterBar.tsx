import { useEffect, useRef } from "react";
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
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    });

    return () => ctx.revert();
  }, [categories]);

  return (
    <div
      ref={barRef}
      className="mb-10 flex flex-wrap gap-3 overflow-x-auto pb-2"
      role="group"
      aria-label="Filter projects by category"
    >
      {categories.map((category) => {
        const isActive = category === activeCategory;

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`filter-btn cursor-pointer whitespace-nowrap rounded-md border px-5 py-3 font-mono text-xs uppercase tracking-widest transition-colors duration-300 ${
              isActive
                ? "border-tertiary bg-tertiary text-tertiary-foreground"
                : "border-border bg-transparent text-neutral-300 hover:border-tertiary hover:text-tertiary"
            }`}
            aria-pressed={isActive}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
