# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A German trainer that runs offline in any browser. It holds three independent **courses**, picked with a toggle above the nav tabs: *verb forms* (270 irregular verbs — Präsens/Präteritum/Perfekt), *verbs with prepositions* (111 fixed `Verb + Präposition + Kasus` combinations) and *Lernwortschatz B2 Beruf* (1135 words and phrases from the 14 chapters of *Linie 1 Beruf B2*). All three share every screen (trainer, dictionary, cards) but keep separate ranges and separate progress. There is no build system, package manager, linter, or test framework — the files are served to the browser exactly as they sit on disk. UI languages are Russian (default), English, Italian, and Turkish; repo docs and code comments are in Russian.

### The `file://` constraint

The app must keep working when `index.html` is opened directly by double-click, with no server. That rules out `fetch()`, XHR, and ES modules (`<script type="module">`) — browsers block all three on `file://` origins. Consequences to respect when changing anything:

- Scripts are plain classic `<script src>` tags sharing one global scope. No `import`/`export`.
- The verb data is `data/verbs.js` and `data/prepverbs.js`, `.js` files assigning a global — **not** `.json` files, which could only be read via a blocked `fetch()`. The payload inside each is still a valid JSON array. The translations of that data live beside it in `data/translations_<course>_<lang>.js`, one `registerTranslations()` call per file, for the same reason.
- `<link rel="stylesheet">` and `data:` URIs are unaffected and load fine from `file://`, which is why the font and logo stay inlined as base64.

## Git workflow

Work happens on short-lived feature branches merged into `main` with merge commits (see `git log`). Commit messages are one-line English imperative sentences. Use `git mv` when renaming so history follows the file.

## Layout

```
index.html        markup only — no inline CSS or JS
css/              8 stylesheets, linked in <head>
js/               12 modules + 4 label files, loaded at the end of <body>
data/verbs.js     the 270-verb array (German + example only)
data/prepverbs.js the 111 verb+preposition array (German + example only)
data/wortschatz.js the 1135-word Lernwortschatz array (German + example only)
data/translations_<course>_<lang>.js   one file per course × language: id → {trans, tKeys}
verb-images/      card illustrations, NNN-infinitiv.webp
```

`index.html` (~267 lines) is markup for all screens, each a sibling `<div>` toggled via the `hide` class. The only things still inlined are two `data:` URIs in `<head>`: the favicon and the app logo.

Eight `<link rel="stylesheet">` tags in `<head>`. **Link order is the cascade order** — the files were split at contiguous boundaries of the original `<style>` block, so reordering them can change which rule wins between equal-specificity selectors:

| File | Contents |
| --- | --- |
| `css/theme.css` | `:root` custom properties (`--accent`, `--accent2`, …) + the `prefers-color-scheme: light` overrides |
| `css/fonts.css` | the VT323 `@font-face` (base64 WOFF2, ~24 KB — the bulk of the CSS) |
| `css/base.css` | reset, `body`, `.wrap`, header, logo, language toggle, course toggle, nav tabs, `.card`, generic `button` |
| `css/home.css` | range bar, presets, folder counters, `label.opt`, test-mode rows |
| `css/quiz.css` | progress bar, question, masked-example line, input fields, Kasus/override chips, `.choices` answer options, mistake table, score |
| `css/utils.css` | `.hide`, `.foot`, `.divider`, `input[type=file]`, `kbd` |
| `css/dict.css` | dictionary search, filter chips, table grid, `hat`/`ist`, `akk`/`dat` and `der`/`die`/`das` colours, `.masked` self-check blur |
| `css/cards.css` | flashcard, swipe tints, overlay/badge/example reveal states, `.prepline`, `.artline` |

Thirty-one `<script src>` tags at the end of `<body>`. **Load order is load-bearing** — each file declares globals the later ones use at parse time:

