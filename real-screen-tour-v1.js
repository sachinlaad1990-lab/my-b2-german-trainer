/* Real-screen interactive tour: each preview displays the actual app in a same-origin iframe. */
(()=>{'use strict';
if(new URLSearchParams(location.search).has('tourPreview')){
 document.documentElement.classList.add('tour-preview-mode');
 const style=document.createElement('style');
 style.textContent='.tour-preview-mode #appTour,.tour-preview-mode .app-tour,.tour-preview-mode .split-study-toolbar{display:none!important} .tour-preview-mode body{overflow:auto!important}';
 document.head.appendChild(style);
 return;
}
const slides=[
 {tab:'today',title:'Your German learning hub',desc:'Start with a clear overview of your B2 Beruf learning journey.',icon:'icon-house'},
 {tab:'library',title:'Vocabulary for real work',desc:'Study useful German words, articles, meanings and examples.',icon:'icon-book-open'},
 {tab:'verbTrainer',title:'Get confident with verbs',desc:'Explore verb forms and the cases used in everyday German.',icon:'icon-languages'},
 {tab:'flashcards',title:'Remember with flashcards',desc:'Flip through your actual study cards and review difficult words.',icon:'icon-layers'},
 {tab:'grammarGuide',title:'Grammar made clearer',desc:'Build confidence with Akkusativ, Dativ and Genitiv.',icon:'icon-book-text'},
 {tab:'quiz',title:'Put your knowledge to work',desc:'Practice with quizzes and immediate feedback.',icon:'icon-target'},
 {tab:'progress',title:'See how far you have come',desc:'Follow your learning and keep improving every day.',icon:'icon-chart'}
];
function init(){
 const old=document.getElementById('appTour');if(!old||document.getElementById('realScreenTour'))return;
 const wrap=document.createElement('section');wrap.id='realScreenTour';wrap.className='real-screen-tour';
 wrap.setAttribute('aria-label','Interactive app slideshow with real screen previews');
 wrap.innerHTML=`<div class="rst-head"><div><span class="rst-eyebrow">EXPLORE THE APP</span><h2>See how Deutsch B2 Beruf works</h2><p>Actual interactive app screens, not stock images.</p></div><span class="rst-count" aria-live="polite">01 / 07</span></div>
 <div class="rst-layout"><div class="rst-phone"><div class="rst-phone-top" aria-hidden="true"><span></span></div><iframe title="Live preview of the German B2 learning app" loading="lazy" tabindex="-1" src="index.html?tourPreview=1"></iframe><div class="rst-phone-bottom" aria-hidden="true"></div></div>
 <div class="rst-info"><span class="rst-step">STEP 01</span><div class="rst-icon" aria-hidden="true"></div><h3 class="rst-title"></h3><p class="rst-desc"></p><div class="rst-actions"><button type="button" class="rst-prev" aria-label="Previous screen">← Previous</button><button type="button" class="rst-next" aria-label="Next screen">Next →</button></div><div class="rst-dots" role="group" aria-label="Choose a preview"></div><a class="rst-cta" href="#library">Try it free — Start learning <span aria-hidden="true">→</span></a><p class="rst-note">These are live views of this website. Preview content may reflect your saved learning data.</p></div></div>`;
 old.replaceWith(wrap);
 const iframe=wrap.querySelector('iframe'),dots=wrap.querySelector('.rst-dots');
 let current=0,loaded=false,auto=null;
 const phone=wrap.querySelector('.rst-phone');
 const resize=()=>phone.style.setProperty('--rst-scale',String((phone.clientWidth-16)/390));
 resize();if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(phone);
 window.addEventListener('resize',resize);
 slides.forEach((slide,i)=>{const b=document.createElement('button');b.type='button';b.className='rst-dot';b.setAttribute('aria-label','Show '+slide.title);b.addEventListener('click',()=>show(i,true));dots.appendChild(b)});
 function navigate(){
  if(!loaded)return;
  try{const doc=iframe.contentDocument;const target=doc.querySelector('.tab[data-tab="'+slides[current].tab+'"]');
   if(target)target.click();
   else {const view=doc.getElementById(slides[current].tab);if(view){doc.querySelectorAll('section.view').forEach(el=>el.classList.add('hidden'));view.classList.remove('hidden')}}
   const view=doc.getElementById(slides[current].tab);
   if(view)view.scrollIntoView({block:'start',behavior:'instant'});
   else iframe.contentWindow.scrollTo(0,0);
  }catch(e){wrap.querySelector('.rst-note').textContent='Open the full app to explore this section.'}
 }
 function show(i,userAction=false){
  current=(i+slides.length)%slides.length;const s=slides[current];
  wrap.querySelector('.rst-count').textContent=String(current+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
  wrap.querySelector('.rst-step').textContent='STEP '+String(current+1).padStart(2,'0');
  wrap.querySelector('.rst-title').textContent=s.title;wrap.querySelector('.rst-desc').textContent=s.desc;
  wrap.querySelector('.rst-icon').innerHTML='<svg class="ui-icon" aria-hidden="true"><use href="#'+s.icon+'"></use></svg>';
  [...dots.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j===current)));
  navigate();if(userAction)stopAuto();
 }
 function stopAuto(){if(auto){clearInterval(auto);auto=null}}
 iframe.addEventListener('load',()=>{loaded=true;navigate()});
 wrap.querySelector('.rst-prev').addEventListener('click',()=>show(current-1,true));
 wrap.querySelector('.rst-next').addEventListener('click',()=>show(current+1,true));
 wrap.addEventListener('mouseenter',stopAuto);wrap.addEventListener('focusin',stopAuto);
 show(0);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)auto=setInterval(()=>show(current+1),6500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();