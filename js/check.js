"use strict";

/* ---------- ПРОВЕРКА ---------- */
function foldDe(s){ return s.replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss'); }
function normPerf(s){ return foldDe((s||"").toLowerCase()).replace(/[.,;!]/g," ").replace(/\s+/g," ").trim(); }
function normRu(s){ return (s||"").toLowerCase().replace(/ё/g,"е")
  .replace(/[àáâã]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i").replace(/[òóôõ]/g,"o").replace(/[ùúûü]/g,"u").replace(/ç/g,"c")
  .replace(/[.,;!?()'’]/g," ").replace(/\s+/g," ").trim(); }
/* Перевод и его основы берутся из реестра переводов — см. js/translations.js. */
function checkPerf(v,ans){ const a=normPerf(ans); if(!a)return false; for(const p of v.perf){ if(a===normPerf(p))return true; } return false; }
function checkTrans(v,ans){ const a=normRu(ans); if(!a)return false;
  const keys = tKeysOf(v);
  for(const k of keys){ const kk=normRu(k); if(kk===a) return true;
    if(kk.length>=3 && a.includes(kk)) return true;
    const words=a.split(" ").filter(w=>w.length>=4); for(const w of words){ if(kk.includes(w)) return true; } } return false; }

/* ---------- ПРЕДЛОГ + ПАДЕЖ ---------- */
/* Падеж можно выбрать кнопкой или дописать словом: «über + A», «ueber akk», «über accusativo». */
const KASUS_WORDS = {
  a:"A", akk:"A", akku:"A", akkusativ:"A", acc:"A", accusative:"A", accusativo:"A", "вин":"A", "винительный":"A",
  d:"D", dat:"D", dativ:"D", dative:"D", dativo:"D", "дат":"D", "дательный":"D"
};
function parsePrepAnswer(s){
  const txt = foldDe((s||"").toLowerCase()).replace(/[+.,;!?()]/g," ").replace(/\s+/g," ").trim();
  if(!txt) return {prep:"", kasus:""};
  let kasus=""; const rest=[];
  txt.split(" ").forEach(w=>{ const k=KASUS_WORDS[w]; if(k) kasus=k; else rest.push(w); });
  return {prep:rest.join(" "), kasus};
}
function checkPrep(v,ans,kasusPick){
  const p = parsePrepAnswer(ans);
  if(!p.prep) return false;
  const kasus = p.kasus || kasusPick || "";
  return p.prep === foldDe(v.prep) && kasus === v.kasus;
}
/* Второе поле теста: Perfekt в курсе форм, предлог + падеж в курсе предлогов. */
function checkSecond(v,ans,kasusPick){ return isPrep()? checkPrep(v,ans,kasusPick) : checkPerf(v,ans); }
function secondOf(v){ return isPrep()? prepAnswerOf(v) : v.perf.join(" / "); }