| File | Contents |
| --- | --- |
| `js/i18n.js` | the language registry: `LANGS`, `LANG_ORDER`, `registerLang()`, `lang`, `initLang()`, `t()`, `tc()`, `applyStaticI18n()`, `setLang()` |
| `js/labels_ru.js` | Russian strings — one `registerLang()` call, nothing else |
| `js/labels_en.js` | English strings |
| `js/labels_it.js` | Italian strings |
| `js/labels_tr.js` | Turkish strings |
| `js/translations.js` | the word-translation registry: `TRANSLATIONS`, `registerTranslations()`, `transEntry()`, `vTransOf()`, `tKeysOf()` |
| `data/verbs.js` | `const VERBS` — the data, nothing else |
| `data/prepverbs.js` | `const PREPVERBS` — the data, nothing else |
| `data/wortschatz.js` | `const WORTSCHATZ` — the data, nothing else |
| `data/translations_verbs_{ru,en,it,tr}.js` | one `registerTranslations("verbs", …)` call each |
| `data/translations_prep_{ru,en,it,tr}.js` | one `registerTranslations("prep", …)` call each |
| `data/translations_wort_{ru,en,it,tr}.js` | one `registerTranslations("wort", …)` call each |
| `js/course.js` | `COURSES`, `course`, `ITEMS()`, `isPrep()`, `isWort()`, `maskExample()`, `maskWord()`, `wortAnswerOf()`, `setCourse()` |
| `js/state.js` | `MAXID`/`BYID`, progress load/save, range, presets, folder counts |
| `js/check.js` | answer normalisation, `checkTrans()`, `checkPerf()`, `checkPrep()`, `checkWort()`, `checkSecond()`, `secondOf()`, `hasSecond()` |
| `js/choices.js` | multiple-choice distractors: `buildChoices()`, `prepDistractors()`, `perfDistractors()`, `wortDistractors()` |
| `js/nav.js` | `SCREENS`, `NAV_OF`, `show()` |
| `js/quiz.js` | test modes, quiz session, grading, results |
| `js/dict.js` | dictionary screen |
| `js/cards.js` | flashcard deck ("learn") incl. swipe handling |
| `js/io.js` | export/import |
| `js/main.js` | event wiring + init (must be last) |

A `const` at the top level of one file is visible to every file loaded after it. Cross-file *calls* are order-independent (they happen at runtime), but cross-file *top-level* code is not: `js/course.js` reads `VERBS`/`PREPVERBS`/`WORTSCHATZ` while it parses, the `data/translations_*.js` files call `registerTranslations()` while they parse (so `js/translations.js` precedes them), and `js/main.js` touches the DOM and every other file's functions, so it stays last. In `js/main.js` the init line calls `loadProgress()` **before** `applyStaticI18n()`, because loading builds the course index (`MAXID`) that the static strings interpolate.

Sections inside each file are still marked with `/* ---------- NAME ---------- */` comments.

### Courses

`js/course.js` owns the switch. `COURSES` maps a course id to its data array, its localStorage key, its preset chunk size, whether it has card images, and optionally a `groupBy` field to cut range presets along (the Lernwortschatz course groups by `kap`, the book chapter, so its presets read `K1`…`K14` instead of `1–40`); `course` is the active id (persisted under `deutsch_course`), `ITEMS()` returns the active array and `isPrep()`/`isWort()` are the branch predicates used by the shared screens. Everything downstream reads `ITEMS()` — never `VERBS` directly — so a screen works in all three courses automatically.

The trainer's second question field is the one place the courses genuinely differ: Perfekt in the verbs course, preposition + case in the prep course, **article + plural** in the Lernwortschatz course. `checkSecond()`/`secondOf()` in `js/check.js` dispatch on the course, so quiz, results, dictionary and cards all call those instead of touching `v.perf`.

In the Lernwortschatz course that second field only exists for nouns — a verb or a phrase has no `art`, so `secondOf()` returns `""` and `hasSecond()` is false. `askSecond()` in `js/quiz.js` folds that into `session.askP`, `curEval.askP` records what was actually asked (so `nextQuestion()` grades and the mistake table renders correctly), and `startQuiz()` filters those items out of the queue entirely when the translation is *not* being asked — otherwise the question would have nothing to answer. `choiceOn()` is derived from `askSecond()` for the same reason. `setCourse()` rebuilds the index, re-applies the i18n strings, restores that course's saved range and re-renders the visible screen; it drops any in-flight quiz/deck (the toggle is hidden on those screens anyway).

`maskWord(v)` is the Lernwortschatz counterpart: it blanks the headword out of its own example (`Die Klimaanlage im Serverraum …` → `Die ___ im Serverraum …`), matching a prefix of the word's stem so inflected forms are caught too. It is a **best-effort** helper — separable verbs and multi-word phrases often don't match, and then the example simply shows unmasked, which is fine (~128 of the 1135 entries land there). The masked sentence is the quiz prompt's context line and the front of the flashcard; unlike the prep course, nothing depends on the mask succeeding.

