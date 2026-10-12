# Kinship Studio QA — 12 October 2026

## Scope and method

Profile keyboard/focus repair, mobile and laptop functional flows, responsive layout and interface guidelines. Upstream Anthropic webapp-testing and Vercel web-design-guidelines references are retained in .agents/skills with sources. The live browser workflow uses the available authorized browser controls; upstream Python automation is not executed.

## Automated checks

32 Node tests pass. New regression cases cover input identity/focus, clearing and retyping names, invalid-draft blur without inspector reconstruction, Arabic IME composition, selection preservation during keyboard-height resize, and preventing sidebar-resize keyboard events from moving a selected person. Existing coverage includes normalized model validation, cycles, migration, layout, PDF geometry/fonts/pagination, photo handling, IndexedDB ordering/recovery, and editor flows.

## Code review and fixes

- src/app.js:31 — invalid-field blur previously called global Undo and rebuilt the inspector; replaced by field-local validation and retention of the last valid value.
- src/chrome.js — visual viewport height changes previously reapplied panel state; height-only events now change dimensions without touching panel attributes or focus.
- src/app.js — profile fields now include names, autocomplete policy, name capitalization and next-key hints.
- src/app.js — keyboard shortcuts now respect consumed events and IME composition; sidebar resizing no longer moves a selected card.
- index.html — added skip-to-canvas navigation and a labeled main region.
- src/chrome.css — added focused-field scroll clearance, explicit touch feedback, light-theme error contrast and content visibility for the people list.

## Live checks

Pending deployment of this iteration. Final results will be recorded after browser verification.

## Qualification limits

Responsive Chromium checks do not reproduce a physical Android/iOS keyboard, Safari, VoiceOver or TalkBack. No WCAG conformance claim is made. Canvas nodes are not virtualized; very large-tree performance remains unqualified. Interactive card semantics include a nested child-add action and need dedicated assistive-technology review. Cloud-browser file and gesture checks are not physical-device checks.
