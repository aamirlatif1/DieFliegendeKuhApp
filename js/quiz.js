"use strict";

/* ---------- РЕЖИМЫ ТЕСТА ---------- */
function renderModes(){
  const c=counts();
  const cnts=[c.learned+c.notlearned+c.repeated+c["new"], c["new"]+c.notlearned+c.repeated, c.notlearned, c.repeated, c.learned];
  const modes=t("modes").map((m,i)=>({...m, cnt:cnts[i]}));
  const box=document.getElementById("modeList"); const prev=selectedMode(); box.innerHTML="";
  modes.forEach((m,i)=>{ const sel=(prev? m.k===prev : i===0); const row=document.createElement("div");
    row.className="mode-row"+(sel?" sel":""); row.dataset.mode=m.k;
    row.innerHTML=`<input type="radio" name="mode" ${sel?"checked":""} style="accent-color:var(--accent2)"><div><div class="t">${m.t}</div><div class="d">${m.d}</div></div><div class="cnt">${m.cnt}</div>`;
    row.addEventListener("click",()=>{ document.querySelectorAll(".mode-row").forEach(r=>r.classList.remove("sel")); row.classList.add("sel"); row.querySelector("input").checked=true; });
    box.appendChild(row); });
}
function selectedMode(){ const r=document.querySelector(".mode-row.sel"); return r?r.dataset.mode:null; }

