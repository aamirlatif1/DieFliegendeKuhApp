# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A German irregular-verb trainer (270 verbs) that runs offline in any browser. There is no build system, package manager, linter, or test framework — the files are served to the browser exactly as they sit on disk. UI languages are Russian (default), English, and Italian; repo docs and code comments are in Russian.

### The `file://` constraint

The app must keep working when `index.html` is opened directly by double-click, with no server. That rules out `fetch()`, XHR, and ES modules (`<script type="module">`) — browsers block all three on `file://` origins. Consequences to respect when changing anything:

- Scripts are plain classic `<script src>` tags sharing one global scope. No `import`/`export`.
- The verb data is `data/verbs.js`, a `.js` file assigning a global — **not** a `.json` file, which could only be read via a blocked `fetch()`. The payload inside it is still a valid JSON array.
- `<link rel="stylesheet">` and `data:` URIs are unaffected and load fine from `file://`, which is why the font and logo stay inlined as base64.

## Git workflow

Work happens on short-lived feature branches merged into `main` with merge commits (see `git log`). Commit messages are one-line English imperative sentences. Use `git mv` when renaming so history follows the file.

## Layout

```
index.html        markup only — no inline CSS or JS
css/              8 stylesheets, linked in <head>
js/               9 modules, loaded at the end of <body>
data/verbs.js     the 270-verb array
verb-images/      card illustrations, NNN-infinitiv.webp
```

`index.html` (~225 lines) is markup for all screens, each a sibling `<div>` toggled via the `hide` class. The only things still inlined are two `data:` URIs in `<head>`: the favicon and the app logo.

Eight `<link rel="stylesheet">` tags in `<head>`. **Link order is the cascade order** — the files were split at contiguous boundaries of the original `<style>` block, so reordering them can change which rule wins between equal-specificity selectors:

| File | Contents |
| --- | --- |
| `css/theme.css` | `:root` custom properties (`--accent`, `--accent2`, …) + the `prefers-color-scheme: light` overrides |
| `css/fonts.css` | the VT323 `@font-face` (base64 WOFF2, ~24 KB — the bulk of the CSS) |
| `css/base.css` | reset, `body`, `.wrap`, header, logo, language toggle, nav tabs, `.card`, generic `button` |
| `css/home.css` | range bar, presets, folder counters, `label.opt`, test-mode rows |
| `css/quiz.css` | progress bar, question, input fields, override chips, mistake table, score |
| `css/utils.css` | `.hide`, `.foot`, `.divider`, `input[type=file]`, `kbd` |
| `css/dict.css` | dictionary search, filter chips, table grid, `.masked` self-check blur |
| `css/cards.css` | flashcard, swipe tints, overlay/badge/example reveal states |

Ten `<script src>` tags at the end of `<body>`. **Load order is load-bearing** — each file declares globals the later ones use at parse time:

| File | Contents |
| --- | --- |
| `data/verbs.js` | `const VERBS` — the data, nothing else |
| `js/i18n.js` | `I18N`, `lang`, `t()`, `applyStaticI18n()`, `setLang()` |
| `js/state.js` | `MAXID`/`BYID`, progress load/save, range, folder counts |
| `js/check.js` | answer normalisation, `checkTrans()`, `checkPerf()`, `vTransOf()` |
| `js/nav.js` | `SCREENS`, `NAV_OF`, `show()` |
| `js/quiz.js` | test modes, quiz session, grading, results |
| `js/dict.js` | dictionary screen |
| `js/cards.js` | flashcard deck ("learn") incl. swipe handling |
| `js/io.js` | export/import |
| `js/main.js` | event wiring + init (must be last) |

A `const` at the top level of one file is visible to every file loaded after it. Cross-file *calls* are order-independent (they happen at runtime), but cross-file *top-level* code is not: `js/state.js` reads `VERBS` while it parses, and `js/main.js` touches the DOM and every other file's functions, so it stays last.

