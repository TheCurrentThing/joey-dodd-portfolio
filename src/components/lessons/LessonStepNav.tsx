import { CheckCircle } from "@phosphor-icons/react";

export type LessonStep = {
  index: number;
  title: string;
};

type Props = {
  steps: LessonStep[];
  activeIndex: number;
  completedIndices: Set<number>;
  onSelect: (index: number) => void;
};

export default function LessonStepNav({
  steps,
  activeIndex,
  completedIndices,
  onSelect,
}: Props) {
  return (
    <nav aria-label="Lesson steps" className="flex flex-col gap-1">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = completedIndices.has(index);

        return (
          <button
            key={step.index}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={isActive ? "step" : undefined}
            className={`group flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all ${
              isActive
                ? "bg-tertiary/10 text-tertiary ring-1 ring-tertiary/30"
                : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-mono font-bold transition-colors ${
                isActive
                  ? "bg-tertiary text-background"
                  : isDone
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/10 text-neutral-400"
              }`}
            >
              {isDone && !isActive ? <CheckCircle size={12} weight="fill" /> : index + 1}
            </span>
            <span
              className={`font-sans text-sm leading-snug ${
                isActive ? "font-semibold text-tertiary" : "font-normal"
              }`}
            >
              {step.title}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
