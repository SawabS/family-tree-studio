# Kinship Studio QA — 12 October 2026

## Scope and method

Profile keyboard/focus repair, mobile and laptop functional flows, responsive layout and interface guidelines. Upstream Anthropic webapp-testing and Vercel web-design-guidelines references are retained in .agents/skills with sources. The live browser workflow uses the available authorized browser controls; upstream Python automation is not executed.

## Automated checks

33 Node tests pass. New regression cases cover input identity/focus, clearing and retyping names, invalid-draft blur without inspector reconstruction, Arabic IME composition, selection preservation during keyboard-height resize, and preventing sidebar-resize keyboard events from moving a selected person. Existing coverage includes normalized model validation, cycles, migration, layout, PDF geometry/fonts/pagination, photo handling, IndexedDB ordering/recovery, and editor flows.

## Code review and fixes

- src/app.js:31 — invalid-field blur previously called global Undo and rebuilt the inspector; replaced by field-local validation and retention of the last valid value.
- src/chrome.js — visual viewport height changes previously reapplied panel state; height-only events now change dimensions without touching panel attributes or focus.
- src/app.js — profile fields now include names, autocomplete policy, name capitalization and next-key hints.
- src/app.js — keyboard shortcuts now respect consumed events and IME composition; sidebar resizing no longer moves a selected card.
- index.html — added skip-to-canvas navigation and a labeled main region.
- src/chrome.css — added focused-field scroll clearance, explicit touch feedback, light-theme error contrast and content visibility for the people list.

## Live checks

Published Chromium checks completed with two explicitly synthetic QA records:

| Area | Executed result |
| --- | --- |
| Phone profile focus | Clear name, sequential English/Arabic typing, Home/Arrow caret movement, invalid draft blur, native Tab to next field: focus and input identity retained |
| Profile contents | Preferred name, location, email, phone, Markdown preview, custom fields and HTTP references: saved and preserved after reload |
| Relationships | New child defaulted to unspecified parent type; ancestry-cycle attempt rejected; removed/recreated adoptive link; undo/redo passed |
| Canvas | Zoom out, fit and auto layout passed |
| Sidebars and themes | Laptop width changes, close/reopen, search, light/dark toggle passed; phone panels remained fullscreen |
| Responsive layouts | 320x640, 375x740, 430x850, 844x390, 1024x768, 1280x800, 1440x900: body width equals viewport width; toolbar fits |
| Poster controls | All eight A1–A4/orientation previews had correct dimensions; 500% tiled A4 preview produced three pages |
| Validation | Invalid poster margin disabled export; review found stale preview remained visible and this was fixed with regression coverage; unsafe reference URL rejected |
| JSON backup | Downloaded schema-v2 JSON inspected: two QA records and one adoptive relationship |
| Photos/attachments/import | Live file upload denied by browser permission policy; no workaround attempted. Automated photo, attachment-preservation and import-validation coverage passes |

The header inspector icon is now a minimal person outline, with no visible button box. Keyboard focus indication and accessible labeling remain.

The poster-preview fix and minimal icon were verified in the published app: invalid margin clears all preview pages and disables export; the header icon has no rectangle, transparent background and transparent border. The A2 landscape PDF downloaded successfully; its contents were inspected and contact details were excluded. A narrow laptop-canvas overlap between minimap and toolbar was found; the minimap is now above the toolbar and resizing preserves at least 320px of canvas. Added a ten-step visualViewport keyboard-animation regression test, preserving focus, selection and panel markup at each step. Final cleanup and layout recheck follow this last adjustment.

## Qualification limits

Responsive Chromium checks do not reproduce a physical Android/iOS keyboard, Safari, VoiceOver or TalkBack. No WCAG conformance claim is made. Canvas nodes are not virtualized; very large-tree performance remains unqualified. Interactive card semantics include a nested child-add action and need dedicated assistive-technology review. Cloud-browser file and gesture checks are not physical-device checks.
