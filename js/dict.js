"use strict";

/* ---------- СЛОВАРЬ ---------- */
let dictFilter="all";
function renderDict(){
  const q=normRu(document.getElementById("dictSearch").value);
  let list=VERBS.slice();
  if(dictFilter==="range"){ if(rangeValid()) list=list.filter(inRange); }
  else if(dictFilter!=="all") list=list.filter(v=>status[v.id]===dictFilter);
  if(q) list=list.filter(v=> String(v.id)===q || normRu(v.inf).includes(q) || normRu(vTransOf(v)).includes(q) || normPerf(v.perf.join(" ")).includes(foldDe(q)));
  const hideT=document.getElementById("hideTrans").checked, hideP=document.getElementById("hidePerf").checked;
  const {from,to}=getRange();
  document.getElementById("dictSub").textContent = dictFilter==="range"&&rangeValid()? t("inDiap")(from,to) : t("dictAllForms");
  document.getElementById("dictCount").textContent = list.length+" "+t("verbWord")(list.length);
  const body=document.getElementById("dictBody"), empty=document.getElementById("dictEmpty");
  if(list.length===0){ body.innerHTML=""; empty.textContent=t("dictEmpty"); return; } else empty.textContent="";
  let html="";
  list.forEach(v=>{
    const st=status[v.id];
    const perfCls = v.perf[0].startsWith("ist")?"ist":"hat";
    const perfTxt = v.perf.join(" / ");
    const vTrans = vTransOf(v);
    html+=`<div class="drow" data-id="${v.id}">
      <div><div class="dinf"><span class="sdot ${st}"></span><span class="num">${v.id}.</span>${v.inf}${v.hint?` <span class="hint">(${v.hint})</span>`:""}</div>
        <div class="dforms">${v.pras} · ${v.prat}</div></div>
      <div class="dperf ${perfCls} ${hideP?'masked':''}">${perfTxt}</div>
      <div class="dtrans ${hideT?'masked':''}">${vTrans}</div>
      <div class="dactions">
        <button data-set="learned" data-id="${v.id}" title="${t("actLearned")}" class="${st==='learned'?'act':''}">📗</button>
        <button data-set="notlearned" data-id="${v.id}" title="${t("actNotLearned")}" class="${st==='notlearned'?'act':''}">📕</button>
        <button data-set="repeated" data-id="${v.id}" title="${t("actRepeated")}" class="${st==='repeated'?'act':''}">🟡</button>
        <button data-set="new" data-id="${v.id}" title="${t("actNew")}" class="${st==='new'?'act':''}">📘</button>
      </div></div>`;
  });
  body.innerHTML=html;
  body.querySelectorAll("button[data-set]").forEach(b=>b.addEventListener("click",()=>{ status[b.dataset.id]=b.dataset.set; saveProgress(); refreshFolders(); renderDict(); if(dictFilter!=="all"&&dictFilter!=="range"){} }));
  body.querySelectorAll(".masked").forEach(el=>el.addEventListener("click",()=>el.classList.toggle("revealed")));
}
