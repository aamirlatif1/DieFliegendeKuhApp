# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A German verb trainer that runs offline in any browser. It holds two independent **courses**, picked with a toggle above the nav tabs: *verb forms* (270 irregular verbs — Präsens/Präteritum/Perfekt) and *verbs with prepositions* (111 fixed `Verb + Präposition + Kasus` combinations). Both courses share every screen (trainer, dictionary, cards) but keep separate ranges and separate progress. There is no build system, package manager, linter, or test framework — the files are served to the browser exactly as they sit on disk. UI languages are Russian (default), English, and Italian; repo docs and code comments are in Russian.

### The `file://` constraint

The app must keep working when `index.html` is opened directly by double-click, with no server. That rules out `fetch()`, XHR, and ES modules (`<script type="module">`) — browsers block all three on `file://` origins. Consequences to respect when changing anything:

- Scripts are plain classic `<script src>` tags sharing one global scope. No `import`/`export`.
- The verb data is `data/verbs.js` and `data/prepverbs.js`, `.js` files assigning a global — **not** `.json` files, which could only be read via a blocked `fetch()`. The payload inside each is still a valid JSON array.
- `<link rel="stylesheet">` and `data:` URIs are unaffected and load fine from `file://`, which is why the font and logo stay inlined as base64.

## Git workflow

Work happens on short-lived feature branches merged into `main` with merge commits (see `git log`). Commit messages are one-line English imperative sentences. Use `git mv` when renaming so history follows the file.

## Layout

```
index.html        markup only — no inline CSS or JS
css/              8 stylesheets, linked in <head>
js/               11 modules + 3 label files, loaded at the end of <body>
data/verbs.js     the 270-verb array
data/prepverbs.js the 111 verb+preposition array
verb-images/      card illustrations, NNN-infinitiv.webp
```

`index.html` (~225 lines) is markup for all screens, each a sibling `<div>` toggled via the `hide` class. The only things still inlined are two `data:` URIs in `<head>`: the favicon and the app logo.

Eight `<link rel="stylesheet">` tags in `<head>`. **Link order is the cascade order** — the files were split at contiguous boundaries of the original `<style>` block, so reordering them can change which rule wins between equal-specificity selectors:

| File | Contents |
| --- | --- |
| `css/theme.css` | `:root` custom properties (`--accent`, `--accent2`, …) + the `prefers-color-scheme: light` overrides |
| `css/fonts.css` | the VT323 `@font-face` (base64 WOFF2, ~24 KB — the bulk of the CSS) |
| `css/base.css` | reset, `body`, `.wrap`, header, logo, language toggle, course toggle, nav tabs, `.card`, generic `button` |
| `css/home.css` | range bar, presets, folder counters, `label.opt`, test-mode rows |
| `css/quiz.css` | progress bar, question, masked-example line, input fields, Kasus/override chips, `.choices` answer options, mistake table, score |
| `css/utils.css` | `.hide`, `.foot`, `.divider`, `input[type=file]`, `kbd` |
| `css/dict.css` | dictionary search, filter chips, table grid, `hat`/`ist` and `akk`/`dat` colours, `.masked` self-check blur |
| `css/cards.css` | flashcard, swipe tints, overlay/badge/example reveal states, `.prepline` |

Sixteen `<script src>` tags at the end of `<body>`. **Load order is load-bearing** — each file declares globals the later ones use at parse time:

