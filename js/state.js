"use strict";

/* ---------- ДАННЫЕ ---------- */
const MAXID = VERBS.length;
const BYID = {}; VERBS.forEach(v=>BYID[v.id]=v);

/* ---------- ПРОГРЕСС ---------- */
const STORE_KEY = "deutsch_verben_1_270_v1";
let status = {};
function defaultStatus(){ const s={}; VERBS.forEach(v=>s[v.id]="new"); return s; }
function loadProgress(){
  status = defaultStatus();
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){ const o=JSON.parse(raw); if(o&&o.status){ Object.keys(o.status).forEach(k=>{ if(status[k]!==undefined) status[k]=o.status[k]; }); } }
    const rr = localStorage.getItem(STORE_KEY+"_range");
    if(rr){ const o=JSON.parse(rr); if(o&&o.from){ document.getElementById("rFrom").value=o.from; document.getElementById("rTo").value=o.to; } }
  }catch(e){}
  updateSavedInfo(new Date());
}
function saveProgress(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify({status, savedAt:Date.now()})); updateSavedInfo(new Date()); }
  catch(e){ document.getElementById("savedInfo").textContent = t("saveUnavailable"); }
}
function saveRange(){ try{ localStorage.setItem(STORE_KEY+"_range", JSON.stringify(getRange())); }catch(e){} }
function updateSavedInfo(d){ lastSavedAt = d; const el=document.getElementById("savedInfo"); try{ el.textContent = t("savedInfo")(d); }catch(e){ el.textContent=""; } }

/* ---------- ДИАПАЗОН ---------- */
function getRange(){ return {from:parseInt(document.getElementById("rFrom").value,10), to:parseInt(document.getElementById("rTo").value,10)}; }
function rangeValid(){ const {from,to}=getRange(); return Number.isInteger(from)&&Number.isInteger(to)&&from>=1&&to<=MAXID&&from<=to; }
function inRange(v){ const {from,to}=getRange(); return v.id>=from && v.id<=to; }
function rangeVerbs(){ return VERBS.filter(inRange); }
const PRESETS=[[1,35],[36,70],[71,105],[106,140],[141,175],[176,210],[211,245],[246,270]];
function renderPresets(){
  const box=document.getElementById("presets"); box.innerHTML="";
  PRESETS.forEach(([a,b])=>{ const btn=document.createElement("button"); btn.textContent=a+"–"+b; btn.dataset.a=a; btn.dataset.b=b;
    btn.addEventListener("click",()=>{ document.getElementById("rFrom").value=a; document.getElementById("rTo").value=b; onRangeChange(); }); box.appendChild(btn); });
  const all=document.createElement("button"); all.textContent=t("presetAll"); all.dataset.a=1; all.dataset.b=MAXID;
  all.addEventListener("click",()=>{ document.getElementById("rFrom").value=1; document.getElementById("rTo").value=MAXID; onRangeChange(); }); box.appendChild(all);
}
function markActivePreset(){ const {from,to}=getRange(); document.querySelectorAll("#presets button").forEach(b=>b.classList.toggle("sel", parseInt(b.dataset.a)===from && parseInt(b.dataset.b)===to)); }
function onRangeChange(){
  const warn=document.getElementById("rWarn"), startBtn=document.getElementById("startBtn");
  if(!rangeValid()){ warn.classList.remove("hide"); warn.textContent=t("rangeWarn")(MAXID); startBtn.disabled=true; document.getElementById("rangeCount").textContent=""; }
  else{ warn.classList.add("hide"); startBtn.disabled=false; saveRange(); const n=rangeVerbs().length; document.getElementById("rangeCount").textContent="· "+n+" "+t("verbWord")(n); }
  markActivePreset(); refreshFolders(); renderModes();
  if(dictFilter==="range") renderDict();
}

/* ---------- СЧЁТЧИКИ ---------- */
const STATUS_EMOJI={"new":"📘",notlearned:"📕",repeated:"🟡",learned:"📗"};
function counts(){ let l=0,n=0,nw=0,r=0; rangeVerbs().forEach(v=>{ const s=status[v.id]; if(s==="learned")l++; else if(s==="notlearned")n++; else if(s==="repeated")r++; else nw++; }); return {learned:l,notlearned:n,repeated:r,"new":nw}; }
function refreshFolders(){ const c=counts(); document.getElementById("cLearned").textContent=c.learned; document.getElementById("cNot").textContent=c.notlearned; document.getElementById("cRepeated").textContent=c.repeated; document.getElementById("cNew").textContent=c["new"];
  const {from,to}=getRange(); document.getElementById("foldersSub").textContent = rangeValid()? t("inDiap")(from,to) : ""; }
