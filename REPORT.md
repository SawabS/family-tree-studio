# Kinship Studio development report

Version 0.2.0, 12 October 2026.

## Implemented

Extended the supplied editor and retained its canvas, profiles, search, history and mobile drawers. Added a green/ivory theme, empty onboarding, keyboard-accessible cards, keyboard/numeric alternatives to dragging, minimap and pinch handling. Profiles support photographs, dates, places, contacts, biography and notes, Markdown formatting and sanitized preview, custom fields, attachments and references. Parent links distinguish unspecified, biological, adoptive, guardian and other; partner and spouse links are distinct.

Normalized version 2 JSON uses maps keyed by stable identifiers. A JSON Schema documents interchange; runtime validation also enforces identity, endpoints, duplicates, dates, finite geometry, safe raster photographs and ancestry acyclicity. Legacy imports migrate without inferring parent type. IndexedDB queues transactional saves and retains one previous distinct snapshot. Existing localStorage migrates only after successful loading/saving. Web Locks prevent concurrent writers where supported. Undo/redo holds up to 30 in-memory snapshots. Private backup export, import and previous-save restoration are available.

Vector PDF posters include names, dates and connections; A1–A4; both orientations; margins, titles and typography; embedded sans/serif fonts; fit-to-page and automatic tiled pagination. SVG previews and page downloads are also available. Photographs, contacts and biographies are excluded from posters.

## Preservation and privacy

The supplied private dataset was extracted outside Git. A comparison confirmed preservation of all 19 people, names and identifiers and all 18 parent links; the input has no other relationships. The separate private archive contains the original project, untouched JSON and a normalized importable backup. None is included in source or deployment. No demonstration dataset was approved, so startup is empty. Browser assets and fonts are bundled, Markdown does not fetch remote images, and a content security policy limits resource loads. Records and backups are not encrypted.

The retained Actions workflow now runs npm ci, tests and an allowlisted build before deploying only dist. The owner created https://github.com/SawabS/family-tree-studio as public. Three incremental development commits were imported after the initial README commit. All 18 tests and the allowlisted build passed in GitHub Actions. The owner subsequently enabled Pages from main/root: GitHub’s branch publishing workflow (run 38215939206) completed successfully. The live site https://sawabs.github.io/family-tree-studio/ was opened and tested in desktop Chrome on 12 October 2026. Person creation, Markdown rendering, IndexedDB persistence after reload, poster preview and an A2 landscape vector PDF download worked. The disposable local QA record was removed. No private family backup was uploaded. The supplied custom deployment workflow is retained; switching Pages Source to GitHub Actions is needed to use that test-and-build route instead of branch publishing. The agent did not change repository visibility.


## Executed tests

18 automated tests passed: normalized round-trip and legacy migration; profile/attachment preservation; cycle rejection across parent types; missing endpoints; duplicate identities/relationships; unsafe photographs/references; dates/geometry; nonoverlapping generation spacing; a 5,000-person deep chain; all eight ISO paper/orientation geometries; tiled pagination; SVG escaping/clipping; generated PDF font embedding and dimensions; IndexedDB save ordering/recovery; and DOM integration through creation, profile input, Markdown, custom fields, relationships, cycle rejection, undo/redo and poster preview.

Generated PDF output was rendered with Poppler and inspected for basic layout and glyph appearance. Syntax, lockfile and build checks completed. Private seed identifiers were checked against build output. Tests use Node, jsdom and fake-indexeddb; DOM integration is not browser end-to-end verification.

## Remaining qualification and limitations

GitHub source publication and branch-based Pages deployment are complete. Desktop Chrome smoke checks passed. Mobile/tablet device testing, real touch gestures, visual regression, assistive-technology checks and large-tree frame-rate measurements remain unperformed. Mobile/tablet CSS is implemented but those actual browser layouts are unverified.

Layout separates generations and orders siblings by parent positions; it does not optimize partnerships or crossing counts. Cards are not virtualized; rendering and full-tree validation need large-tree profiling despite the 20,000-person cap. Undo snapshots can be expensive with attachments. Inline base64 attachments are limited to 10 MB each; JSON imports to 100 MB.

SVG previews approximate PDF text wrapping. Very long indivisible names need stronger overflow treatment. RTL/complex-script PDF shaping needs dedicated visual tests: font coverage checks do not establish shaping correctness. PDF cards omit photographs and tagged accessibility structure. Multipage SVG downloads may prompt for permission. GEDCOM, encryption, collaboration, multiple trees and an installable offline service worker are not implemented. Loading the shell requires it to be available; records themselves stay local.

This is a tested development iteration, not completed production qualification.

## Research

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements
- https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

Bundled: marked 17.0.5, pdf-lib 1.17.1, fontkit 1.1.1. Library and font licenses are retained in vendor.
