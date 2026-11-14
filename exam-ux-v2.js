/* Focused exam navigation. UI only; does not alter the bank, source or stored answers. */
(function(){
'use strict';
const api=window.__b2ExamUX,root=document.getElementById('main'),list=document.getElementById('questionList'),workspace=document.querySelector('.workspace');
if(!api||!root||!list||!workspace)return;
document.body.classList.add('exam-ux-enhanced');
const sections=['Lesen','Hören','Schreiben','Sprechen'],all=api.getSets(),lastSeen=new Map(),indices=new Map();
const groups=Object.fromEntries(sections.map(s=>[s,all.filter(e=>e.section===s && e.questions?.length)]));
let lastSet='',lastSection='',view='question',sideCollapsed=false;
try{sideCollapsed=JSON.parse(localStorage.getItem('b2beruf-exam-layout-v2')||'{}').sideCollapsed===true}catch(_){}
const make=(tag,cls,t)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(t!==undefined)e.textContent=t;return e};
const current=()=>api.getCurrentExercise();
const nav=make('nav','exam-ux-bar');nav.id='examUxBar';nav.setAttribute('aria-label','Exam section, exercise and question navigation');
const tabs=make('div','exam-ux-sections'),tabBtns={};
for(const section of sections){const b=make('button','ux-tab',section);b.type='button';b.dataset.section=section;b.setAttribute('aria-label','Open '+section);b.onclick=()=>{const target=lastSeen.get(section)||groups[section]?.[0]?.id;if(!target)return;api.setSection(section);api.selectSet(target);switchView('question')};tabs.append(b);tabBtns[section]=b}
const hideSide=make('button','ux-side-toggle','Hide exercise list');hideSide.type='button';hideSide.onclick=()=>{sideCollapsed=!sideCollapsed;document.body.classList.toggle('exam-side-collapsed',sideCollapsed);hideSide.textContent=sideCollapsed?'Show exercise list':'Hide exercise list';try{localStorage.setItem('b2beruf-exam-layout-v2',JSON.stringify({sideCollapsed}))}catch(_){}};tabs.append(hideSide);
document.body.classList.toggle('exam-side-collapsed',sideCollapsed);hideSide.textContent=sideCollapsed?'Show exercise list':'Hide exercise list';
const ctrl=make('div','exam-ux-controls'),setLabel=make('label'),setTitle=make('span','exam-ux-label','Exercise'),setSelect=make('select');setSelect.id='uxExerciseSelect';setSelect.setAttribute('aria-label','Select exercise');setLabel.append(setTitle,setSelect);ctrl.append(setLabel);
const qc=make('div','exam-ux-questions'),prev=make('button','ux-step','‹'),ql=make('label'),qt=make('span','exam-ux-label','Question'),qselect=make('select','ux-number-select'),next=make('button','ux-step','›'),progress=make('span','exam-ux-progress');
prev.type='button';next.type='button';prev.id='uxPrevQuestion';next.id='uxNextQuestion';prev.setAttribute('aria-label','Previous question');next.setAttribute('aria-label','Next question');qselect.id='uxQuestionSelect';qselect.setAttribute('aria-label','Choose question');ql.append(qt,qselect);qc.append(prev,ql,next,progress);ctrl.append(qc);
const views=make('div','exam-ux-mobile-view'),showQ=make('button','','Question & answer'),showSource=make('button','','Read source');showQ.type='button';showSource.type='button';showQ.id='uxShowQuestion';showSource.id='uxShowSource';showQ.onclick=()=>switchView('question');showSource.onclick=()=>switchView('source');views.append(showQ,showSource);
nav.append(tabs,ctrl,views);root.querySelector('.topbar')?.insertAdjacentElement('afterend',nav);
const sourcePanel=workspace.querySelector('.panel:first-child'),answerPanel=workspace.querySelector('.panel:nth-child(2)');if(sourcePanel)sourcePanel.id='sourcePanel';if(answerPanel)answerPanel.id='answerPanel';
const notice=document.getElementById('notice');if(notice){const d=make('details','ux-review-wrap'),s=make('summary','','Source status & exam notes');d.append(s,notice);document.getElementById('audioLinks')?.insertAdjacentElement('beforebegin',d)}
function chooseOptions(select,items,active){select.replaceChildren(...items.map(item=>{const o=document.createElement('option');o.value=item.value;o.textContent=item.label;return o}));select.value=active}
function switchView(v){view=v==='source'?'source':'question';workspace.dataset.studyView=view;showQ.setAttribute('aria-pressed',String(view==='question'));showSource.setAttribute('aria-pressed',String(view==='source'))}
function active(e){if(!indices.has(e.id))indices.set(e.id,0);return Math.max(0,Math.min(e.questions.length-1,indices.get(e.id)))}
function go(index,focus){const e=current();if(!e?.questions.length)return;indices.set(e.id,Math.max(0,Math.min(e.questions.length-1,index)));showCards(e);switchView('question');if(focus)answerPanel?.scrollIntoView({behavior:'smooth',block:'start'})}
prev.onclick=()=>go(active(current())-1,true);next.onclick=()=>go(active(current())+1,true);qselect.onchange=()=>go(Number(qselect.value),true);
setSelect.onchange=()=>{const e=all.find(v=>v.id===setSelect.value);if(e){api.selectSet(e.id);switchView('question')}};
function styleCard(card,question){
if(card.dataset.uxEnhanced)return;
card.dataset.uxEnhanced='yes';
const prompt=card.querySelector('.question-prompt');if(prompt)prompt.insertAdjacentElement('beforebegin',make('div','ux-question-label',question.kind==='note'?'Source item':'Question'));
const inputs=[...card.children].filter(el=>el.classList?.contains('choice')||el.classList?.contains('answer-input'));
if(inputs.length){
 const block=make('div','ux-answer-block');block.append(make('div','ux-answer-title',question.kind==='free'?'Write your response':question.kind==='gap'?'Type your answer':'Choose your answer'));
 inputs[0].insertAdjacentElement('beforebegin',block);
 inputs.forEach(el=>block.append(el));
 // Explanatory editorial/source notes are intentionally collapsed beneath answers.
 const extra=[...card.children].find(el=>el.classList?.contains('marking') && el.classList.contains('no-key') && el.nextElementSibling===block);
 if(extra){const d=make('details','ux-source-note');d.append(make('summary','','Source note / answer accuracy'),extra);block.insertAdjacentElement('afterend',d)}
}else if(question.kind==='note'){card.append(make('div','ux-no-question','This source item is incomplete; no answer is required. The available original PDF text remains accessible.'))}
}
let showing=false;
function showCards(e){
if(showing)return;showing=true;
try{
 const cards=[...list.children].filter(n=>n.classList?.contains('question'));
 if(cards.length!==e.questions.length)return;
 const n=active(e);
 cards.forEach((c,i)=>{styleCard(c,e.questions[i]);c.hidden=i!==n;c.setAttribute('aria-hidden',String(i!==n))});
 qselect.value=String(n);prev.disabled=n===0;next.disabled=n>=cards.length-1;
 progress.textContent=cards.length?(n+1)+' / '+cards.length:'No questions';
 document.getElementById('uxBottomPager')?.remove();
 if(cards.length>1){const p=make('div','ux-bottom-pager');p.id='uxBottomPager';const back=make('button','btn','← Previous'),forward=make('button','btn primary','Next →');back.type='button';forward.type='button';back.disabled=n===0;forward.disabled=n===cards.length-1;back.onclick=()=>go(n-1,true);forward.onclick=()=>go(n+1,true);p.append(back,make('span','ux-counter','Question '+(n+1)+' of '+cards.length),forward);list.insertAdjacentElement('afterend',p)}
}finally{showing=false}
}
function sync(){
 const e=current();if(!e)return;
 if(e.id!==lastSet){lastSet=e.id;lastSeen.set(e.section,e.id);switchView('question')}
 for(const [sec,b] of Object.entries(tabBtns)){b.setAttribute('aria-current',String(sec===e.section));b.disabled=!groups[sec]?.length}
 if(lastSection!==e.section || !setSelect.options.length){lastSection=e.section;chooseOptions(setSelect,all.filter(v=>v.section===e.section).map(v=>({value:v.id,label:v.title+' · '+v.questions.length+' questions'})),e.id)}else setSelect.value=e.id;
 chooseOptions(qselect,e.questions.map((q,i)=>({value:String(i),label:(q.kind==='note'?'Source item ':'Question ')+q.number+' · p. '+q.page})),String(active(e)));
 qselect.disabled=!e.questions.length;
 showCards(e);
}
const observer=new MutationObserver(()=>sync());observer.observe(list,{childList:true});sync();
window.__b2ExamUXV2={getActiveIndex:()=>active(current()),goToQuestion:n=>go(n,true),showSource:()=>switchView('source')};
})();