| File | Contents |
| --- | --- |
| `data/verbs.js` | `const VERBS` — the data, nothing else |
| `data/prepverbs.js` | `const PREPVERBS` — the data, nothing else |
| `js/i18n.js` | the language registry: `LANGS`, `LANG_ORDER`, `registerLang()`, `langMeta()`, `lang`, `initLang()`, `t()`, `tc()`, `applyStaticI18n()`, `setLang()` |
| `js/labels_ru.js` | Russian strings — one `registerLang()` call, nothing else |
| `js/labels_en.js` | English strings |
| `js/labels_it.js` | Italian strings |
| `js/course.js` | `COURSES`, `course`, `ITEMS()`, `isPrep()`, `maskExample()`, `setCourse()` |
| `js/state.js` | `MAXID`/`BYID`, progress load/save, range, presets, folder counts |
| `js/check.js` | answer normalisation, `checkTrans()`, `checkPerf()`, `checkPrep()`, `checkSecond()`, `secondOf()` |
| `js/choices.js` | multiple-choice distractors: `buildChoices()`, `prepDistractors()`, `perfDistractors()` |
| `js/nav.js` | `SCREENS`, `NAV_OF`, `show()` |
| `js/quiz.js` | test modes, quiz session, grading, results |
| `js/dict.js` | dictionary screen |
| `js/cards.js` | flashcard deck ("learn") incl. swipe handling |
| `js/io.js` | export/import |
| `js/main.js` | event wiring + init (must be last) |

A `const` at the top level of one file is visible to every file loaded after it. Cross-file *calls* are order-independent (they happen at runtime), but cross-file *top-level* code is not: `js/course.js` reads `VERBS`/`PREPVERBS` while it parses, and `js/main.js` touches the DOM and every other file's functions, so it stays last. In `js/main.js` the init line calls `loadProgress()` **before** `applyStaticI18n()`, because loading builds the course index (`MAXID`) that the static strings interpolate.

Sections inside each file are still marked with `/* ---------- NAME ---------- */` comments.

### Courses

`js/course.js` owns the switch. `COURSES` maps a course id to its data array, its localStorage key, its preset chunk size, and whether it has card images; `course` is the active id (persisted under `deutsch_course`), `ITEMS()` returns the active array and `isPrep()` is the branch predicate used by the shared screens. Everything downstream reads `ITEMS()` — never `VERBS` directly — so a screen works in both courses automatically.

The trainer's second question field is the one place the courses genuinely differ: Perfekt in the verbs course, preposition + case in the prep course. `checkSecond()`/`secondOf()` in `js/check.js` dispatch on the course, so quiz, results, dictionary and cards all call those instead of touching `v.perf`. `setCourse()` rebuilds the index, re-applies the i18n strings, restores that course's saved range and re-renders the visible screen; it drops any in-flight quiz/deck (the toggle is hidden on those screens anyway).

`maskExample(v)` blanks the preposition out of a prep verb's example sentence (`hängt vom Wetter ab` → `hängt ___ Wetter ab`), covering contracted and `da(r)-` forms via `PREP_FORMS`. That masked sentence is the quiz prompt's context line and the front of the flashcard — it is also what disambiguates the ~17 verbs that appear twice with different prepositions (`bestehen aus` / `bestehen auf`), so **every prep entry's example must contain its preposition**.

### Answer modes (input / multiple choice)

The «Как отвечать» radio pair on the trainer screen (`input[name="ansmode"]`, read once per test by `selectedAnsMode()` and stored on `session.ansMode`) decides how the **second** field is answered. The translation field is always typed — `choiceOn()` is `session.ansMode === "choice" && session.askP`, and when it is false the screen behaves exactly as before. Nothing about the mode is persisted, like the other test checkboxes.

In choice mode `renderQuestion()` hides `#inPerf` and the Kasus chips and fills `#choiceList` with four `.choice` buttons (numbered 1–4, also selectable with those keys — the handler in `js/main.js` ignores digits typed inside an `<input>`). `doCheck()` bails out with `alertPickOption` if nothing is selected — before grading the translation, so the question stays re-answerable — then compares the picked string with `session.choices.correct` and paints the buttons via `markChoices()`. `curEval.ansP` holds the picked option, so the mistake table needs no special case.

`js/choices.js` builds the four options; `buildChoices(v)` returns `{correct, options}` with `options` already shuffled.

