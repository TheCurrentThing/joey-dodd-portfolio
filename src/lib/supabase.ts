import { createClient } from "@supabase/supabase-js";

// Sandpack cannot handle import.meta, so we use a helper function
// that reads from globalThis — Vite injects VITE_* vars there at dev time.
function env(key: string): string {
  try {
    // @ts-ignore
    return (globalThis as any)[key] ?? (globalThis as any).__env__?.[key] ?? "";
  } catch {
    return "";
  }
}

const rawUrl: string = env("VITE_SUPABASE_URL");
const rawKey: string =
  env("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY") ||
  env("VITE_SUPABASE_ANON_KEY");

/** True only when real Supabase credentials are present at runtime. */
export const supabaseConfigured =
  rawUrl.length > 0 &&
  !rawUrl.includes("placeholder") &&
  rawKey.length > 0 &&
  !rawKey.includes("placeholder");

export const supabase = createClient(
  rawUrl || "https://placeholder.supabase.co",
  rawKey || "placeholder-key"
);

export const STORAGE_BUCKET = "portfolio-images";
