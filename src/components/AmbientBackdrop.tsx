import { cn } from "../lib/utils";

type AmbientBackdropProps = {
  className?: string;
  intensity?: "soft" | "medium" | "strong";
};

const intensityMap = {
  soft: {
    top: "opacity-35",
    left: "opacity-25",
    right: "opacity-20",
  },
  medium: {
    top: "opacity-55",
    left: "opacity-40",
    right: "opacity-30",
  },
  strong: {
    top: "opacity-75",
    left: "opacity-55",
    right: "opacity-45",
  },
};

export default function AmbientBackdrop({
  className,
  intensity = "medium",
}: AmbientBackdropProps) {
  const tone = intensityMap[intensity];

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className={cn("absolute left-[-10%] top-[-12%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,_rgba(227,179,97,0.34)_0%,_rgba(227,179,97,0)_70%)] blur-3xl", tone.top)} />
      <div className={cn("absolute bottom-[8%] left-[-12%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(58,88,112,0.42)_0%,_rgba(58,88,112,0)_72%)] blur-3xl", tone.left)} />
      <div className={cn("absolute right-[-10%] top-[18%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(130,72,52,0.34)_0%,_rgba(130,72,52,0)_72%)] blur-3xl", tone.right)} />
      <div className="absolute inset-0 bg-[url('/art/noise.svg')] opacity-[0.10] mix-blend-soft-light" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,9,0.10),rgba(8,8,9,0.82))]" />
    </div>
  );
}
