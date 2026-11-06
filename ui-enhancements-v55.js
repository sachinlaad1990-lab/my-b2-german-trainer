/* Progressive UI enhancements v5.5: no vocabulary or progress migrations. */
(()=>{"use strict";
const q=(s,root=document)=>root.querySelector(s);
const qa=(s,root=document)=>Array.from(root.querySelectorAll(s));
function ready(){
 const main=q("main"),nav=q(".focus-nav"),appearance=q("#appearanceTheme");
 if(!main||!nav)return;
 main.id="mainStudyContent";
 if(!q(".ux-skip")){const skip=document.createElement("a");skip.className="ux-skip";skip.href="#mainStudyContent";skip.textContent="Skip to learning content";document.body.insertBefore(skip,document.body.firstChild)}
 main.tabIndex=-1;
 nav.setAttribute("aria-label","Learning sections");
 // Expose the selected tab without changing the app's own click handlers.
 function syncNav(){
   qa(".tab[data-tab]",nav).forEach(b=>{
    const selected=b.classList.contains("active")&&!b.classList.contains("hidden");
    b.setAttribute("aria-current",selected?"page":"false");
   });
 }
 nav.addEventListener("click",e=>{
   const button=e.target.closest("button[data-tab]");
   if(!button)return;
   requestAnimationFrame(()=>{syncNav();
    // Avoid horizontal scroll nudging the whole document on touch devices.
    if(button.closest(".focus-nav")&&!button.closest(".focus-more-items")){
      const left=button.offsetLeft-nav.offsetLeft;
      if(left<nav.scrollLeft||left+button.offsetWidth>nav.scrollLeft+nav.clientWidth)nav.scrollTo({left:Math.max(0,left-30),behavior:"smooth"});
    }
   });
 });
 syncNav();
 // Use existing saved appearance settings and change handler, never a second theme store.
 const head=q("header .brandhead");
 if(head&&appearance&&!q("#uxThemeToggle")){
   const wrapper=document.createElement("div");wrapper.className="ux-head-actions";
   const button=document.createElement("button");button.type="button";button.id="uxThemeToggle";button.className="ux-theme-button";button.setAttribute("aria-label","Toggle light and dark mode");
   const update=()=>{const dark=appearance.value==="dark";button.textContent=dark?"☀ Light":"☾ Dark";button.setAttribute("aria-pressed",dark?"true":"false")};
   button.addEventListener("click",()=>{appearance.value=appearance.value==="dark"?"light":"dark";appearance.dispatchEvent(new Event("change",{bubbles:true}));update()});
   appearance.addEventListener("change",update);
   wrapper.appendChild(button);head.appendChild(wrapper);update();
 }
 // Search is already implemented by the app; add accessible shortcuts only.
 const search=q("#search");
 if(search){
   search.setAttribute("type","search");
   search.setAttribute("autocomplete","off");
   search.setAttribute("aria-label","Search vocabulary by German word, English meaning or category");
   search.setAttribute("enterkeyhint","search");
 }
 const vSearch=q("#vtSearch");if(vSearch)vSearch.setAttribute("aria-label","Find a verb");
 const reveal=q("#revealBtn"),next=q("#nextCard"),prev=q("#prevCard");
 const feedback=q("#score");if(feedback)feedback.setAttribute("aria-live","polite");
 const flashCount=q("#flashCount");if(flashCount)flashCount.setAttribute("aria-live","polite");
 document.addEventListener("keydown",e=>{
   if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing)return;
   const el=e.target,typing=el instanceof HTMLElement&&(el.isContentEditable||["INPUT","TEXTAREA","SELECT"].includes(el.tagName));
   if(e.key==="Escape"){
     const more=q("#focusMoreMenu");if(more&&more.open){more.open=false;e.preventDefault()}
     return;
   }
   if(typing)return;
   const vocabVisible=q("#library")&&!q("#library").classList.contains("hidden");
   if(e.key==="/"&&vocabVisible&&search){e.preventDefault();search.focus();return}
   const flashVisible=q("#flashcards")&&!q("#flashcards").classList.contains("hidden");
   if(flashVisible){
     if(e.key==="ArrowRight"&&next){e.preventDefault();next.click()}
     else if(e.key==="ArrowLeft"&&prev){e.preventDefault();prev.click()}
     else if(e.key===" "&&reveal){e.preventDefault();reveal.click()}
   }
 });
 // Disclose optional shortcut help without stealing learning area.
 const flash=q("#flashcards .flash");
 if(flash&&!q("#uxFlashHint")){
   const hint=document.createElement("p");hint.id="uxFlashHint";hint.className="ux-search-help";hint.textContent="Keyboard: Space = reveal · ← / → = previous / next";
   flash.appendChild(hint);
 }
 // Prevent hidden decorative image from being voiced as unrelated content.
 const headerPhoto=q("#headerPhoto");if(headerPhoto&&!headerPhoto.getAttribute("alt"))headerPhoto.setAttribute("alt","App profile");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});else ready();
})();