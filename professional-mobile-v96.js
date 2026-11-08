/* Move secondary navigation into existing More menu on phones.
   Keeps the original buttons and their click listeners; no navigation rewrite. */
(()=>{'use strict';
function init(){
 const nav=document.querySelector('nav.focus-nav');
 const more=nav?.querySelector('.focus-more-items');
 const moreShell=nav?.querySelector('.focus-more');
 if(!nav||!more||!moreShell)return;
 const secondary=['flashcards','grammarGuide','articleTrainer'];
 const originals=secondary.map(tab=>{const el=nav.querySelector(':scope > .tab[data-tab="'+tab+'"]');return {tab,el,next:el?.nextSibling}}).filter(x=>x.el);
 const media=matchMedia('(max-width:800px)');
 function apply(){
  if(media.matches){originals.forEach(({el})=>more.insertBefore(el,more.firstChild));}
  else{originals.forEach(({el,next})=>{if(next&&next.parentNode===nav)nav.insertBefore(el,next);else nav.insertBefore(el,moreShell)});}
 }
 apply();media.addEventListener?.('change',apply);
 nav.addEventListener('click',e=>{if(e.target.closest('.focus-more-items>.tab'))moreShell.open=false});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();