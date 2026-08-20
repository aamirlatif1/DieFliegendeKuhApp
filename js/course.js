"use strict";

/* ---------- КУРСЫ (наборы данных) ---------- */
const COURSE_KEY = "deutsch_course";
const COURSES = {
  verbs:{ id:"verbs", data:VERBS,     store:"deutsch_verben_1_270_v1", chunk:35, images:true  },
  prep: { id:"prep",  data:PREPVERBS, store:"deutsch_praep_1_111_v1",  chunk:25, images:false }
};
const COURSE_IDS = ["verbs","prep"];
let course = "verbs";
try{ const c = localStorage.getItem(COURSE_KEY); if(COURSE_IDS.includes(c)) course = c; }catch(e){}
function C(){ return COURSES[course]; }
function ITEMS(){ return C().data; }
function isPrep(){ return course === "prep"; }

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

/* ---------- ПЕРЕКЛЮЧЕНИЕ КУРСА ---------- */
function applyCourseUI(){
  document.querySelectorAll("#courseToggle button").forEach(b=>b.classList.toggle("sel", b.dataset.course===course));
  ["rFrom","rTo","rFromL","rToL"].forEach(id=>document.getElementById(id).setAttribute("max", MAXID));
  document.getElementById("kasusPick").classList.toggle("hide", !isPrep());
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