`maskExample(v)` blanks the preposition out of a prep verb's example sentence (`hängt vom Wetter ab` → `hängt ___ Wetter ab`), covering contracted and `da(r)-` forms via `PREP_FORMS`. That masked sentence is the quiz prompt's context line and the front of the flashcard — it is also what disambiguates the ~17 verbs that appear twice with different prepositions (`bestehen aus` / `bestehen auf`), so **every prep entry's example must contain its preposition**.

### Answer modes (input / multiple choice)

The «Как отвечать» radio pair on the trainer screen (`input[name="ansmode"]`, read once per test by `selectedAnsMode()` and stored on `session.ansMode`) decides how the **second** field is answered. The translation field is always typed — `choiceOn()` is `session.ansMode === "choice" && session.askP`, and when it is false the screen behaves exactly as before. Nothing about the mode is persisted, like the other test checkboxes.

In choice mode `renderQuestion()` hides `#inPerf` and the Kasus chips and fills `#choiceList` with four `.choice` buttons (numbered 1–4, also selectable with those keys — the handler in `js/main.js` ignores digits typed inside an `<input>`). `doCheck()` bails out with `alertPickOption` if nothing is selected — before grading the translation, so the question stays re-answerable — then compares the picked string with `session.choices.correct` and paints the buttons via `markChoices()`. `curEval.ansP` holds the picked option, so the mistake table needs no special case.

`js/choices.js` builds the four options; `buildChoices(v)` returns `{correct, options}` with `options` already shuffled.

- **Prep course**: the three wrong options are other `prep + kasus` pairs drawn from the 17 that occur in `PREPVERBS`, so the same preposition with the other case (`an + A` vs `an + D`) can show up as a distractor.
- **Lernwortschatz course**: the pool is every `article + plural` pair that occurs in `WORTSCHATZ`. The first distractor keeps the right article with a foreign ending, the second takes a foreign article with the right ending, so neither half alone gives the answer away; the rest are drawn at random, topped up from a synthetic `ARTICLES × PL_ENDINGS` grid so four distinct options always exist. Non-nouns never reach this code — they have no second question.
- **Verbs course**: the wrong options are *malformed Perfekt forms of the same verb*, never other verbs' forms — otherwise the answer would be readable off the stem. One distractor always keeps the right participle with the wrong auxiliary (`ist abgebrochen`), the rest mangle the participle: weak ending (`hat abgebrocht`), stem taken straight from the infinitive (`hat abgebrechen`), missing `ge-` (`hat abbrochen`). Auxiliaries are assigned so the correct one is not the odd one out. `gePrefix()` finds where `ge-` sits in the participle by matching the infinitive's separable prefix; verbs with no `ge-` in the participle (`verstanden`) fall back to infinitive-shaped forms (`hat versteht`, `hat verstehen`). Candidates are deduplicated through `normPerf()` and checked against **every** entry of `v.perf`, so a verb with two accepted forms can never see one of them offered as a wrong answer; `perfFallback()` tops up from other verbs if a verb yields fewer than three.

### Data model

`VERBS` in `data/verbs.js` is a JSON array of 270 objects, one per line:
`{id, inf, hint, aux, pras, prat, perf: [..], example}` — German only; no translation ever lives here.

- `id` (1–270) is stable and load-bearing: it keys progress in localStorage, keys the translation files, appears in export files, and forms image filenames. Never renumber. Two verb pairs share an infinitive (033/034 `ausziehen`, 205/206 `umfahren`) — `id` is the only disambiguator.
- `perf` is an array to allow multiple accepted Perfekt forms; `checkPerf()` normalizes umlauts (`ä`→`ae`, `ß`→`ss`) so ASCII input is accepted.

`PREPVERBS` in `data/prepverbs.js` is the same shape minus the conjugation fields:
`{id, inf, hint, prep, kasus, example}`.

- `inf` is the verb including a reflexive `sich` (`sich ärgern`); `prep` is the preposition and `kasus` is `"A"` or `"D"`. The pair is the answer, rendered everywhere as `prep + " + " + kasus` by `prepAnswerOf()`.
- `id` (1–111) follows the source PDF's alphabetical order and keys progress the same way verb ids do — never renumber. Duplicate infinitives are expected (`bestehen`, `sprechen`, …); the preposition is what differs.
- Examples are the PDF's, except id 74 (`schicken an`), whose original sentence contained no `an` and would have masked to nothing.

`WORTSCHATZ` in `data/wortschatz.js` is the Lernwortschatz of *Linie 1 Beruf B2*, 1135 objects in book order:
`{id, inf, hint, art, pl, kap, example}`.

