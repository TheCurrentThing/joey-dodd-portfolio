<instructions>
This file will be automatically added to your context. 
It serves multiple purposes:
  1. Storing frequently used tools so you can use them without searching each time
  2. Recording the user's code style preferences (naming conventions, preferred libraries, etc.)
  3. Maintaining useful information about the codebase structure and organization
  4. Remembering tricky quirks from this codebase

When you spend time searching for certain configuration files, tricky code coupled dependencies, or other codebase information, add that to this CODER.md file so you can remember it for next time.
Keep entries sorted in DESC order (newest first) so recent knowledge stays in prompt context if the file is truncated.
</instructions>

<coder>

## Project: Joey Dodd Portfolio
- Framework: React + TypeScript + Tailwind CSS + Vite
- DB/Auth: Anima Playground React SDK (`@animaapp/playground-react-sdk`)
- Storage: Supabase Storage via `src/lib/supabase.ts` + `src/lib/storage.ts`
- Bucket name: `portfolio-images` (must be public in Supabase dashboard)
- Env vars needed: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Routes defined in `src/App.tsx`; admin panel at `/admin` (auth-gated)
- Entity names: `Project`, `ProjectImage`, `ContactSubmission`
- Key pages: `HomePage`, `PortfolioPage`, `ProjectDetailPage`, `ContactPage`, `AdminPage`

## Known Quirks
- Provider/schema closing tags (e.g. `</parameter>`) must NEVER appear in file output — they cause immediate syntax errors in the Sandpack bundler.

</coder>
