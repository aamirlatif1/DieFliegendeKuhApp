"use strict";

/* ---------- ВАРИАНТЫ ОТВЕТА ---------- */
/* Режим «выбор из вариантов»: к правильному ответу подбираются три ложных.
   В курсе предлогов это чужие пары «предлог + падеж», в курсе форм — неверные
   формы Perfekt того же глагола (не чужие, чтобы вариант нельзя было угадать по корню). */
const CHOICE_COUNT = 4;

function shuffled(a){ const r=a.slice(); for(let i=r.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; } return r; }

/* ---------- ПРЕДЛОГИ ---------- */
/* Пул — все пары «предлог + падеж», встречающиеся в курсе (их 17), кроме правильной.
   Тот же предлог с другим падежом («an + A» против «an + D») тоже попадает в пул. */
function prepDistractors(v, n){
  const right = prepAnswerOf(v), seen = {}, pool = [];
  ITEMS().forEach(x=>{ const a = prepAnswerOf(x); if(a===right || seen[a]) return; seen[a]=1; pool.push(a); });
  return shuffled(pool).slice(0, n);
}

/* ---------- АРТИКЛЬ + МНОЖЕСТВЕННОЕ ЧИСЛО ---------- */
/* Ложные варианты собираются из пар «артикль + окончание», встречающихся в курсе.
   Первый — тот же артикль с чужим окончанием, второй — чужой артикль с тем же
   окончанием: угадать нельзя ни по артиклю, ни по окончанию отдельно. */
function wortPairs(){
  const seen={}, out=[];
  ITEMS().forEach(x=>{ if(!x.art) return; const k=x.art+"|"+x.pl; if(seen[k]) return; seen[k]=1; out.push({art:x.art, pl:x.pl}); });
  return out;
}
/* Запас на случай, если в курсе не наберётся четырёх разных пар. */
const PL_ENDINGS = ["-n","-en","-e","-er","-s","¨e","¨er","¨","–"];
function wortFallbackPairs(){
  const out=[]; ARTICLES.forEach(a=>PL_ENDINGS.forEach(p=>out.push({art:a, pl:p}))); return out;
}
function wortDistractors(v, n){
  const right = wortAnswerOf(v), pairs = wortPairs();
  const out=[], taken={}; taken[right]=1;   /* правильный ответ добавляется отдельно — здесь он исключён */
  const add=a=>{ if(a && !taken[a]){ taken[a]=1; out.push(a); } };
  const pick=(f)=>{ const c = shuffled(pairs).filter(f).map(wortAnswerOf); add(c[0]); };
  pick(p=>p.art===v.art && p.pl!==v.pl);    /* тот же артикль, чужое окончание */
  pick(p=>p.art!==v.art && p.pl===v.pl);    /* чужой артикль, то же окончание */
  shuffled(pairs).concat(shuffled(wortFallbackPairs())).forEach(p=>{ if(out.length>=n) return; add(wortAnswerOf(p)); });
  return out.slice(0,n);
}

/* ---------- PERFEKT ---------- */
function splitPerf(s){ const p = (s||"").trim().split(/\s+/); return {aux:p[0]||"", part:p.slice(1).join(" ")}; }
function otherAux(a){ return a==="ist" ? "hat" : "ist"; }
/* Слабое причастие вместо сильного: gebrochen → gebrocht. */
function weakPart(p){ return /en$/.test(p) ? p.slice(0,-2)+"t" : ""; }
/* Приставка перед ge- в причастии: («abbrechen», «abgebrochen») → «ab», («verstehen», «verstanden») → null. */
function gePrefix(inf, part){
  for(let k=Math.min(inf.length, part.length); k>=0; k--){
    const pref = inf.slice(0,k);
    if(part.startsWith(pref+"ge")) return pref;
  }
  return null;
}
function stemOf(s){ return s.replace(/e?n$/,""); }
/* Причастия, «собранные» из инфинитива, — типичные ошибки: корень не изменён либо ge- потеряно. */
function regularParts(inf, part){
  const pref = gePrefix(inf, part);
  if(pref===null) return [stemOf(inf)+"t", inf];          /* versteht, verstehen */
  const stem = stemOf(inf.slice(pref.length));
  return [pref+"ge"+stem+"t",                             /* abgebrecht */
          pref+"ge"+stem+"en",                            /* abgebrechen */
          pref+part.slice(pref.length+2)];                /* abbrochen — без ge */
}
function perfDistractors(v, n){
  const {aux, part} = splitPerf(v.perf[0]);
  if(!part) return [];
  const alt = otherAux(aux);
  const variants = [weakPart(part)].concat(regularParts(v.inf, part)).filter(Boolean);
  /* Первым — верное причастие с чужим вспомогательным глаголом: hat/ist проверяется всегда.
     Дальше — искажённые причастия; первому из них даём верный вспомогательный, чтобы
     правильный ответ нельзя было вычислить по одному только hat/ist. */
  const wanted = [alt+" "+part];
  shuffled(variants).forEach((p,i)=>{ wanted.push((i===0?aux:(i===1?alt:(Math.random()<.5?aux:alt)))+" "+p); });
  /* Запас на случай, если что-то отсеется как совпадающее с правильным ответом. */
  const backup = [];
  variants.forEach(p=>{ backup.push(aux+" "+p); backup.push(alt+" "+p); });

  const out = [], taken = {};
  v.perf.forEach(p=>{ taken[normPerf(p)] = 1; });
  wanted.concat(backup).forEach(c=>{ const k = normPerf(c);
    if(out.length>=n || taken[k]) return; taken[k]=1; out.push(c); });
  return out;
}
/* Если глагол дал меньше трёх форм — добираем Perfekt чужих глаголов. */
function perfFallback(v, have, n){
  const taken = {}; v.perf.forEach(p=>taken[normPerf(p)]=1); have.forEach(p=>taken[normPerf(p)]=1);
  const out = [];
  shuffled(ITEMS()).forEach(x=>{ if(out.length>=n) return; const c = x.perf[0], k = normPerf(c);
    if(taken[k]) return; taken[k]=1; out.push(c); });
  return out;
}

/* ---------- СБОРКА ---------- */
/* → {correct, options} — options уже перемешаны, correct входит в них. */
function buildChoices(v){
  const need = CHOICE_COUNT-1;
  if(isWort()) return {correct:wortAnswerOf(v), options:shuffled([wortAnswerOf(v)].concat(wortDistractors(v, need)))};
  const correct = isPrep() ? prepAnswerOf(v) : v.perf[0];
  let wrong = isPrep() ? prepDistractors(v, need) : perfDistractors(v, need);
  if(!isPrep() && wrong.length<need) wrong = wrong.concat(perfFallback(v, wrong, need-wrong.length));
  return {correct:correct, options:shuffled([correct].concat(wrong))};
}
