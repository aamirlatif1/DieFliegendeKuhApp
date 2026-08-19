"use strict";

/* ---------- НАВИГАЦИЯ / ЭКРАНЫ ---------- */
const SCREENS={home:"startScreen",dict:"dictScreen",quiz:"quizScreen",result:"resultScreen",learnSetup:"learnSetupScreen",learnDeck:"learnDeckScreen"};
const NAV_OF={home:"home",dict:"dict",learnSetup:"learn",learnDeck:"learn"};
function show(name){ Object.values(SCREENS).forEach(id=>document.getElementById(id).classList.add("hide")); document.getElementById(SCREENS[name]).classList.remove("hide");
  const navVisible = (name==="home"||name==="dict"||name==="learnSetup"); document.getElementById("nav").classList.toggle("hide", !navVisible);
  document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("sel", b.dataset.tab===(NAV_OF[name]||name)));
  window.scrollTo(0,0);
}
