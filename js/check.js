"use strict";

/* ---------- ПРОВЕРКА ---------- */
function foldDe(s){ return s.replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss'); }
function normPerf(s){ return foldDe((s||"").toLowerCase()).replace(/[.,;!]/g," ").replace(/\s+/g," ").trim(); }
function normRu(s){ return (s||"").toLowerCase().replace(/ё/g,"е")
  .replace(/[àáâã]/g,"a").replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i").replace(/[òóôõ]/g,"o").replace(/[ùúûü]/g,"u").replace(/ç/g,"c")
  .replace(/[.,;!?()'’]/g," ").replace(/\s+/g," ").trim(); }
const TRANS_FIELD = {ru:"trans", en:"transEn", it:"transIt"};
const TKEYS_FIELD = {ru:"tKeys", en:"tKeysEn", it:"tKeysIt"};
function checkPerf(v,ans){ const a=normPerf(ans); if(!a)return false; for(const p of v.perf){ if(a===normPerf(p))return true; } return false; }
function checkTrans(v,ans){ const a=normRu(ans); if(!a)return false;
  const keys = v[TKEYS_FIELD[lang]];
  for(const k of keys){ const kk=normRu(k); if(kk===a) return true;
    if(kk.length>=3 && a.includes(kk)) return true;
    const words=a.split(" ").filter(w=>w.length>=4); for(const w of words){ if(kk.includes(w)) return true; } } return false; }
function vTransOf(v){ return v[TRANS_FIELD[lang]]; }
