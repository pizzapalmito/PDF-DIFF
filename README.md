# PDF DIFF

A local drawing-comparison and electrical coordination app. PDFs and annotations are processed in the browser; nothing is uploaded. Fonts, PDF rendering workers, and dependencies are bundled locally.

## Open the app

Double-click **Start-PDF-DIFF.cmd**, then open http://127.0.0.1:4321. The launcher runs the requirements setup automatically: it checks Node.js and npm, downloads a portable Node.js LTS runtime from nodejs.org into `.runtime/` if a working Node.js 20.15+ installation is missing, verifies the archive SHA-256 checksum, installs locked dependencies (including Vite), and builds the app. No administrator access or separate Vite install is needed. First-time setup needs internet access and a writable project folder. Keep the server window open. If the preview is already running on port 4321, simply open that URL.

For setup without launching: double-click **requirements.cmd**, or run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\requirements.ps1 -Rebuild` from the project folder. If PowerShell is blocked by organizational policy, contact IT. The launcher changes execution policy only for its own PowerShell process; it does not change machine settings. Subsequent launches reuse the runtime and packages, reinstall when the lockfile changes, and rebuild when source files are newer than the build.

For manual setup with an existing Node.js installation: `npm ci --include=dev`, then `npm run build` and `npm start`.

For development: `npm run dev`. Validate with `npm test` and `npm run build`.

## Drawing review

1. The app initially opens a clearly marked, two-sheet sample project. Its first sheet includes unreviewed sample clouds generated from the actual PDF differences.
2. Click **Original** and **Revised** to open your PDFs. Pages are paired by index. Replacing the revised file asks before clearing existing annotations.
3. Compare in **Overlay**, **Split**, or **Revised** view. Blue ink is added; red ink is removed. Use sensitivity and blending under **Settings**. Different page proportions disable automatic comparison.
4. Click **Auto-cloud changes**, or choose **Revcloud** and drag a rectangle. Select a cloud to edit its label, note and review status. In Select mode, drag a markup to reposition it. Undo reverses annotation edits. Auto-cloud processes the currently selected page only.
5. In **Electrical**, choose a device and click the drawing to place markers. Edit circuit and VA for each marker. Counts are per sheet; circuit summaries aggregate the loaded drawing set. VA defaults are editable placeholders, not code-prescribed values.
6. **Export review** creates either an all-sheet reviewed PDF or a CSV register containing every annotation. The reviewed PDF is a raster copy with flattened markups, not editable PDF annotations. Detailed review notes and circuit data are included in CSV/JSON; the PDF shows cloud labels, note labels and device symbols.
7. **Save review** downloads editable markups as JSON. Keep it with the PDFs. Use the folder icon beside Drawing set to load it. The revised PDF's SHA-256 fingerprint must match, even if the filename is the same. The original PDF need not be present to restore revised-sheet markups.

Shortcuts: **V** select, **C** cloud, **D** device, **N** note, **Ctrl+Z** undo, **Escape** select. Zoom and fit controls are in the drawing toolbar. A sheet selector remains available below the drawing on smaller screens.

## Practical limits

- Visual pixel comparison only; no OCR, electrical symbol recognition, automatic alignment, sheet-number matching or electrical-code certification.
- Matching orientation, scale and registration give the best result. Scans, translation and inconsistent exports can create false-positive regions. Review every suggested cloud.
- Comparison renders at up to 3,200 pixels wide; PDF exports at up to 6,000 pixels wide, capped at 24 million pixels per page. Zoom up to 600% and use Expand drawing workspace to hide side panels. Exports from Overlay view include red/blue differences with the current sensitivity and blend; Revised and Split views export the revised drawing. Unpaired pages export revised content. Exports are still raster copies. Original PDFs are never modified.
- Electrical calculations use entered apparent power: `I = VA / V`, or `VA / (sqrt(3) * V)` for balanced three-phase loads. No demand, diversity, continuous-load, breaker, ampacity, voltage-drop or fault-current calculation is implied.
- Password-protected PDFs must be unlocked before loading. File picker accepts up to 150 MB; browser memory is the practical limit for large drawing sets.
- Work lives in memory. Save a review before refreshing or closing. Review JSON contains labels and notes, not the source PDFs. Nothing is published.

## Implementation

- `src/app.js`: review state, UI, tools, page pairing and local import/export.
- `src/core.js`: pure pixel difference, cloud geometry, CSV safety and load arithmetic.
- `src/pdf.js`: PDF.js rendering, file fingerprinting and pdf-lib raster export.
- `src/demo.js`: deterministic sample PDFs, marked not for construction.
- `tests/`: focused algorithms and sample-PDF checks.

Primary library references: [PDF.js](https://mozilla.github.io/pdf.js/getting_started/) and [pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfdocument).