- `inf` is the headword **without** its article — the article is what the second field tests, so `die Klimaanlage, -n` is stored as `inf:"Klimaanlage", art:"die", pl:"-n"`. Phrases and verbs keep their full wording (`sich ein Problem ansehen`) and have `art:""`, `pl:""`.
- `art` is `der`/`die`/`das` or `""`; `pl` is the book's plural marker verbatim — `-n`, `-en`, `¨e`, `¨`, `–` (unchanged), `(Sg.)`, `(Pl.)`, or an irregular full form (`Praxen`, `Antibiotika`, `Risiken`, `Stipendien`). `wortAnswerOf()` renders the pair as `die, -n` / `die (Sg.)`.
- `hint` carries the book's parenthetical glosses and the feminine counterpart of a person noun (`die Lieferantin, -nen`), so a masculine/feminine pair stays one entry with one article.
- `kap` (1–14) is the book chapter and drives the range presets. Ids run 1–1135 in chapter order, so `kap` never decreases — `presetRanges()` relies on that.
- `checkWort()` grades article and plural marker together. The umlaut can be typed as `¨`, `"`, `^` or `+`, the leading hyphen is optional, and `–` (no plural change) and an empty marker compare equal — see `normPl()`. The article may instead be picked from the `#artPick` chips, exactly like the Kasus chips in the prep course.
- Where the book repeats a word in a later chapter (`die Lieferung` in 2.3 and 2.6, `das Mobbing` in 5, 10 and 12), only the **first** occurrence is kept, so no test asks the same question twice. That is why the array is 1135 entries and not the ~1200 lines the book prints.
- Examples are written for this app at B2-Beruf level in the register of the book's own units, not copied from it.

#### Translation files

`data/translations_<course>_<lang>.js` is one `registerTranslations(courseId, code, map)` call, where `map` is `id → {trans, tKeys}`, one id per line — twelve files today (`verbs`/`prep`/`wort` × `ru`/`en`/`it`/`tr`). `js/translations.js` stores them in `TRANSLATIONS["<course>|<lang>"]`; `vTransOf(v)` and `tKeysOf(v)` resolve an entry against the active course and language, falling back to `DEFAULT_LANG` per id, so a half-finished language still renders. Nothing outside `js/translations.js` reads a translation field directly.

- `tKeys` are lowercase stems used by `checkTrans()` for fuzzy answer matching (exact match, `answer.includes(stem)` for stems ≥3 chars, or stem contains an answer word ≥4 chars). When adding or editing a translation, update its stems too, in every language file. For agglutinative Turkish this is what makes inflected answers work: `yazdım` is accepted because `yaz` is among the stems.
- `normRu()` in `js/check.js` folds diacritics on **both** sides before comparing, Turkish included (`ı`→`i`, `ş`→`s`, `ğ`→`g`, `ö`→`o`, `ü`→`u`, `ç`→`c`, plus the stray U+0307 that `toLowerCase()` leaves behind for `İ`), so `kirmak` is accepted for `kırmak` and stems can be written with proper Turkish spelling.
- Adding an entry to a data array means adding the same `id` to every `data/translations_<course>_*.js`.
- Prep translations came from the English column of `Verben_mit_Praepositionen_EN.pdf` — the source PDF, no longer tracked in the repo; the Russian and Italian ones were written for this app. All four Lernwortschatz languages were written for this app.

### I18N

One language = four files: `js/labels_<code>.js` for the UI strings (a single `registerLang(code, meta, strings)` call, `meta` being just `{name}` — the toggle-button caption) and `data/translations_verbs_<code>.js` / `data/translations_prep_<code>.js` / `data/translations_wort_<code>.js` for the word translations. `js/i18n.js` holds only the string machinery (`LANGS`, `LANG_ORDER`, `t()`, `tc()`, `setLang()`, …) and `js/translations.js` only the translation machinery — neither contains data.

`t(key)` looks up the current language and falls back to `DEFAULT_LANG` (`ru`) for a missing key, so a partially translated new language still renders. Static markup is translated via `data-i18n` / `data-i18n-placeholder` attributes resolved by `applyStaticI18n()`. Dynamic screens re-render on language switch inside `setLang()` — add new screens there if they show translated text.

