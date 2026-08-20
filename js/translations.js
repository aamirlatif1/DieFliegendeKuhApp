"use strict";

/* ---------- РЕЕСТР ПЕРЕВОДОВ ---------- */
/* Переводы слов лежат отдельно от данных: один файл data/translations_<курс>_<код>.js
   на курс и язык, каждый сам себя регистрирует через registerTranslations().
   Чтобы добавить язык: скопировать пару файлов, перевести значения, добавить
   <script src> в index.html — сами data/verbs.js и data/prepverbs.js трогать не нужно. */
const TRANSLATIONS = {};   /* "курс|код" → { id → {trans, tKeys} } */

function registerTranslations(courseId, code, map){
  TRANSLATIONS[courseId+"|"+code] = map;
}
/* Недостающий перевод берётся из языка по умолчанию — как и строки интерфейса в t(). */
function transEntry(v){
  const m = TRANSLATIONS[course+"|"+lang];
  const e = m && m[v.id];
  if(e) return e;
  const f = TRANSLATIONS[course+"|"+DEFAULT_LANG];
  return (f && f[v.id]) || {trans:"", tKeys:[]};
}
function vTransOf(v){ return transEntry(v).trans; }
function tKeysOf(v){ return transEntry(v).tKeys; }
