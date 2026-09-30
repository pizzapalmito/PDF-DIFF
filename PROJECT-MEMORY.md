# Project Memory — PDF DIFF

> Local PDF comparison and electrical drawing review app.
> Read Snapshot and Rules first. The README documents usage and limitations.

**Last updated:** 2026-09-30 · **Profile:** software-app · **Memory schema:** 1

## Snapshot
- **Status:** Initial implementation complete; source published to a private GitHub repository. Production build and 12 tests pass.
- **Source of truth:** This PDF DIFF folder on `main`; private repository: `pizzapalmito/PDF-DIFF`.
- **Implemented:** Browser PDF loading, index-based page pairing, overlay/split/revised views, pixel-difference suggestions, revision clouds, notes, manual device takeoff, circuit load summary, JSON review files, PDF and CSV exports.
- **Verification:** Browser checks covered note persistence, review status, marker placement, editable circuit/VA, 240 VA at 120 V = 2.00 A, saved-review restoration, two-sheet navigation, split comparison, manual clouds, local PDF import, invalid-file recovery and narrow-screen sheet navigation. Downloaded PDF reopened as two 1000 x 700-point pages; first page visually inspected with Poppler. CSV/JSON inspected directly.
- **Next step:** User evaluation against real project drawing pairs, especially drawing alignment and large-sheet readability.
- **Blocked on:** Nothing for this local deliverable.
- **Verify it works:** `npm test` (12 tests), `npm run build`, then `npm start` or `Start-PDF-DIFF.cmd`.
- **Runtime:** Local loopback only, port 4321. Do not assume a previous server remains running.

## Brief
- **Goal:** Make PDF revisions and electrical coordination easier to review locally.
- **Users:** Electrical drawing reviewers and designers.
- **Constraints:** The app processes drawings locally. Its source is in a private GitHub repository; browser memory holds source PDFs and review state, and saved JSON retains editable annotations.
- **In scope:** Visual comparison and manual coordination tools.
- **Out of scope:** Code compliance, automatic electrical symbol recognition, OCR, automatic alignment and conductor/protection sizing.
- **Related docs:** [README](README.md) contains operation instructions and practical limits.

## Checkpoints
### CP-004 · 2026-09-30 · Automatic Windows requirements setup

- **State:** Added requirements.ps1 and requirements.cmd. Start-PDF-DIFF.cmd runs setup before starting. Setup reuses working Node.js 20.15+ and npm or downloads a compatible official portable Node.js LTS ZIP, verifies SHA-256, and extracts under ignored .runtime/. No machine PATH or installation changes are made.
- **Dependencies/build:** npm ci --include=dev runs when Vite is missing or the lockfile fingerprint changes. Builds run when missing, packages changed, source inputs are newer, or -Rebuild is requested.
- **Evidence:** System-runtime setup and repeat setup pass. In an isolated copy with Node.js removed from PATH, official portable Node.js v24.21.0 installed, checksum verified, production build passed, and 12 tests passed. Repeat portable setup reused requirements.
### CP-003 · 2026-09-30 · Startup, drawing workspace and overlay exports

- **State:** Launcher installs missing dependencies and builds missing production output on fresh downloads. Comparison renders at up to 3200 pixels wide, exports at up to 6000 pixels wide, with a 24-million-pixel page cap. Expanded workspace hides side panels; zoom supports 600%.
- **Export:** Overlay exports include red/blue pixel differences using the current sensitivity and blend. Revised and Split exports use the revised sheet. Unpaired pages use revised content; mismatched proportions produce an actionable export error. Cloud visibility is respected.
- **Evidence:** Production build and 12 tests passed. Browser verified expanded workspace and reported successful sample overlay PDF export; exported PDF pixels were not separately inspected.
### CP-002 · 2026-09-28 · Private GitHub source publication

- **State:** Initialized Git for this folder and published the source to `pizzapalmito/PDF-DIFF` as a private repository.
- **Evidence:** `npm test`: 12/12 PASS; `npm run build`: PASS; repository visibility and remote commit verified after push.
- **Scope:** App source, tests, and documentation. `node_modules/`, `dist/`, and `tmp/` (including local QA PDFs) remain ignored.

### CP-001 · 2026-09-26 · Local comparison and review app
- **State:** Complete initial local app with bundled fonts, renderer and PDF worker.
- **Evidence:** `npm test`: 12/12 PASS. `npm run build`: PASS. Browser checks and downloaded artifact inspection described in Snapshot. No browser errors during normal workflow; intentional invalid-PDF test reported its error to the user.
- **Ref:** `src/`, `tests/`, `README.md`; QA fixtures and PDF render under ignored `tmp/qa/`.
- **Deferred:** Real project drawings, scanned drawings, password-protected documents and large-format raster-export readability have not been qualified.

## Decisions
### D-002 · 2026-09-26 · Local-only processing · Active
In the context of drawing confidentiality and the user's local-only preference, we chose browser-local processing over hosted storage, accepting manual saving and reopening of source files and review JSON.

### D-001 · 2026-09-26 · Software app memory profile · Active
In the context of a new Vite application with package scripts and tests, we chose the software-app profile over engineering-design, to track implementation and validation without implying that this app encodes engineering-code rules.

## Learnings
### L-001 · 2026-09-26 · Editable note persistence · [ui]
- **Symptom:** Browser edits to a note could disappear when the review panel rerendered.
- **Cause:** State synchronization relied on change/blur while actions could replace the editor.
- **Fix:** Synchronize fields on input without replacing the focused editor; render the panel on subsequent actions.
- **Rule:** Preserve field input state before panel rerenders. Keep a browser round-trip check for note persistence.
- **Where:** `src/app.js`, `bindEditor`.

## Rules
- Keep operation local unless the user explicitly changes that decision. (D-002)
- Do not represent pixel differences as recognized electrical objects or code checks. (D-001)
- Keep raster export limitations visible. Original PDFs must remain untouched. (CP-001)
- Keep static/unit/build, browser and downloaded-PDF validation distinct. (CP-001)

## Run & Verify
| Purpose | Command | Expected |
|---|---|---|
| Develop | `npm run dev` | Local app at 127.0.0.1:4321 |
| Test | `npm test` | 12 passing tests |
| Build | `npm run build` | Bundled output in dist |
| Use | `npm start` | Serve production build and open browser |

## Architecture Map
- `src/core.js`: Pure comparison, cloud geometry, CSV escaping and VA arithmetic.
- `src/pdf.js`: PDF.js load/render and pdf-lib raster export; SHA-256 file identity.
- `src/app.js`: Single-screen UI and in-memory review state; optional WebMCP actions reuse visible actions.
- `src/demo.js`: Deterministic two-sheet PDF fixtures. Preserve fixed metadata dates so fingerprints remain stable.

## Open Questions & Risks
- **R-001:** Scanned or misaligned drawings may yield false differences. Mitigation: require matching orientation/registration and manual review.
- **R-002:** Export is rasterized at 2200 pixels wide; large-format drawing detail can be lost. Mitigation: retain originals and JSON; consider vector-preserving export as a future explicit feature.
- **R-003:** Reloading discards unsaved state. Mitigation: use Save review before closing or refreshing; no automatic persistence is implemented.