- **Prep course**: the three wrong options are other `prep + kasus` pairs drawn from the 17 that occur in `PREPVERBS`, so the same preposition with the other case (`an + A` vs `an + D`) can show up as a distractor.
- **Verbs course**: the wrong options are *malformed Perfekt forms of the same verb*, never other verbs' forms — otherwise the answer would be readable off the stem. One distractor always keeps the right participle with the wrong auxiliary (`ist abgebrochen`), the rest mangle the participle: weak ending (`hat abgebrocht`), stem taken straight from the infinitive (`hat abgebrechen`), missing `ge-` (`hat abbrochen`). Auxiliaries are assigned so the correct one is not the odd one out. `gePrefix()` finds where `ge-` sits in the participle by matching the infinitive's separable prefix; verbs with no `ge-` in the participle (`verstanden`) fall back to infinitive-shaped forms (`hat versteht`, `hat verstehen`). Candidates are deduplicated through `normPerf()` and checked against **every** entry of `v.perf`, so a verb with two accepted forms can never see one of them offered as a wrong answer; `perfFallback()` tops up from other verbs if a verb yields fewer than three.

### Data model

`VERBS` in `data/verbs.js` is a single-line JSON array of 270 objects:
`{id, inf, hint, aux, pras, prat, perf: [..], trans, tKeys, transEn, tKeysEn, transIt, tKeysIt, example}`.

- `id` (1–270) is stable and load-bearing: it keys progress in localStorage, appears in export files, and forms image filenames. Never renumber. Two verb pairs share an infinitive (033/034 `ausziehen`, 205/206 `umfahren`) — `id` is the only disambiguator.
- `tKeys*` are lowercase stems used by `checkTrans()` for fuzzy answer matching (exact match, `answer.includes(stem)` for stems ≥3 chars, or stem contains an answer word ≥4 chars). When adding or editing a verb's translation, update its stems too, in all three languages.
- `perf` is an array to allow multiple accepted Perfekt forms; `checkPerf()` normalizes umlauts (`ä`→`ae`, `ß`→`ss`) so ASCII input is accepted.

`PREPVERBS` in `data/prepverbs.js` is the same shape minus the conjugation fields, one object per line:
`{id, inf, hint, prep, kasus, trans, tKeys, transEn, tKeysEn, transIt, tKeysIt, example}`.

- `inf` is the verb including a reflexive `sich` (`sich ärgern`); `prep` is the preposition and `kasus` is `"A"` or `"D"`. The pair is the answer, rendered everywhere as `prep + " + " + kasus` by `prepAnswerOf()`.
- `id` (1–111) follows the source PDF's alphabetical order and keys progress the same way verb ids do — never renumber. Duplicate infinitives are expected (`bestehen`, `sprechen`, …); the preposition is what differs.
- `tKeys*` work exactly as in `VERBS`. Translations came from the English column of `Verben_mit_Praepositionen_EN.pdf` — the source PDF, no longer tracked in the repo; the Russian and Italian ones were written for this app.
- Examples are the PDF's, except id 74 (`schicken an`), whose original sentence contained no `an` and would have masked to nothing.

### I18N

One language = one file. `js/labels_<code>.js` contains a single `registerLang(code, meta, strings)` call; `js/i18n.js` holds only the machinery (`LANGS`, `LANG_ORDER`, `t()`, `tc()`, `setLang()`, …) and no strings. `meta` is `{name, transField, tKeysField}` — the toggle-button caption plus the names of that language's translation fields in the data, which `js/check.js` reads through `langMeta()` instead of a hard-coded lang→field map.

`t(key)` looks up the current language and falls back to `DEFAULT_LANG` (`ru`) for a missing key, so a partially translated new language still renders. Static markup is translated via `data-i18n` / `data-i18n-placeholder` attributes resolved by `applyStaticI18n()`. Dynamic screens re-render on language switch inside `setLang()` — add new screens there if they show translated text.