Sections inside each file are still marked with `/* ---------- NAME ---------- */` comments.

### Data model

`VERBS` in `data/verbs.js` is a single-line JSON array of 270 objects:
`{id, inf, hint, aux, pras, prat, perf: [..], trans, tKeys, transEn, tKeysEn, transIt, tKeysIt, example}`.

- `id` (1–270) is stable and load-bearing: it keys progress in localStorage, appears in export files, and forms image filenames. Never renumber. Two verb pairs share an infinitive (033/034 `ausziehen`, 205/206 `umfahren`) — `id` is the only disambiguator.
- `tKeys*` are lowercase stems used by `checkTrans()` for fuzzy answer matching (exact match, `answer.includes(stem)` for stems ≥3 chars, or stem contains an answer word ≥4 chars). When adding or editing a verb's translation, update its stems too, in all three languages.
- `perf` is an array to allow multiple accepted Perfekt forms; `checkPerf()` normalizes umlauts (`ä`→`ae`, `ß`→`ss`) so ASCII input is accepted.

### I18N

All UI strings live in the `I18N` object (`js/i18n.js`) with `ru`/`en`/`it` branches; `t(key)` looks up the current language. Static markup is translated via `data-i18n` / `data-i18n-placeholder` attributes resolved by `applyStaticI18n()`. Any new user-facing string must be added to **all three** language branches, and dynamic screens re-render on language switch inside `setLang()` — add new screens there if they show translated text.

### State & persistence

Per-verb progress is the `status` object (`id → "new" | "repeated" | "notlearned" | "learned"`), shared by all three tabs and saved to localStorage under `deutsch_verben_1_270_v1` (selected range under `..._range`, language under `deutsch_verben_1_270_lang`). All localStorage access is wrapped in try/catch so the app works with storage disabled. Export/import uses a JSON format (`version: 3`) whose `status` map is the only part import actually reads — keep imports backward-compatible.

### Screens & navigation

`SCREENS` (in `js/nav.js`) maps logical names (`home`, `dict`, `quiz`, `result`, `learnSetup`, `learnDeck`) to element ids; `show(name)` swaps visibility and syncs the nav tabs (`NAV_OF` maps screens to their owning tab). Keyboard handlers (Enter in quiz; ←/→/Space in cards) are guarded by checking which screen is visible.

## Verifying a change

Open `index.html` in a browser and exercise the affected tab by hand — that remains the only real check. Two failure modes the single-file version couldn't have:

- **Check the DevTools console and Network tab for 404s.** A mistyped `src`/`href`, or a new file never added to `index.html`, fails quietly: the page still renders, just without that rule or function. A missing `js/*.js` usually surfaces as a `ReferenceError` further down the chain rather than at the missing file itself.
- **Adding a file means adding its tag** to `index.html`, in the right position — see the load-order and cascade-order notes above.

For a fast regression sweep without a browser, jsdom loads the real `index.html` from disk with `runScripts: "dangerously", resources: "usable"` and executes all ten scripts and eight stylesheets. It is good for asserting that screens render, handlers fire, grading works, and that the parsed CSS rule list is unchanged after a refactor. It does no layout and does not implement `window.scrollTo` (harmless errors), so it cannot confirm anything visual. Note that `const` globals live in the global lexical environment, not on `window` — reach them with `window.eval("VERBS")`, not `window.VERBS`. Nothing like this is checked in: install it in a scratch directory outside the repo and keep the repo dependency-free.

## verb-images/

Card illustrations, named `NNN-infinitiv.webp` (zero-padded id, spaces→hyphens). Only some of the 270 exist; missing files fall back to a neutral placeholder, so partial coverage is fine. Format rules (WebP, ~800×1200, 30–80 KB) and the full filename checklist are in `verb-images/README.md`. Images stay external to the HTML (lazy-loaded), never base64-inlined.
