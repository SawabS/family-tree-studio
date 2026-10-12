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

## Photograph and branding update

The profile now has a prominent Upload photograph/Change photograph control and a removal button. PNG, JPEG, WebP and GIF inputs up to 15 MB are decoded in the browser, resized to at most 512 pixels on their longest side without enlarging small images, and stored as local JPEG data. Transparency is flattened onto white and GIFs become still images. Portraits appear in the inspector, people list and canvas card. A locally bundled SVG logo and favicon show a fluffy green tree with a brown trunk.

The updated suite has 22 passing tests, including aspect-ratio preservation, size/type rejection, local JPEG preparation and decoder cleanup. Both Pages deployment workflows succeeded. The live browser photo upload and reload-persistence check passed using a disposable synthetic image; its temporary local record was removed. No personal photographs or family records were committed.

## Mobile, themes and author credit update

Dark is now the default, with a saved dark/light toggle. The canvas, panels and cards use distinct charcoal/navy tones, muted borders and restrained mint accents. Compact 20px SVG icons replace oversized text glyphs; phone drawers have 44px close targets, accessible modal state and independent scrolling. The phone toolbar fits at 320px; safe-area spacing and keyboard-aware height handling are included. The people panel links to https://github.com/SawabS with a GitHub icon and Developed by SawabS credit.

All 25 automated tests passed locally and in Actions, including drawer state/focus, responsive breakpoints and theme persistence. Live Chrome checks at 320x640, 375x740, 430x850 and 844x390 confirmed no horizontal page overflow and fitting controls. Creation, drawer opening/closing and both theme directions worked in the published app. The 375px profile uses 16px inputs and a 44px close control. A stacking-context issue that intercepted drawer taps was fixed and covered by a regression assertion. Both deployment workflows succeeded for commit 76fcc6b. The disposable local QA record was removed. These responsive browser checks supersede the earlier unverified-layout statement; physical-device touch gestures, assistive technologies and large-tree performance still need qualification.

## Neutral glass and panel interaction update

Replaced the blue dark palette with neutral graphite and restrained green accents. Navigation and panels use frosted glass with solid fallbacks for reduced transparency/increased contrast; family records remain opaque. The print action inherits the neutral control style. Each child-add button is centered on the card's right edge and its SVG is centered within the circular control.

Panels now hide and reopen on desktop, tablet and phone. Desktop headers support pointer dragging, arrow-key movement, Home and double-click reset, with viewport clamping. Compact panel headers support outward swipe dismissal; form content still scrolls independently. The previous controller ignored desktop open/close calls and hid desktop triggers; both causes were corrected. All 27 tests pass, including independent desktop closure/reopening, movement/reset and swipe dismissal. Build output remains an allowlisted application shell.

Design reference: https://developer.apple.com/design/human-interface-guidelines/materials — translucent navigation above content, with readable surfaces and accessibility fallbacks. This web treatment uses CSS blur and is not Apple's native Liquid Glass renderer.

Published Chrome verification: both desktop panels closed and reopened; a pointer drag moved the people panel from (12,84) to (122,122), and Home reset it. The phone drawer opened, closed, reopened and dismissed with an outward pointer swipe. The child control vertical centering error was below 0.001px and its SVG centering error was 0px. Both theme directions worked. At widths 320, 375, 430 and 844px, body scroll width matched viewport width and the toolbar fit. Both GitHub Pages workflows succeeded for af59eb4. The synthetic QA record was removed. Physical iOS/Safari and Android touch testing remains unperformed.

## Fullscreen phone panels and canvas-first creation

At phone widths (up to 760px), both panels now occupy the entire visual viewport, including the header area, with no corner radius, border or 400px width cap. Close controls remain in the panel header and safe-area padding protects them. Tablet and desktop panel layouts are retained. Adding a person on a phone closes any open panel and focuses the canvas; opening the profile requires an explicit card/list/inspector action. The DOM integration test now checks phone creation stays on the canvas and Enter on the card opens the profile. All 27 tests and the allowlisted build pass.

## Docked, resizable sidebars and IBM Plex typography

Above 760px, the people sidebar is attached to the left edge and inspector to the right edge. They occupy grid columns rather than overlap the canvas. Closing frees their width; reopening restores it. Inner-edge separators support pointer resizing and Left/Right arrow keys (Shift for larger increments, Home for default widths). Widths are bounded to preserve canvas space and saved locally. All header dragging and swipe movement were removed. Phone panels retain full-viewport coverage and canvas-first person creation.

English uses IBM Plex Sans and Arabic uses IBM Plex Sans Arabic, with bundled 400/500/600/700 WOFF2 faces from Google Fonts and their OFL license. Fonts are served from the application origin with no runtime Google Fonts requests. Headings and controls use the same family. All 28 tests pass, including pointer width bounds, independent resizing, persistence, close/reopen and removal of movement controls.

## Keyboard stability and expanded QA

Profile fields retain their DOM nodes, focus, caret and composition sessions during edits. Temporary invalid drafts do not enter the saved model; blur restores the field's last valid value without global Undo or inspector reconstruction. Keyboard-height-only events update available space without reapplying panel state. The header profile action uses a simple human outline with no visible box. The UI audit also corrected invalid poster previews and minimap/toolbar overlap on narrow canvases.

33 automated tests pass. The repository retains upstream QA skill references and QA_REPORT.md documents the mobile/laptop live test matrix, seven responsive sizes, persistence, relationships, Markdown, backups, PDFs and remaining qualification limits. Browser file upload permission was denied, so live photo/attachment/import checks were not completed in this pass. Physical Android/iOS keyboard and assistive-technology verification remain outstanding. No real records or photographs were published.
