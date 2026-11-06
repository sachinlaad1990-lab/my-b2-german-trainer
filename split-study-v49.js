/* Split Study v4.9: keep the original study views and the original
 * Article Trainer iframe mounted, so their progress and session are preserved.
 * Uses CSS grid; no iframes are duplicated or reparented.
 */
(function(){
'use strict';
const main=document.querySelector('main');
const toolbar=document.getElementById('splitStudyToolbar');
const toggle=document.getElementById('splitStudyToggle');
const choice=document.getElementById('splitStudyLeft');
const hint=document.getElementById('splitStudyHint');
const menu=document.getElementById('focusMoreMenu');
const valid=new Set(['today','library','flashcards','grammarGuide','everyday']);
if(!main||!toolbar||!toggle||!choice)return;
const remembered=(()=>{try{return localStorage.getItem('b2SplitStudyLeft_v49')}catch(e){return null}})();
if(valid.has(remembered))choice.value=remembered;
let active=false;
let left='library';
function setTabVisible(id){
 document.querySelectorAll('main .view').forEach(v=>v.classList.toggle('hidden',v.id!==id));
 document.querySelectorAll('button.tab[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
}
function getActiveStudy(){
 const selected=document.querySelector('button.tab.active[data-tab]');
 const candidate=selected?.dataset.tab;
 return valid.has(candidate)?candidate:(valid.has(choice.value)?choice.value:'library');
}
function updateControls(){
 toggle.setAttribute('aria-pressed',String(active));
 toggle.textContent=active?'⤢ Exit split study':'◫ Study side by side';
 choice.disabled=!active;
 choice.closest('.split-study-select')?.classList.toggle('hidden',!active);
 hint.textContent=active?'Independent panels: scroll Vocabulary/Flashcards/Grammar on the left and search Articles on the right.':'Keep your current lesson open and check German noun articles without switching tabs.';
}
function openSplit(id){
 if(!valid.has(id))id='library';
 const article=document.getElementById('articleTrainer');
 const source=document.getElementById(id);
 if(!source||!article)return;
 left=id;active=true;
 choice.value=left;
 try{localStorage.setItem('b2SplitStudyLeft_v49',left)}catch(e){}
 setTabVisible(left);
 article.classList.remove('hidden');
 main.classList.add('split-study');
 if(menu)menu.open=false;
 updateControls();
}
function closeSplit(){
 if(!active)return;
 active=false;
 main.classList.remove('split-study');
 setTabVisible(left);
 updateControls();
}
toggle.addEventListener('click',()=>{
 if(active){closeSplit();return;}
 openSplit(getActiveStudy());
});
choice.addEventListener('change',()=>{
 if(!valid.has(choice.value))return;
 openSplit(choice.value);
});
// A normal main-tab selection exits split mode and resumes the existing
// app's original tab handler (which continues to work unchanged).
document.addEventListener('click',e=>{
 if(!active)return;
 const target=e.target instanceof Element?e.target:e.target?.parentElement;
 const tab=target?.closest('button.tab[data-tab]');
 if(tab)closeSplit();
},true);
document.addEventListener('keydown',e=>{
 if(active&&e.key==='Escape'&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLTextAreaElement)){closeSplit();toggle.focus();}
});
updateControls();
})();