/* ---------- ТЕСТ ---------- */
let session=null, curEval=null;
function buildQueue(mode){
  let pool=rangeVerbs();
  if(mode==="notlearned") pool=pool.filter(v=>status[v.id]==="notlearned");
  else if(mode==="repeated") pool=pool.filter(v=>status[v.id]==="repeated");
  else if(mode==="new") pool=pool.filter(v=>status[v.id]!=="learned");
  else if(mode==="learned") pool=pool.filter(v=>status[v.id]==="learned");
  pool=pool.slice();
  if(document.getElementById("chkShuffle").checked){ for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; } }
  return pool;
}
function startQuiz(mode){
  if(!rangeValid()){ alert(t("alertNoRange")); show("home"); return; }
  const askT=document.getElementById("chkTrans").checked, askP=document.getElementById("chkPerf").checked;
  if(!askT&&!askP){ alert(tc("alertChooseOne")); return; }
  const queue=buildQueue(mode);
  if(queue.length===0){ alert(t("alertEmptyPool")); return; }
  session={queue,idx:0,results:[],askT,askP}; show("quiz"); renderQuestion();
}
function renderQuestion(){
  const v=session.queue[session.idx], total=session.queue.length;
  document.getElementById("pfill").style.width=(session.idx/total*100)+"%";
  document.getElementById("qpos").textContent=t("qpos")(session.idx+1, total, v.id);
  document.getElementById("qscore").textContent=`✓ ${session.results.filter(r=>r.ok).length}`;
  document.getElementById("qverb").innerHTML=`${v.inf}`+(v.hint?` <span class="hint">(${v.hint})</span>`:"");
  const qex=document.getElementById("qexample");
  qex.textContent = isPrep()? maskExample(v) : "";
  qex.classList.toggle("hide", !isPrep());
  document.getElementById("fTrans").classList.toggle("hide",!session.askT);
  document.getElementById("fPerf").classList.toggle("hide",!session.askP);
  const it=document.getElementById("inTrans"), ip=document.getElementById("inPerf");
  it.value="";ip.value="";it.className="";ip.className="";it.disabled=false;ip.disabled=false;
  clearKasus();
  document.getElementById("corrTrans").classList.add("hide"); document.getElementById("corrPerf").classList.add("hide"); document.getElementById("ovTrans").classList.add("hide");
  document.getElementById("checkBtn").classList.remove("hide"); document.getElementById("nextBtn").classList.add("hide");
  setTimeout(()=>{(session.askT?it:ip).focus();},50);
}
function doCheck(){
  const v=session.queue[session.idx]; const it=document.getElementById("inTrans"), ip=document.getElementById("inPerf"); let okT=true, okP=true;
  const vTrans = vTransOf(v);
  if(session.askT){ okT=checkTrans(v,it.value); it.disabled=true; it.classList.add(okT?"good":"bad");
    const ct=document.getElementById("corrTrans"); ct.classList.remove("hide");
    ct.innerHTML=okT?`<span class="ok">${t("correctYes")}</span> ${t("valueLbl")} <span class="sol">${vTrans}</span>`:`<span class="bad">${t("correctNo")}</span> ${t("correctLbl")} <span class="sol">${vTrans}</span>`;
    document.getElementById("ovTrans").classList.remove("hide"); styleOverride(okT); }
  if(session.askP){ okP=checkSecond(v,ip.value,selectedKasus()); ip.disabled=true; ip.classList.add(okP?"good":"bad");
    const sol=secondOf(v);
    const cp=document.getElementById("corrPerf"); cp.classList.remove("hide");
    cp.innerHTML=okP?`<span class="ok">${t("correctYes")}</span> <span class="sol">${sol}</span>`:`<span class="bad">${t("correctNo")}</span> ${t("correctLbl")} <span class="sol">${sol}</span>`; }
  curEval={okT,okP,v,ansT:it.value,ansP:ip.value};
  document.getElementById("checkBtn").classList.add("hide"); document.getElementById("nextBtn").classList.remove("hide"); document.getElementById("nextBtn").focus();
}
function selectedKasus(){ const b=document.querySelector("#kasusPick button.sel"); return b?b.dataset.k:""; }
function clearKasus(){ document.querySelectorAll("#kasusPick button").forEach(b=>b.classList.remove("sel")); }
function styleOverride(okT){ const b=document.querySelectorAll('#ovTrans .chip'); b.forEach(x=>x.classList.remove("on-ok","on-bad")); if(okT)b[0].classList.add("on-ok"); else b[1].classList.add("on-bad"); }
function nextQuestion(){
  const e=curEval; const ok=(session.askT?e.okT:true)&&(session.askP?e.okP:true);
  session.results.push({id:e.v.id,v:e.v,okT:e.okT,okP:e.okP,ok,ansT:e.ansT,ansP:e.ansP,askT:session.askT,askP:session.askP});
  status[e.v.id]=ok?"learned":"notlearned"; saveProgress(); refreshFolders();
  session.idx++; if(session.idx>=session.queue.length) showResults(); else renderQuestion();
}
function showResults(){
  const res=session.results, total=res.length, correct=res.filter(r=>r.ok).length, pct=Math.round(correct/total*100);
  document.getElementById("pfill").style.width="100%"; document.getElementById("rScore").textContent=`${correct} / ${total}`;
  const verdict=pct===100?t("verdictPerfect"):pct>=80?t("verdictGreat"):pct>=50?t("verdictOk"):t("verdictBad");
  document.getElementById("rSub").textContent=`${pct}% · ${verdict}`;
  const c=counts(); document.getElementById("rLearned").textContent=c.learned; document.getElementById("rNot").textContent=c.notlearned; document.getElementById("rRepeated").textContent=c.repeated; document.getElementById("rNew").textContent=c["new"];
  const {from,to}=getRange(); document.getElementById("rFoldersSub").textContent=t("inDiap")(from,to);
  const wrong=res.filter(r=>!r.ok); const errBody=document.getElementById("errBody"), errIntro=document.getElementById("errIntro");
  if(wrong.length===0){ errIntro.textContent=t("noErrors"); errBody.innerHTML=""; }
  else{ errIntro.innerHTML=t("errIntro")(wrong.length,total); let rows="";
    wrong.forEach(r=>{ const v=r.v; const vTrans=vTransOf(v);
      let tCell = !r.askT?"—":(r.okT?`<span class="badge s">${t("badgeCorrect")}</span>`:`<div class="you">✗ ${escapeHtml(r.ansT)||"—"}</div><div class="sol">✓ ${vTrans}</div>`);
      let pCell = !r.askP?"—":(r.okP?`<span class="badge s">${t("badgeCorrect")}</span>`:`<div class="you">✗ ${escapeHtml(r.ansP)||"—"}</div><div class="sol">✓ ${secondOf(v)}</div>`);
      const sub = isPrep()? `№${v.id}` : `№${v.id} · ${v.aux}`;
      rows+=`<tr><td><b>${v.inf}</b>${v.hint?` <span class="muted">(${v.hint})</span>`:""}<div class="muted" style="font-size:11px">${sub}</div></td><td>${tCell}</td><td>${pCell}</td></tr>`; });
    errBody.innerHTML=`<table><thead><tr><th>${t("thVerb")}</th><th>${t("thTrans")}</th><th>${tc("thPerf")}</th></tr></thead><tbody>${rows}</tbody></table>`; }
  session._wrongIds=wrong.map(r=>r.id); show("result");
}
function escapeHtml(s){ return (s||"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])); }
function retryWrong(){ const ids=(session&&session._wrongIds)||[]; if(ids.length===0){ alert(t("alertNoWrong")); return; }
  const askT=document.getElementById("chkTrans").checked, askP=document.getElementById("chkPerf").checked; let queue=ids.map(id=>BYID[id]);
  if(document.getElementById("chkShuffle").checked){ for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];} }
  session={queue,idx:0,results:[],askT,askP}; show("quiz"); renderQuestion(); }
