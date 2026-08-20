"use strict";

/* ---------- ПРОВЕРКА ---------- */
function foldDe(s){ return s.replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss'); }
function normPerf(s){ return foldDe((s||"").toLowerCase()).replace(/[.,;!]/g," ").replace(/\s+/g," ").trim(); }
/* Диакритика сворачивается с обеих сторон (и у ответа, и у основы), поэтому турецкое
   «kırmak» принимается и в виде «kirmak»: ı→i, ş→s, ğ→g, ö→o, ü→u, ç→c.
   U+0307 — точка от «İ», которую toLowerCase() оставляет отдельным символом. */
function normRu(s){ return (s||"").toLowerCase().replace(/ё/g,"е").replace(/\u0307/g,"")
  .replace(/[àáâã]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîïı]/g,"i").replace(/[òóôõö]/g,"o").replace(/[ùúûü]/g,"u")
  .replace(/ç/g,"c").replace(/ş/g,"s").replace(/ğ/g,"g")
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
/* ---------- АРТИКЛЬ + МНОЖЕСТВЕННОЕ ЧИСЛО ---------- */
/* Умлаут в показателе множественного числа набирается как ¨, ", ^ или +:
   «der, ¨e» принимается и в виде «der "e», «der ^e», «der +e».
   Дефис перед окончанием необязателен, «–» (форма не меняется) = пустое окончание. */
function normPl(s){
  return (s||"").toLowerCase()
    .replace(/[¨"^+]/g,"~").replace(/[–—]/g,"-")
    .replace(/[\s,.()]/g,"").replace(/^-+/,"").replace(/^~-/,"~");
}
function parseWortAnswer(s){
  const txt = (s||"").toLowerCase().replace(/[,]/g," ").replace(/\s+/g," ").trim();
  if(!txt) return {art:"", pl:""};
  const words = txt.split(" "); let art="";
  const rest = words.filter(w=>{ if(!art && ARTICLES.includes(w)){ art=w; return false; } return true; });
  return {art:art, pl:rest.join(" ")};
}
function checkWort(v,ans,artPick){
  if(!v.art) return true;                       /* у слова нет артикля — спрашивать нечего */
  const p = parseWortAnswer(ans);
  const art = p.art || artPick || "";
  if(art !== v.art) return false;
  return normPl(p.pl) === normPl(v.pl);
}
/* Второе поле теста: Perfekt в курсе форм, предлог + падеж в курсе предлогов,
   артикль + множественное число в курсе словаря. */
function checkSecond(v,ans,pick){
  if(isWort()) return checkWort(v,ans,pick);
  return isPrep()? checkPrep(v,ans,pick) : checkPerf(v,ans);
}
function secondOf(v){
  if(isWort()) return wortAnswerOf(v);
  return isPrep()? prepAnswerOf(v) : v.perf.join(" / ");
}
/* Второй вопрос есть не у всех слов: у глаголов и оборотов артикля нет. */
function hasSecond(v){ return !!secondOf(v); }
