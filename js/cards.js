"use strict";

/* ---------- УЧИТЬ (карточки) ---------- */
function verbImgPath(v){ return "verb-images/"+String(v.id).padStart(3,"0")+"-"+v.inf.replace(/\s+/g,"-")+".webp"; }
function learnRange(){ return {from:parseInt(document.getElementById("rFromL").value,10), to:parseInt(document.getElementById("rToL").value,10)}; }
function learnRangeValid(){ const {from,to}=learnRange(); return Number.isInteger(from)&&Number.isInteger(to)&&from>=1&&to<=MAXID&&from<=to; }
function learnInRange(v){ const {from,to}=learnRange(); return v.id>=from && v.id<=to; }
function learnStatusesChecked(){
  return { "new":document.getElementById("chkFNew").checked, notlearned:document.getElementById("chkFNotLearned").checked,
    repeated:document.getElementById("chkFRepeated").checked, learned:document.getElementById("chkFLearned").checked };
}
function buildLearnQueue(){ const st=learnStatusesChecked(); return VERBS.filter(learnInRange).filter(v=>st[status[v.id]]); }
function renderLearnPresets(){
  const box=document.getElementById("presetsL"); box.innerHTML="";
  PRESETS.forEach(([a,b])=>{ const btn=document.createElement("button"); btn.textContent=a+"–"+b; btn.dataset.a=a; btn.dataset.b=b;
    btn.addEventListener("click",()=>{ document.getElementById("rFromL").value=a; document.getElementById("rToL").value=b; onLearnRangeChange(); }); box.appendChild(btn); });
  const all=document.createElement("button"); all.textContent=t("presetAll"); all.dataset.a=1; all.dataset.b=MAXID;
  all.addEventListener("click",()=>{ document.getElementById("rFromL").value=1; document.getElementById("rToL").value=MAXID; onLearnRangeChange(); }); box.appendChild(all);
}
function markActivePresetL(){ const {from,to}=learnRange(); document.querySelectorAll("#presetsL button").forEach(b=>b.classList.toggle("sel", parseInt(b.dataset.a)===from && parseInt(b.dataset.b)===to)); }
function onLearnRangeChange(){
  const warn=document.getElementById("rWarnL"), startBtn=document.getElementById("learnStartBtn");
  if(!learnRangeValid()){ warn.classList.remove("hide"); warn.textContent=t("rangeWarn")(MAXID); startBtn.disabled=true; document.getElementById("rangeCountL").textContent=""; }
  else{ warn.classList.add("hide"); startBtn.disabled=false; const n=VERBS.filter(learnInRange).length; document.getElementById("rangeCountL").textContent="· "+n+" "+t("verbWord")(n); }
  markActivePresetL();
}
let learnDeck=null, cardState=0, learnDrag=null;
function startLearnDeck(){
  if(!learnRangeValid()){ alert(t("alertNoRange")); return; }
  const st=learnStatusesChecked();
  if(!st["new"]&&!st.notlearned&&!st.repeated&&!st.learned){ alert(t("alertChooseStatus")); return; }
  const queue=buildLearnQueue();
  if(queue.length===0){ alert(t("alertEmptyPool")); return; }
  learnDeck={queue,idx:0}; cardState=0; show("learnDeck"); renderLearnCard();
}
function renderLearnCard(){
  const v=learnDeck.queue[learnDeck.idx];
  const img=document.getElementById("learnCardImg"), fallback=document.getElementById("learnCardFallback");
  fallback.classList.add("hide"); img.classList.remove("hide");
  img.onerror=()=>{ img.classList.add("hide"); fallback.classList.remove("hide"); };
  img.src=verbImgPath(v);
  document.getElementById("learnCardBadge").textContent=STATUS_EMOJI[status[v.id]]||"📘";
  document.getElementById("learnCardInf").innerHTML=v.inf+(v.hint?` <span class="hint">(${v.hint})</span>`:"");
  const perfCls=v.perf[0].startsWith("ist")?"ist":"hat";
  document.getElementById("learnCardForms").innerHTML=`<div>${v.pras} · ${v.prat}</div><div class="perfline ${perfCls}">${v.perf.join(" / ")}</div>`;
  document.getElementById("learnCardTrans").textContent=vTransOf(v);
  document.getElementById("learnCardExample").textContent=v.example||"";
  cardState=0; applyLearnCardState();
  const nextV=learnDeck.queue[(learnDeck.idx+1)%learnDeck.queue.length];
  if(nextV){ const pre=new Image(); pre.src=verbImgPath(nextV); }
}
function applyLearnCardState(){
  const img=document.getElementById("learnCardImg"), overlay=document.getElementById("learnCardOverlay"),
    badge=document.getElementById("learnCardBadge"), content=document.getElementById("learnCardContent"),
    trans=document.getElementById("learnCardTrans"), forms=document.getElementById("learnCardForms"),
    example=document.getElementById("learnCardExample");
  img.classList.toggle("clear", cardState===2);
  overlay.classList.toggle("clearstate", cardState===2);
  badge.classList.toggle("hide2", cardState===2);
  content.classList.toggle("hide2", cardState===2);
  forms.classList.toggle("hide", cardState===1);
  trans.classList.toggle("hide", cardState!==1);
  example.classList.toggle("show2", cardState===2);
}
function learnTap(){ cardState=(cardState+1)%3; applyLearnCardState(); }
function learnAnimateOut(dir,cb){
  const wrap=document.getElementById("learnCardWrap");
  wrap.style.transition="transform .25s ease, opacity .25s ease";
  wrap.style.transform=`translateX(${dir==="right"?520:-520}px) rotate(${dir==="right"?18:-18}deg)`;
  wrap.style.opacity="0";
  setTimeout(()=>{
    wrap.style.transition="none"; wrap.style.transform="translateX(0) rotate(0)"; wrap.style.opacity="1";
    document.getElementById("learnTintR").style.opacity=0; document.getElementById("learnTintL").style.opacity=0;
    cb();
  },260);
}
function learnSwipe(dir){
  if(!learnDeck) return;
  const v=learnDeck.queue[learnDeck.idx];
  if(status[v.id]==="new"){ status[v.id]=dir==="right"?"repeated":"notlearned"; saveProgress(); refreshFolders(); renderModes(); }
  learnAnimateOut(dir, ()=>{ learnDeck.idx=(learnDeck.idx+1)%learnDeck.queue.length; renderLearnCard(); });
}
function learnPointerDown(e){
  if(!learnDeck) return;
  const wrap=document.getElementById("learnCardWrap");
  learnDrag={x0:e.clientX,y0:e.clientY,dx:0,moved:false};
  wrap.setPointerCapture(e.pointerId); wrap.classList.add("dragging");
}
function learnPointerMove(e){
  if(!learnDrag) return;
  const dx=e.clientX-learnDrag.x0, dy=e.clientY-learnDrag.y0;
  if(Math.abs(dx)>6||Math.abs(dy)>6) learnDrag.moved=true;
  learnDrag.dx=dx;
  const wrap=document.getElementById("learnCardWrap");
  wrap.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;
  const p=Math.min(Math.abs(dx)/120,1);
  document.getElementById("learnTintR").style.opacity=dx>0?p:0;
  document.getElementById("learnTintL").style.opacity=dx<0?p:0;
}
function learnPointerUp(){
  if(!learnDrag) return;
  const wrap=document.getElementById("learnCardWrap");
  wrap.classList.remove("dragging");
  const dx=learnDrag.dx, moved=learnDrag.moved; learnDrag=null;
  if(Math.abs(dx)>90){ learnSwipe(dx>0?"right":"left"); }
  else{
    wrap.style.transition="transform .2s ease"; wrap.style.transform="translateX(0) rotate(0)";
    document.getElementById("learnTintR").style.opacity=0; document.getElementById("learnTintL").style.opacity=0;
    setTimeout(()=>{ wrap.style.transition=""; },200);
    if(!moved) learnTap();
  }
}
