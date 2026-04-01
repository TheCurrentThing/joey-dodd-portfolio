type FilterBarProps = {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
};

export default function FilterBar({
  categories,
  activeCategory,
  onSelect,
}: FilterBarProps) {
  return (
    <div className="mb-14 flex flex-wrap gap-3">
      {categories.map((category) => {
        const active = category === activeCategory;

        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`rounded-full border px-5 py-3 text-xs uppercase tracking-[0.28em] transition-all duration-300 ${
              active
                ? "border-[#deb878] bg-[#deb878] text-black shadow-[0_0_30px_rgba(222,184,120,0.18)]"
                : "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
