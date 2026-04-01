<instructions>
## 🚨 MANDATORY: CHANGELOG TRACKING 🚨

You MUST maintain this file to track your work across messages. This is NON-NEGOTIABLE.

---

## INSTRUCTIONS

- **MAX 5 lines** per entry - be concise but informative
- **Include file paths** of key files modified or discovered
- **Note patterns/conventions** found in the codebase
- **Sort entries by date** in DESCENDING order (most recent first)
- If this file gets corrupted, messy, or unsorted -> re-create it. 
- CRITICAL: Updating this file at the END of EVERY response is MANDATORY.
- CRITICAL: Keep this file under 300 lines. You are allowed to summarize, change the format, delete entries, etc., in order to keep it under the limit.

</instructions>

<changelog>

## 2026-04-01 (fix supabase env read)
- Restored `import.meta.env.VITE_SUPABASE_*` reading in `src/lib/supabase.ts` (Vite inlines these correctly)
- Removed broken `globalThis.__ENV__` fallback pattern that was causing `supabaseConfigured = false`
- Recreated `.env.local` with correct placeholder key names
- Restarted dev server so new env vars are picked up

## 2026-04-01 (env key fix)
## 2026-04-01 (env key fix)
- Updated `src/lib/supabase.ts` to read `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` from globalThis env fallback
- Updated `.env.local` placeholder to use the correct key name
- Old `VITE_SUPABASE_ANON_KEY` still supported as a secondary fallback

## 2026-04-01 (contact form audit)
- Audited `src/pages/ContactPage.tsx` — `useMutation('ContactSubmission')` was already fully wired
- `create()` fires on submit with name/email/subject/message; error + pending states handled
- Closed TODO `contact-form-live` as already complete

## 2026-04-01 (fix import.meta)
- Removed all `import.meta` references from `src/lib/supabase.ts` — Sandpack bundler rejects them
- Now reads credentials from `globalThis.__SUPABASE_URL__` / `__SUPABASE_ANON_KEY__` only

## 2026-04-01 (env live)
- `src/lib/supabase.ts` now reads real Vite env vars (`import.meta.env.VITE_SUPABASE_URL/ANON_KEY`) with safe globalThis fallback
- Removed "Supabase Setup Required" warning banner from `src/pages/AdminPage.tsx`

## 2026-04-01 (storage browser)
- Added `StorageBrowser` modal to `src/pages/AdminPage.tsx` — lists existing Supabase bucket files by folder
- `ImageUploader` now has "Browse Storage" link to pick already-uploaded images
- `GalleryImageUploader` now has "Browse Storage" + "Upload New" buttons side-by-side
- Uses `listFolder` + `getPublicUrl` from `src/lib/storage.ts` (already existed)

## 2026-04-01 (supabase fix 3)
- Sandpack bundler cannot handle `import.meta` at all — replaced with `globalThis.__SUPABASE_*__` fallback pattern
- `src/lib/supabase.ts` now has zero `import.meta` references; falls back to placeholder strings safely

## 2026-04-01 (credentials)
- Created `.env.local` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` placeholders
- Updated `src/lib/supabase.ts` to read `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (falls back to `VITE_SUPABASE_ANON_KEY`)
- Bucket name `portfolio-images` must be created as Public in Supabase Storage dashboard

## 2026-04-01
- Fixed `Cannot use 'import.meta' outside a module` in `src/lib/supabase.ts`
- Wrapped `import.meta.env` access in a `typeof import.meta !== "undefined"` guard
- Fixed build-breaking stray `</parameter>` tag at line 19 of `src/lib/supabase.ts`

</changelog>
