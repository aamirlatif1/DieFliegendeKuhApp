"use strict";

/* ---------- ЭКСПОРТ / ИМПОРТ ---------- */
function tsStamp(d){ const p=n=>String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+"-"+p(d.getMinutes())+"-"+p(d.getSeconds()); }
function counts_all(){ let l=0,n=0,nw=0,r=0; VERBS.forEach(v=>{const s=status[v.id]; if(s==="learned")l++;else if(s==="notlearned")n++;else if(s==="repeated")r++;else nw++;}); return {learned:l,notlearned:n,repeated:r,"new":nw,total:VERBS.length}; }
function exportProgress(){
  const now=new Date(); const grp=s=>VERBS.filter(v=>status[v.id]===s).map(v=>v.id+". "+v.inf);
  const data={app:"deutsch_verben_1_270",version:3,savedAt:now.toISOString(), summary:counts_all(), folders:{learned:grp("learned"),notlearned:grp("notlearned"),repeated:grp("repeated"),new:grp("new")}, status};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download="verben_progress_"+tsStamp(now)+".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function importProgress(file){ const rd=new FileReader();
  rd.onload=()=>{ try{ const o=JSON.parse(rd.result); const st=o.status||o; let n=0;
    Object.keys(st).forEach(k=>{ if(status[k]!==undefined && ["learned","notlearned","repeated","new"].includes(st[k])){ status[k]=st[k]; n++; } });
    saveProgress(); refreshFolders(); renderModes(); renderDict(); alert(t("alertImported")(n));
  }catch(e){ alert(t("alertImportFail")); } }; rd.readAsText(file); }
