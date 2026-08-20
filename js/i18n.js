"use strict";

/* ---------- РЕЕСТР ЯЗЫКОВ ---------- */
/* Строки каждого языка лежат в отдельном файле js/labels_<код>.js, который сам себя
   регистрирует через registerLang(). Чтобы добавить язык: скопировать любой labels_*.js,
   перевести строки, добавить <script src> в index.html — больше ничего править не нужно.
   Порядок тегов = порядок кнопок в переключателе языка. */
const LANG_KEY = "deutsch_verben_1_270_lang";
const DEFAULT_LANG = "ru";
const LANGS = {};        /* код → {code, name, strings} */
const LANG_ORDER = [];   /* коды в порядке регистрации */
let lang = DEFAULT_LANG;

/* meta: {name} — подпись кнопки в переключателе. Переводы слов регистрируются
   отдельно, файлами data/translations_<курс>_<код>.js — см. js/translations.js. */
function registerLang(code, meta, strings){
  if(!LANGS[code]) LANG_ORDER.push(code);
  LANGS[code] = Object.assign({code:code, strings:strings}, meta);
}

/* ---------- ВЫБОР ЯЗЫКА ---------- */
function initLang(){
  let saved = null;
  try{ saved = localStorage.getItem(LANG_KEY); }catch(e){}
  lang = LANGS[saved] ? saved : (LANGS[DEFAULT_LANG] ? DEFAULT_LANG : LANG_ORDER[0]);
  renderLangToggle();
}
/* Кнопки строятся из реестра, поэтому новый язык появляется в шапке сам. */
function renderLangToggle(){
  const box = document.getElementById("langToggle"); if(!box) return;
  box.innerHTML = "";
  LANG_ORDER.forEach(code=>{ const b=document.createElement("button");
    b.type="button"; b.dataset.lang=code; b.textContent=LANGS[code].name; box.appendChild(b); });
}

/* ---------- СТРОКИ ---------- */
/* Недостающий ключ берётся из языка по умолчанию — новый перевод можно вести постепенно. */
function rawStr(l, key){ const L = LANGS[l]; return L ? L.strings[key] : undefined; }
function t(key){ const v = rawStr(lang, key); return v!==undefined ? v : rawStr(DEFAULT_LANG, key); }
/* Строка с учётом курса: вне курса форм сначала ищется вариант «ключ_<курс>»
   («ключ_prep», «ключ_wort»); курс форм — базовый, у него суффикса нет. */
function tc(key){
  const alt = key+"_"+course;
  if(course!=="verbs"){
    const v = rawStr(lang, alt); if(v!==undefined) return v;
    /* в текущем языке нет ни варианта, ни базового ключа — берём вариант из языка по умолчанию */
    if(rawStr(lang, key)===undefined){ const f = rawStr(DEFAULT_LANG, alt); if(f!==undefined) return f; }
  }
  return t(key);
}
function tcText(key){ const v=tc(key); return typeof v==="function" ? v(MAXID) : v; }
function applyStaticI18n(){
  document.documentElement.lang = lang;
  document.title = tcText("pageTitle");
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = tcText(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{ el.placeholder = tcText(el.dataset.i18nPlaceholder); });
  document.querySelectorAll("#langToggle button").forEach(b=>b.classList.toggle("sel", b.dataset.lang===lang));
}
let lastSavedAt = null;
function setLang(l){
  if(lang===l || !LANGS[l]) return;
  lang = l; try{ localStorage.setItem(LANG_KEY, l); }catch(e){}
  applyStaticI18n();
  renderPresets(); onRangeChange();
  renderLearnPresets(); onLearnRangeChange();
  if(lastSavedAt) updateSavedInfo(lastSavedAt);
  const dictVisible = !document.getElementById("dictScreen").classList.contains("hide");
  const quizVisible = !document.getElementById("quizScreen").classList.contains("hide");
  const resultVisible = !document.getElementById("resultScreen").classList.contains("hide");
  const learnDeckVisible = !document.getElementById("learnDeckScreen").classList.contains("hide");
  if(dictVisible) renderDict();
  if(quizVisible && session) renderQuestion();
  if(resultVisible && session) showResults();
  if(learnDeckVisible && learnDeck) renderLearnCard();
}
