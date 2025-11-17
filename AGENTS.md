# Repository Guidelines

## Project Structure & Module Organization
The front-end lives in `src/`, with routed pages in `views/`, reusable UI under `components/`, shared state inside `stores/`, and composables/utilities in `composables/` and `utils/`. Static inputs that ship with the site stay in `public/`, while user-managed art content—Markdown metadata plus WebP images—must follow the `public/artworks/<category>/<work>/` layout. Server-side helpers split between `api/` (Vercel Edge functions) and `server/upload.cjs` for the optional local upload API; avoid editing compiled assets under `dist/`.

## Build, Test, and Development Commands
```bash
npm run dev        # Launch Vite dev server on :5173
npm run type-check # Run vue-tsc to verify component typing
npm run build      # Production build + type-check
npm run preview    # Serve the latest build locally
node server/upload.cjs # Start the Express upload API on :3001
npm run artwork:create # Guided artwork folder/metadata generation
npm run convert-webp   # Batch convert source images to WebP
```
Keep `temp-uploads/` untracked; runtime scratch space.

## Coding Style & Naming Conventions
Use TypeScript everywhere (even in `<script setup lang="ts">`) and prefer Composition API patterns. Components are PascalCase (`AppHeader.vue`), composables/utilities are camelCase files, and CSS modules or global styles use kebab-case names inside `src/assets/styles/`. Follow the repo’s 2-space indentation, single quotes for imports, and keep computed/watch logic in dedicated helpers when it grows beyond ~20 lines.

## Testing Guidelines
A formal test suite is not present today; treat `npm run type-check` plus `npm run build` as the required gate. When adding automated tests, colocate them under `src/__tests__/` with a `.spec.ts` suffix and target headless DOM checks for gallery behaviors or store logic. Describe the manual QA scenario you executed in the PR body (e.g., “visit `/m` routes on mobile viewport, verify waterfall layout”).

## Commit & Pull Request Guidelines
Existing history mixes concise English and Chinese summaries (e.g., `Twikoo 评论系统集成完成`), so keep messages under 50 characters and imperative, optionally bilingual. Each PR should bundle related code only, include a short summary, attach screenshots/GIFs for UI tweaks or new artwork flows, and call out content migrations (new folders under `public/artworks/`) so reviewers can double-check deployment assets.

## Artwork & Asset Workflow
Use the artwork manager or `public/artworks` template described in `README.md` to create content; always convert hero images to WebP and number them sequentially (`image_1.webp`). Update `image-mapping.json` when you add non-standard file names, re-run `npm run convert-webp` before pushing large batches, and keep deployment secrets in local `.env` files only.
