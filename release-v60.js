/* Deutsch B2 Beruf — stable v6.0 release integration.
 * Keeps all existing localStorage, account state, decks, sheet sync, and practice logic unchanged.
 */
(()=>{"use strict";
const one=(selector,root=document)=>root.querySelector(selector);
const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const activate=(destination)=>{
  const tab=all(".focus-nav .tab[data-tab]").find(b=>b.dataset.tab===destination&&!b.classList.contains("hidden"));
  if(!tab)return false;
  tab.click();
  const view=document.getElementById(destination);
  if(view&&!view.classList.contains("hidden")){
    const top=view.getBoundingClientRect().top+window.scrollY-15;
    window.scrollTo({top:Math.max(0,top),behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  }
  return true;
};
function setup(){
  all(".home-path[data-destination]").forEach(button=>{
    button.addEventListener("click",()=>{
      const destination=button.getAttribute("data-destination");
      if(destination)activate(destination);
    });
  });
  const backup=one("#releaseExportBtn"),status=one("#releaseBackupStatus");
  if(backup)backup.addEventListener("click",()=>{
    const exporter=one("#exportBtn");
    if(exporter&&!exporter.disabled){
      exporter.click();
      if(status)status.textContent="Backup export requested. Check your browser downloads.";
    }else if(status)status.textContent="Export is not available right now. Open Import / Export and try again.";
  });
  const importButton=one("#releaseOpenImportBtn");
  if(importButton)importButton.addEventListener("click",()=>activate("import"));
  const currentThemeMeta=one('meta[name="theme-color"]');
  const updateThemeMeta=()=>{
    if(!currentThemeMeta)return;
    const bg=getComputedStyle(document.body).getPropertyValue("--bg").trim();
    if(bg&&/^#[0-9a-f]{6}$/i.test(bg))currentThemeMeta.setAttribute("content",bg);
  };
  updateThemeMeta();
  const themeSelect=one("#appearanceTheme");
  if(themeSelect)themeSelect.addEventListener("change",updateThemeMeta);
  // Do not keep hidden focus inside inactive tabs.
  all(".focus-nav button.tab[data-tab]").forEach(button=>{
    button.addEventListener("click",()=>{
      const current=all(".focus-nav button.tab[data-tab]").find(x=>x.classList.contains("active"));
      if(current)current.setAttribute("aria-current","page");
      all(".focus-nav button.tab[data-tab]").filter(x=>x!==current).forEach(x=>x.removeAttribute("aria-current"));
    });
  });
  // Do not alter the daily study state or synthesize a fake streak or exam score.
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();