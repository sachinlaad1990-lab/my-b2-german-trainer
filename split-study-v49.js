/* Split study v7.2: choose BOTH panes, keep one instance of each real lesson.
 * No iframes cloned; no vocabulary or progress changed.
 */
(()=>{"use strict";
const main=document.querySelector("main");
const toolbar=document.getElementById("splitStudyToolbar");
const toggle=document.getElementById("splitStudyToggle");
const leftSelect=document.getElementById("splitStudyLeft");
const rightSelect=document.getElementById("splitStudyRight");
const hint=document.getElementById("splitStudyHint");
const menu=document.getElementById("focusMoreMenu");
const supported=["today","library","verbTrainer","flashcards","grammarGuide","articleTrainer","spokenGerman","everyday","quiz"];
const allowed=new Set(supported);
if(!main||!toolbar||!toggle||!leftSelect||!rightSelect)return;
const stored=(key,fallback)=>{try{const v=localStorage.getItem(key);return allowed.has(v)?v:fallback}catch{return fallback}};
let left=stored("b2SplitStudyLeft_v49","library");
let right=stored("b2SplitStudyRight_v72","articleTrainer");
if(left===right)right=left==="articleTrainer"?"library":"articleTrainer";
let active=false;
leftSelect.value=left;rightSelect.value=right;
function allViews(){return [...main.querySelectorAll(":scope > .view")]}
function updateControls(){
 toggle.setAttribute("aria-pressed",String(active));
 toggle.textContent=active?"⤢ Exit split study":"◫ Split study";
 for(const input of [leftSelect,rightSelect]){
   input.disabled=!active;
   input.closest(".split-study-select")?.classList.toggle("hidden",!active);
 }
 hint.textContent=active
  ? "Choose any two different lessons. Each pane scrolls independently."
  : "Study two lessons together; choose both panels after tapping Split study.";
}
function remember(){
 try{
  localStorage.setItem("b2SplitStudyLeft_v49",left);
  localStorage.setItem("b2SplitStudyRight_v72",right);
 }catch{}
}
function updateViewContent(id){
 // Normal lesson renderers are already present; refresh only what needs a session.
 try{
  if(id==="flashcards"&&typeof renderFlash==="function")renderFlash();
  if(id==="quiz"&&typeof startQuiz==="function")startQuiz();
  if(id==="today"&&typeof renderToday==="function")renderToday();
 }catch(err){console.warn("Split study lesson refresh:",err)}
}
function paint(){
 if(!active)return;
 const selected=new Set([left,right]);
 allViews().forEach(view=>{
   const show=selected.has(view.id);
   view.classList.toggle("hidden",!show);
   if(show)view.dataset.splitSide=view.id===left?"left":"right";
   else delete view.dataset.splitSide;
 });
 document.querySelectorAll(".focus-nav button.tab[data-tab]").forEach(b=>{
   const show=selected.has(b.dataset.tab);
   b.classList.toggle("active",show);
   b.setAttribute("aria-pressed",String(show));
 });
 leftSelect.value=left;rightSelect.value=right;
 main.classList.add("split-study");
 updateControls();
}
function choose(side,id){
 if(!allowed.has(id))return;
 if(side==="left")left=id;else right=id;
 if(left===right){
   // A lesson has one real DOM instance, so it cannot occupy both panes.
   if(side==="left")right=(id==="articleTrainer"?"library":"articleTrainer");
   else left=(id==="library"?"articleTrainer":"library");
 }
 remember();
 updateViewContent(id);
 paint();
}
function openSplit(){
 active=true;
 updateViewContent(left);updateViewContent(right);
 if(menu)menu.open=false;
 paint();
}
function closeSplit(){
 if(!active)return;
 active=false;
 main.classList.remove("split-study");
 allViews().forEach(view=>delete view.dataset.splitSide);
 // Return to the left-side lesson; the original tab's navigation stays intact.
 allViews().forEach(view=>view.classList.toggle("hidden",view.id!==left));
 document.querySelectorAll(".focus-nav button.tab[data-tab]").forEach(b=>{
   b.classList.toggle("active",b.dataset.tab===left);
   b.setAttribute("aria-pressed",String(b.dataset.tab===left));
 });
 updateControls();
}
toggle.addEventListener("click",()=>{
 if(active)closeSplit();else openSplit();
});
leftSelect.addEventListener("change",()=>choose("left",leftSelect.value));
rightSelect.addEventListener("change",()=>choose("right",rightSelect.value));
// Existing tab links deliberately exit split mode and run their normal handlers.
document.addEventListener("click",event=>{
 if(!active)return;
 const target=event.target instanceof Element?event.target:event.target?.parentElement;
 if(target?.closest(".focus-nav button.tab[data-tab]"))closeSplit();
},true);
document.addEventListener("keydown",event=>{
 if(active&&event.key==="Escape"&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLTextAreaElement)){
  closeSplit();toggle.focus();
 }
});
updateControls();
})();