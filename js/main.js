"use strict";

/* ---------- СОБЫТИЯ ---------- */
document.querySelectorAll("#nav button").forEach(b=>b.addEventListener("click",()=>{ const tb=b.dataset.tab;
  if(tb==="dict"){ renderDict(); show("dict"); } else if(tb==="learn"){ show("learnSetup"); } else show(tb); }));
document.getElementById("dictShortcut").addEventListener("click",()=>{ renderDict(); show("dict"); });
document.getElementById("rFrom").addEventListener("input",onRangeChange);
document.getElementById("rTo").addEventListener("input",onRangeChange);
document.getElementById("startBtn").addEventListener("click",()=>startQuiz(selectedMode()||"all"));
document.getElementById("checkBtn").addEventListener("click",doCheck);
document.getElementById("nextBtn").addEventListener("click",nextQuestion);
document.getElementById("quitBtn").addEventListener("click",()=>{ if(session&&session.results.length) showResults(); else show("home"); });
document.getElementById("retryWrong").addEventListener("click",retryWrong);
document.getElementById("againBtn").addEventListener("click",()=>{ refreshFolders(); renderModes(); show("home"); });
document.getElementById("exportBtn").addEventListener("click",exportProgress);
document.getElementById("exportBtn2").addEventListener("click",exportProgress);
document.getElementById("importBtn").addEventListener("click",()=>document.getElementById("fileInput").click());
document.getElementById("fileInput").addEventListener("change",e=>{ if(e.target.files[0]) importProgress(e.target.files[0]); e.target.value=""; });
document.getElementById("resetBtn").addEventListener("click",()=>{ if(confirm(t("confirmReset")(MAXID))){ resetProgress(); refreshFolders(); renderModes(); renderDict(); } });
document.getElementById("dictSearch").addEventListener("input",renderDict);
document.getElementById("hideTrans").addEventListener("change",renderDict);
document.getElementById("hidePerf").addEventListener("change",renderDict);
document.querySelectorAll('#dictFilters button').forEach(b=>b.addEventListener("click",()=>{ document.querySelectorAll('#dictFilters button').forEach(x=>x.classList.remove("sel")); b.classList.add("sel"); dictFilter=b.dataset.f; renderDict(); }));
document.addEventListener("keydown",e=>{ if(document.getElementById("quizScreen").classList.contains("hide"))return; if(e.key==="Enter"){ e.preventDefault(); if(!document.getElementById("nextBtn").classList.contains("hide")) nextQuestion(); else doCheck(); } });
document.querySelectorAll('#ovTrans .chip').forEach(b=>b.addEventListener("click",()=>{ if(!curEval)return; const val=b.dataset.val==="1"; curEval.okT=val; styleOverride(val);
  const it=document.getElementById("inTrans"); it.classList.remove("good","bad"); it.classList.add(val?"good":"bad");
  const vTrans = vTransOf(curEval.v);
  document.getElementById("corrTrans").innerHTML=val?`<span class="ok">${t("acceptedYes")}</span> ${t("valueLbl")} <span class="sol">${vTrans}</span>`:`<span class="bad">${t("correctNo")}</span> ${t("correctLbl")} <span class="sol">${vTrans}</span>`; }));
document.querySelectorAll('#langToggle button').forEach(b=>b.addEventListener("click",()=>{ setLang(b.dataset.lang); }));
document.querySelectorAll('#courseToggle button').forEach(b=>b.addEventListener("click",()=>{ setCourse(b.dataset.course); }));
document.querySelectorAll('#kasusPick button').forEach(b=>b.addEventListener("click",()=>{
  const on=b.classList.contains("sel"); clearKasus(); if(!on) b.classList.add("sel"); }));
document.getElementById("rFromL").addEventListener("input",onLearnRangeChange);
document.getElementById("rToL").addEventListener("input",onLearnRangeChange);
document.getElementById("learnStartBtn").addEventListener("click",startLearnDeck);
document.getElementById("learnFinishBtn").addEventListener("click",()=>show("learnSetup"));
(function(){ const wrap=document.getElementById("learnCardWrap");
  wrap.addEventListener("pointerdown",learnPointerDown);
  wrap.addEventListener("pointermove",learnPointerMove);
  wrap.addEventListener("pointerup",learnPointerUp);
  wrap.addEventListener("pointercancel",learnPointerUp);
})();
document.addEventListener("keydown",e=>{ if(document.getElementById("learnDeckScreen").classList.contains("hide")||!learnDeck) return;
  if(e.key==="ArrowRight"){ e.preventDefault(); learnSwipe("right"); }
  else if(e.key==="ArrowLeft"){ e.preventDefault(); learnSwipe("left"); }
  else if(e.key===" "||e.key==="Enter"){ e.preventDefault(); learnTap(); } });

/* ---------- INIT ---------- */
/* loadProgress() первым: он строит индекс курса, из которого applyStaticI18n() берёт число глаголов. */
loadProgress(); applyStaticI18n(); applyCourseUI(); clampLearnRange();
renderPresets(); onRangeChange(); renderLearnPresets(); onLearnRangeChange(); show("home");
