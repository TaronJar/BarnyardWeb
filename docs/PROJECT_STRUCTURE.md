# Repository structure

This repository is the browser/WASM runtime for OpenBarnyard. Cloudflare Pages serves the repository root directly; there is no frontend build step.

## Application source

- `index.html` — document shell, launcher markup and ordered classic-script loading.
- `css/app.css` — application styles. Kept as one stylesheet to preserve the existing cascade and visual appearance.
- `js/core/page.js` — browser bootstrap, Emscripten `Module`, save mounting, status and lifecycle.
- `js/ui/settings.js` — settings interface and its controls.
- `js/input/input.js` — keyboard, pointer and touch input.
- `js/rendering/gl_replay.js` — WebGL command replay.
- `js/data/datapack.js` — local game-data pack management on the page.
- `js/workers/datapack_worker.js` — background storage/indexing worker.
- `js/audio/audio_worklet.js` — audio ring-buffer processor.
- `assets/images/` — launcher artwork.
- `assets/icons/` — favicon and install icons.
- `functions/api/data.js` — Cloudflare Pages Function for the game-data proxy.

## Runtime and deployment files

These files intentionally stay at the root:

- `index.html`, `_headers`, `manifest.json`, `sw.js` — Cloudflare Pages and browser entry points.
- `OpenBarnyard.js` / `OpenBarnyard.wasm` — generated Emscripten runtime and binary; the loader expects root-relative resources.
- `game_pre.js` — Emscripten pre-js input used by the native/WASM build process.
- `README.md` and `License.md` — repository documentation and license.

The JavaScript files under `js/` remain classic scripts rather than ES modules. Their load order in `index.html` is intentional: rendering and input globals are established before the page bootstrap runs. The data worker and audio worklet are loaded by explicit paths from their owning scripts.

## Deployment and maintenance

- Cloudflare Pages output directory remains `.` (the repository root).
- There is no npm, bundler, framework, or compile step for the web shell.
- Keep the service-worker precache list in `sw.js` synchronized with any renamed runtime assets.
- Keep the generated Emscripten files, `_headers`, `functions/`, and `game_pre.js` at their expected locations.
- Do not commit the user's game `Data` directory or Windows build tools/artifacts.
