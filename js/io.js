"use strict";

/* ---------- ЭКСПОРТ / ИМПОРТ ---------- */
function tsStamp(d){ const p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+"-"+p(d.getMinutes())+"-"+p(d.getSeconds()); }
function counts_of(id){ const c=COURSES[id], st=statuses[id]; let l=0,n=0,nw=0,r=0;
  c.data.forEach(v=>{const s=st[v.id]; if(s==="learned")l++;else if(s==="notlearned")n++;else if(s==="repeated")r++;else nw++;});
  return {learned:l,notlearned:n,repeated:r,"new":nw,total:c.data.length}; }
function courseDump(id){ const c=COURSES[id], st=statuses[id]; const grp=s=>c.data.filter(v=>st[v.id]===s).map(v=>v.id+". "+v.inf);
  return {summary:counts_of(id), folders:{learned:grp("learned"),notlearned:grp("notlearned"),repeated:grp("repeated"),new:grp("new")}, status:st}; }
function exportProgress(){
  const now=new Date();
  const dump={}; COURSE_IDS.forEach(id=>dump[id]=courseDump(id));
  /* version 4: прогресс обоих курсов. Поля верхнего уровня — для совместимости с v3. */
  const data={app:"deutsch_verben_1_270",version:4,savedAt:now.toISOString(),course,
    courses:dump, summary:dump.verbs.summary, folders:dump.verbs.folders, status:dump.verbs.status};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download="verben_progress_"+tsStamp(now)+".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function applyImportedStatus(id, src){ if(!src) return 0; const st=statuses[id]; let n=0;
  Object.keys(src).forEach(k=>{ if(st[k]!==undefined && ["learned","notlearned","repeated","new"].includes(src[k])){ st[k]=src[k]; n++; } }); return n; }
function importProgress(file){ const rd=new FileReader();
  rd.onload=()=>{ try{ const o=JSON.parse(rd.result); let n=0;
    if(o.courses){ COURSE_IDS.forEach(id=>{ const c=o.courses[id]; if(c) n+=applyImportedStatus(id, c.status||c); }); }
    else n+=applyImportedStatus("verbs", o.status||o);   /* файлы v3 — это прогресс курса форм */
    try{ COURSE_IDS.forEach(saveCourseProgress); updateSavedInfo(new Date()); }catch(e){}
    refreshFolders(); renderModes(); renderDict(); alert(t("alertImported")(n));
  }catch(e){ alert(t("alertImportFail")); } }; rd.readAsText(file); }
