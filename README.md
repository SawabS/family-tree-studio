# Kinship Studio

A local-first genealogical whiteboard. This project extends the supplied editor and retains its GitHub Pages Actions workflow. The shell starts empty; personal records are imported explicitly and remain in browser IndexedDB.

## Run

Node 22 or newer. Run npm ci for the automated DOM and persistence tests. The app bundles its browser dependencies and does not load a CDN.

```sh
npm ci
npm test
npm run build
npm run dev
```

The local server listens on localhost:5173. For GitHub Pages, create a private repository, push main, then select Actions as the Pages source. Private-repository Pages requires a compatible paid GitHub plan. Never change repository visibility without the owner's approval. The Actions job tests and publishes only the allowlisted dist directory.

## Privacy

No real family records, photographs, tracking, remote fonts, or approved demonstration dataset are included. Import your private backup through the editor; do not put it in this repository. Browser storage is not encrypted and may be cleared by the browser or OS. Download regular backups, protect the exported files, and use a trusted device. Pages publishes the application shell publicly even when its source repository is private on eligible personal plans.

## Architecture

The retained editor uses native ES modules, bundled marked for Markdown with an explicit HTML allowlist, bundled pdf-lib for vector poster output, IndexedDB transactions for autosave and one prior recovery snapshot, and a normalized version 2 interchange model. No cloud backend or account is required. See REPORT.md for tested features and known limits.
