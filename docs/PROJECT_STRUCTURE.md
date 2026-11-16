# Repository structure

This repository is the browser/WASM runtime for OpenBarnyard. Cloudflare Pages serves the repository root directly (no build step).

## Layout

- `index.html` — web entry point and launcher markup.
- `css/app.css` — all page and launcher styles, extracted from the HTML.
- `assets/images/` — launcher artwork.
- `assets/icons/` — favicon and install icons.
- `functions/api/` — Cloudflare Pages Functions (data proxy).
- `OpenBarnyard.js` / `OpenBarnyard.wasm` — generated Emscripten runtime and WASM binary.
- Root-level JavaScript files — runtime scripts and workers. They intentionally remain at the root because the generated Emscripten loader, audio worklet, data worker, page code, and service worker resolve several resources relative to the site root.
- `_headers` — required cross-origin isolation headers for threaded WASM.
- `sw.js` — offline shell cache and response header handling.
- `manifest.json` — installable web app metadata.

## Deployment

Cloudflare Pages uses the repository root as its output directory. Keep `index.html`, `_headers`, `manifest.json`, `sw.js`, `OpenBarnyard.js`, and `OpenBarnyard.wasm` at the root unless all dependent URLs and worker/runtime paths are updated together.

Do not add the user's game `Data` directory or Windows build tools/artifacts to this repository.