**Adding a language:** copy a `js/labels_*.js`, translate the values, add the `transEn`-style translation/stem fields it names to `data/verbs.js` and `data/prepverbs.js`, and add one `<script src>` tag after `js/i18n.js`. Nothing else — the header buttons are built by `renderLangToggle()` from `LANG_ORDER` (registration order = button order), and `js/main.js` wires the toggle by delegation because those buttons do not exist until `initLang()` runs. `initLang()` runs first in the init line: it resolves the saved language before `loadProgress()` writes its first translated status line.

Adding a *string* still means adding it to every `labels_*.js` — the fallback keeps the app working, but it shows Russian.

Course-dependent wording goes through `tc(key)`, which prefers `key + "_prep"` when the prep course is active and falls back to `key` otherwise — so only the strings that actually differ need a second entry (`chkPerfLbl_prep`, `dheadPerfekt_prep`, …). `applyStaticI18n()` resolves `data-i18n` through `tc()` and calls the value with `MAXID` if it is a function (that is how `filterAll`/`presetAll` show the right count per course), which is why switching course just re-runs it.

### State & persistence

Per-verb progress is the `status` object (`id → "new" | "repeated" | "notlearned" | "learned"`), shared by all three tabs. `statuses` holds one such map per course and `status` points at the active course's map — reassign it only through `rebuildIndex()`/`resetProgress()`, or the two go out of sync. Each course saves under its own key (`deutsch_verben_1_270_v1`, `deutsch_praep_1_111_v1`), with its selected range under `<key>_range`; language lives under `deutsch_verben_1_270_lang` and the active course under `deutsch_course`. All localStorage access is wrapped in try/catch so the app works with storage disabled.

Export/import is `version: 4`: `courses.{verbs,prep}.status` carries both maps, and the top-level `summary`/`folders`/`status` fields still mirror the verbs course so older readers see what they expect. Import reads `courses` when present and otherwise treats the file as v3 verbs-course progress — keep that fallback.

### Screens & navigation

`SCREENS` (in `js/nav.js`) maps logical names (`home`, `dict`, `quiz`, `result`, `learnSetup`, `learnDeck`) to element ids; `show(name)` swaps visibility and syncs the nav tabs (`NAV_OF` maps screens to their owning tab). Keyboard handlers (Enter in quiz; ←/→/Space in cards) are guarded by checking which screen is visible.

## Verifying a change

Open `index.html` in a browser and exercise the affected tab by hand — **in both courses** — that remains the only real check. Two failure modes the single-file version couldn't have:

- **Check the DevTools console and Network tab for 404s.** A mistyped `src`/`href`, or a new file never added to `index.html`, fails quietly: the page still renders, just without that rule or function. A missing `js/*.js` usually surfaces as a `ReferenceError` further down the chain rather than at the missing file itself.
- **Adding a file means adding its tag** to `index.html`, in the right position — see the load-order and cascade-order notes above.

For a fast regression sweep without a browser, jsdom loads the real `index.html` from disk with `runScripts: "dangerously", resources: "usable"` and executes all sixteen scripts and eight stylesheets. It is good for asserting that screens render, handlers fire, grading works, and that the parsed CSS rule list is unchanged after a refactor. It does no layout and does not implement `window.scrollTo` (harmless errors), so it cannot confirm anything visual. Note that `const` globals live in the global lexical environment, not on `window` — reach them with `window.eval("VERBS")`, not `window.VERBS`. It also serves the page from a `file://` URL, whose opaque origin makes `localStorage` throw — the app's try/catch swallows that, but a test that touches storage directly must not. Nothing like this is checked in: install it in a scratch directory outside the repo and keep the repo dependency-free.

## verb-images/

Card illustrations, named `NNN-infinitiv.webp` (zero-padded id, spaces→hyphens). Only some of the 270 exist; missing files fall back to a neutral placeholder, so partial coverage is fine. Format rules (WebP, ~800×1200, 30–80 KB) and the full filename checklist are in `verb-images/README.md`. Images stay external to the HTML (lazy-loaded), never base64-inlined.
