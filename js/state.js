"use strict";

/* ---------- ДАННЫЕ ---------- */
let MAXID = 0;
let BYID = {};
function rebuildIndex(){ MAXID = ITEMS().length; BYID = {}; ITEMS().forEach(v=>BYID[v.id]=v); status = statuses[course]; }

/* ---------- ПРОГРЕСС ---------- */
const statuses = {};   /* курс → карта прогресса; каждый курс хранится отдельно */
let status = {};       /* прогресс активного курса */
function defaultStatus(items){ const s={}; (items||ITEMS()).forEach(v=>s[v.id]="new"); return s; }
function loadProgress(){
  COURSE_IDS.forEach(id=>{
    const c = COURSES[id];
    const s = defaultStatus(c.data);
    try{
      const raw = localStorage.getItem(c.store);
      if(raw){ const o=JSON.parse(raw); if(o&&o.status){ Object.keys(o.status).forEach(k=>{ if(s[k]!==undefined) s[k]=o.status[k]; }); } }
    }catch(e){}
    statuses[id] = s;
  });
  rebuildIndex();
  restoreRange();
  updateSavedInfo(new Date());
}
function resetProgress(){ statuses[course] = defaultStatus(); status = statuses[course]; saveProgress(); }
function saveCourseProgress(id){ localStorage.setItem(COURSES[id].store, JSON.stringify({status:statuses[id], savedAt:Date.now()})); }
function saveProgress(){
  try{ saveCourseProgress(course); updateSavedInfo(new Date()); }
  catch(e){ document.getElementById("savedInfo").textContent = t("saveUnavailable"); }
}
function saveRange(){ try{ localStorage.setItem(C().store+"_range", JSON.stringify(getRange())); }catch(e){} }
function updateSavedInfo(d){ lastSavedAt = d; const el=document.getElementById("savedInfo"); try{ el.textContent = t("savedInfo")(d); }catch(e){ el.textContent=""; } }

/* ---------- ДИАПАЗОН ---------- */
function getRange(){ return {from:parseInt(document.getElementById("rFrom").value,10), to:parseInt(document.getElementById("rTo").value,10)}; }
function rangeValid(){ const {from,to}=getRange(); return Number.isInteger(from)&&Number.isInteger(to)&&from>=1&&to<=MAXID&&from<=to; }
function inRange(v){ const {from,to}=getRange(); return v.id>=from && v.id<=to; }
function rangeVerbs(){ return ITEMS().filter(inRange); }
/* Диапазон запоминается для каждого курса отдельно; по умолчанию — первый пресет. */
function restoreRange(){
  let from=1, to=Math.min(C().chunk, MAXID);
  try{
    const raw = localStorage.getItem(C().store+"_range");
    if(raw){ const o=JSON.parse(raw); if(o&&o.from&&o.to&&o.from>=1&&o.to<=MAXID&&o.from<=o.to){ from=o.from; to=o.to; } }
  }catch(e){}
  document.getElementById("rFrom").value=from; document.getElementById("rTo").value=to;
}
function clampLearnRange(){
  const f=document.getElementById("rFromL"), tt=document.getElementById("rToL");
  const from=parseInt(f.value,10), to=parseInt(tt.value,10);
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to>MAXID||from>to){ f.value=1; tt.value=Math.min(C().chunk, MAXID); }
}
function presetRanges(){ const step=C().chunk, out=[]; for(let a=1;a<=MAXID;a+=step) out.push([a, Math.min(a+step-1, MAXID)]); return out; }
function renderPresets(){
  const box=document.getElementById("presets"); box.innerHTML="";
  presetRanges().forEach(([a,b])=>{ const btn=document.createElement("button"); btn.textContent=a+"–"+b; btn.dataset.a=a; btn.dataset.b=b;
    btn.addEventListener("click",()=>{ document.getElementById("rFrom").value=a; document.getElementById("rTo").value=b; onRangeChange(); }); box.appendChild(btn); });
  const all=document.createElement("button"); all.textContent=tc("presetAll")(MAXID); all.dataset.a=1; all.dataset.b=MAXID;
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
