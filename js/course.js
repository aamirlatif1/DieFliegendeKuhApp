"use strict";

/* ---------- КУРСЫ (наборы данных) ---------- */
const COURSE_KEY = "deutsch_course";
/* groupBy: поле, по которому строятся пресеты диапазонов (у словаря — глава книги);
   если его нет, диапазоны нарезаются кусками по chunk. */
const COURSES = {
  verbs:{ id:"verbs", data:VERBS,      store:"deutsch_verben_1_270_v1", chunk:35, images:true  },
  prep: { id:"prep",  data:PREPVERBS,  store:"deutsch_praep_1_111_v1",  chunk:25, images:false },
  wort: { id:"wort",  data:WORTSCHATZ, store:"deutsch_wortschatz_b2_v1", chunk:40, images:false,
          groupBy:"kap", groupLabel:(k)=>"K"+k }
};
const COURSE_IDS = ["verbs","prep","wort"];
let course = "verbs";
try{ const c = localStorage.getItem(COURSE_KEY); if(COURSE_IDS.includes(c)) course = c; }catch(e){}
function C(){ return COURSES[course]; }
function ITEMS(){ return C().data; }
function isPrep(){ return course === "prep"; }
function isWort(){ return course === "wort"; }

/* ---------- ПРЕДЛОГИ ---------- */
/* Слитные формы и da(r)-формы: нужны, чтобы спрятать предлог в примере. */
const PREP_FORMS = {
  an:["am","ans","daran"], auf:["aufs","darauf","drauf"], aus:["daraus"], bei:["beim","dabei"],
  "für":["fürs","dafür"], gegen:["dagegen"], in:["im","ins","darin","drin"], mit:["damit"],
  nach:["danach"], "über":["übers","überm","darüber"], um:["ums","darum"], unter:["unterm","unters","darunter"],
  von:["vom","davon"], vor:["vorm","vors","davor"], zu:["zum","zur","dazu"]
};
const DE_LETTER = "a-zA-ZäöüßÄÖÜ";
function prepAnswerOf(v){ return v.prep + " + " + v.kasus; }
function prepFormsOf(v){ return [v.prep].concat(PREP_FORMS[v.prep]||[]).sort((a,b)=>b.length-a.length); }
/* Пример с пропуском вместо предлога — подсказка-контекст в тесте и на карточке. */
function maskExample(v){
  if(!v.example) return "";
  const re = new RegExp("(^|[^"+DE_LETTER+"])("+prepFormsOf(v).join("|")+")(?![" +DE_LETTER+ "])", "gi");
  return v.example.replace(re, (m,pre)=>pre+"___");
}

/* ---------- АРТИКЛЬ + МНОЖЕСТВЕННОЕ ЧИСЛО ---------- */
/* Ответ второго поля в курсе словаря: «die, -n», «der, ¨e», «die (Sg.)».
   У не-существительных (глаголы, прилагательные, обороты) art пустой — второго вопроса нет. */
const ARTICLES = ["der","die","das"];
function wortAnswerOf(v){
  if(!v.art) return "";
  if(!v.pl) return v.art;
  return /^\(/.test(v.pl) ? v.art+" "+v.pl : v.art+", "+v.pl;
}
/* Прячем само слово в примере — карточка превращается в предложение с пропуском.
   Слово в примере склоняется, поэтому ищем по префиксу основы; если совпадения нет,
   пример остаётся как есть (для разделяемых глаголов и оборотов это норма). */
function wordStem(v){
  const core = (v.inf||"").replace(/\(.*?\)/g,"").trim().split(/\s+/).filter(w=>w!=="sich"&&w!=="etwas"&&w!=="jemanden").pop() || "";
  const n = Math.max(4, Math.ceil(core.length*0.6));
  return core.length>=4 ? core.slice(0,n) : "";
}
function maskWord(v){
  if(!v.example) return "";
  const stem = wordStem(v);
  if(!stem) return v.example;
  const re = new RegExp("(^|[^"+DE_LETTER+"])("+stem.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"["+DE_LETTER+"]*)","gi");
  return v.example.replace(re, (m,pre)=>pre+"___");
}

/* ---------- ПЕРЕКЛЮЧЕНИЕ КУРСА ---------- */
function applyCourseUI(){
  document.querySelectorAll("#courseToggle button").forEach(b=>b.classList.toggle("sel", b.dataset.course===course));
  ["rFrom","rTo","rFromL","rToL"].forEach(id=>document.getElementById(id).setAttribute("max", MAXID));
  document.getElementById("kasusPick").classList.toggle("hide", !isPrep());
  document.getElementById("artPick").classList.toggle("hide", !isWort());
}
function setCourse(id){
  if(!COURSES[id] || course===id) return;
  saveRange();
  course = id;
  try{ localStorage.setItem(COURSE_KEY, course); }catch(e){}
  rebuildIndex();
  session = null; learnDeck = null;
  applyStaticI18n(); applyCourseUI();
  restoreRange(); clampLearnRange();
  renderPresets(); onRangeChange();
  renderLearnPresets(); onLearnRangeChange();
  const dictOpen = !document.getElementById("dictScreen").classList.contains("hide");
  const learnOpen = !document.getElementById("learnSetupScreen").classList.contains("hide")
                 || !document.getElementById("learnDeckScreen").classList.contains("hide");
  if(dictOpen){ renderDict(); show("dict"); }
  else if(learnOpen) show("learnSetup");
  else show("home");
}
