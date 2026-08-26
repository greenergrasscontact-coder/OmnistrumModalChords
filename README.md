# Instruments

Two browser instruments packaged as installable web apps (PWAs), ready to
deploy on GitHub Pages.

```
.
├── index.html              launcher page linking both apps
├── .nojekyll               tells GitHub Pages not to run Jekyll
├── omnistrum/
│   ├── index.html          the app (your original file + PWA head tags)
│   ├── manifest.webmanifest
│   ├── sw.js               offline cache
│   └── icons/
└── modalchords/
    ├── index.html
    ├── manifest.webmanifest
    ├── sw.js
    └── icons/
```

## Deploy

1. Create a new GitHub repo (public — Pages is free only for public repos on
   the free plan). Name it something short; it becomes part of the URL.
2. Upload everything in this folder to the repo root. Web UI works:
   **Add file → Upload files**, then drag the *contents* of this folder in.
   Keep the folder structure — GitHub preserves it when you drag folders.
3. **Settings → Pages**. Under *Build and deployment*, Source =
   **Deploy from a branch**, Branch = `main`, folder = `/ (root)`. Save.
4. Wait ~1 minute. Your site is at
   `https://<username>.github.io/<repo>/`.

## Install on a device

Everything below needs the **https GitHub Pages URL**, not a local file.

- **iPhone / iPad** — open the app's URL in **Safari** (not Chrome), tap
  Share → Add to Home Screen. Must be Safari; other browsers on iOS can't
  register the offline cache.
- **Android** — open in Chrome, menu (⋮) → *Install app* / *Add to Home
  screen*.
- **Desktop Chrome / Edge** — the install icon at the right of the address
  bar, or ⋮ → *Cast, save & share → Install page as app*. It gets its own
  window with no tabs or URL bar.

Install each app separately (from `/omnistrum/` and `/modalchords/`) if you
want two icons. The launcher at the root is just a directory page.

## Offline

Each app registers a service worker that caches itself on first load.
Google Fonts (OMNISTRUM) and React from unpkg (Modal Chords) are cached the
first time they load successfully, so **visit each app once while online**
before relying on it offline.

To remove the CDN dependency entirely — worth doing for Modal Chords, since
it won't start at all if React fails to load — download the two React files,
put them in `modalchords/vendor/`, change the two `<script src="https://unpkg.com/...">`
tags to `./vendor/react.production.min.js` and
`./vendor/react-dom.production.min.js`, and add those paths to the `CORE`
array in `modalchords/sw.js`.

## Updating an app

The service worker will keep serving the old cached build to installed
phones. After you replace an `index.html`:

1. Open that app's `sw.js`.
2. Bump the version: `const VERSION = 'omnistrum-v1';` → `'omnistrum-v2'`.
3. Push both files.

The old caches get deleted on next launch and the new build takes over.
Skip this step and you'll be debugging a phone that's running last week's
code.

## Notes

- iOS requires a tap before audio will start — both apps already gate their
  `AudioContext` behind a user gesture, so this is fine, but don't add
  anything that tries to make sound on load.
- `.nojekyll` matters: without it GitHub Pages ignores files and folders
  starting with `_`. Harmless to keep even though nothing here uses one.
- The icons are generated placeholders. Replace the PNGs in either
  `icons/` folder with your own at the same sizes and filenames if you want
  something different; nothing else needs to change.