**Adding a language** (say Polish): copy `js/labels_en.js` → `js/labels_pl.js` and translate the values; copy `data/translations_verbs_en.js`, `data/translations_prep_en.js` and `data/translations_wort_en.js` → `..._pl.js`, change the `"en"` argument to `"pl"` and translate the `trans`/`tKeys` values; add four `<script src>` tags — the labels file after `js/i18n.js`, the three data files after `data/wortschatz.js`. The German data files are not touched at all. Turkish (`tr`) was added exactly this way and is the worked example to copy from. Nothing else — the header buttons are built by `renderLangToggle()` from `LANG_ORDER` (registration order = button order), and `js/main.js` wires the toggle by delegation because those buttons do not exist until `initLang()` runs. `initLang()` runs first in the init line: it resolves the saved language before `loadProgress()` writes its first translated status line.

Adding a *string* still means adding it to every `labels_*.js` — the fallback keeps the app working, but it shows Russian.

Course-dependent wording goes through `tc(key)`, which prefers `key + "_" + course` outside the verbs course and falls back to `key` otherwise — so only the strings that actually differ need a per-course entry (`chkPerfLbl_prep`, `dheadPerfekt_wort`, …). The verbs course is the base and has no suffix. `verbWord` and `confirmReset` go through `tc()` too, because «глаголов» is wrong in the Lernwortschatz course. `applyStaticI18n()` resolves `data-i18n` through `tc()` and calls the value with `MAXID` if it is a function (that is how `filterAll`/`presetAll` show the right count per course), which is why switching course just re-runs it.

### State & persistence

Per-verb progress is the `status` object (`id → "new" | "repeated" | "notlearned" | "learned"`), shared by all three tabs. `statuses` holds one such map per course and `status` points at the active course's map — reassign it only through `rebuildIndex()`/`resetProgress()`, or the two go out of sync. Each course saves under its own key (`deutsch_verben_1_270_v1`, `deutsch_praep_1_111_v1`, `deutsch_wortschatz_b2_v1`), with its selected range under `<key>_range`; language lives under `deutsch_verben_1_270_lang` and the active course under `deutsch_course`. All localStorage access is wrapped in try/catch so the app works with storage disabled.

Export/import is `version: 5`: `courses.{verbs,prep,wort}.status` carries all three maps, and the top-level `summary`/`folders`/`status` fields still mirror the verbs course so older readers see what they expect. Import reads `courses` when present (any subset — a v4 file without `wort` simply leaves that course untouched) and otherwise treats the file as v3 verbs-course progress — keep that fallback.

### Screens & navigation

`SCREENS` (in `js/nav.js`) maps logical names (`home`, `dict`, `quiz`, `result`, `learnSetup`, `learnDeck`) to element ids; `show(name)` swaps visibility and syncs the nav tabs (`NAV_OF` maps screens to their owning tab). Keyboard handlers (Enter in quiz; ←/→/Space in cards) are guarded by checking which screen is visible.

## Verifying a change

Open `index.html` in a browser and exercise the affected tab by hand — **in all three courses** — that remains the only real check. Two failure modes the single-file version couldn't have:

- **Check the DevTools console and Network tab for 404s.** A mistyped `src`/`href`, or a new file never added to `index.html`, fails quietly: the page still renders, just without that rule or function. A missing `js/*.js` usually surfaces as a `ReferenceError` further down the chain rather than at the missing file itself.
- **Adding a file means adding its tag** to `index.html`, in the right position — see the load-order and cascade-order notes above.

For a fast regression sweep without a browser, jsdom loads the real `index.html` from disk with `runScripts: "dangerously", resources: "usable"` and executes all thirty-one scripts and eight stylesheets. It is good for asserting that screens render, handlers fire, grading works, and that the parsed CSS rule list is unchanged after a refactor. It does no layout and does not implement `window.scrollTo` (harmless errors), so it cannot confirm anything visual. Note that `const` globals live in the global lexical environment, not on `window` — reach them with `window.eval("VERBS")`, not `window.VERBS`. It also serves the page from a `file://` URL, whose opaque origin makes `localStorage` throw — the app's try/catch swallows that, but a test that touches storage directly must not. Nothing like this is checked in: install it in a scratch directory outside the repo and keep the repo dependency-free.

## verb-images/

Card illustrations, named `NNN-infinitiv.webp` (zero-padded id, spaces→hyphens). Only some of the 270 exist; missing files fall back to a neutral placeholder, so partial coverage is fine. Format rules (WebP, ~800×1200, 30–80 KB) and the full filename checklist are in `verb-images/README.md`. Images stay external to the HTML (lazy-loaded), never base64-inlined.
