import type { ReactNode } from "react";

export default function FormField({
  label,
  children,
  helperText,
}: {
  label: string;
  children: ReactNode;
  helperText?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">{label}</label>
      {children}
      {helperText && <p className="text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
}
