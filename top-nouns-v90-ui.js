/* Top 300 noun study layer: independent progress, preserves existing user vocabulary. */
(function(){
"use strict";
const model=window.B2TopNouns;
if(!model)return;
const KEY="b2TopNounsProgress_v90";
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");return x&&typeof x==="object"?x:{}}catch(_){return {}}}
let progress=read(),deck=0,flashDeck=0,flashIndex=0,revealed=false,nounQuestion=null,nounAnswered=false;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(progress))}catch(_){}};
const study=w=>progress[w.id]||{correct:0,wrong:0,due:0};
function rate(w,correct){
 const p=study(w),wrong=Number(p.wrong)||0,now=Date.now();
 progress[w.id]={correct:(Number(p.correct)||0)+(correct?1:0),wrong:wrong+(correct?0:1),due:now+(correct?(wrong>=2?86400000:259200000):600000),last:now};
 persist();
}
const nounBatch=i=>model.groups[Math.max(0,Math.min(model.groups.length-1,i))]?.words||[];
function ensure(noun,options){
 const existing=options.filter(x=>x&&x!==noun);
 return [noun,...new Set(existing)].slice(0,4);
}
function shuffle(a){
 a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
}
function genitiveOptions(w){
 const right=model.caseForm(w,3);
 const a=w.article==="die"?"der":"des",b=w.article==="die"?"die":"dem";
 const forms=ensure(right,[a+" "+w.noun,b+" "+w.noun,(w.article==="die"?"des ":"der ")+w.genitive,b+" "+w.genitive]);
 if(forms.length<4)for(const wrong of ["dem "+w.noun,"die "+w.noun,"des "+w.noun,"der "+w.noun,"das "+w.noun])if(!forms.includes(wrong))forms.push(wrong);
 return shuffle(forms.slice(0,4));
}
function info(w){
 let text=w.article+" "+w.noun+" → "+model.caseForm(w,3)+". ";
 if(w.article==="die")text+="Feminine Genitiv uses der; the noun normally stays unchanged.";
 else if(/^(Kollege|Kunde|Lieferant|Patient|Vorgesetzte|Angestellte|Auszubildende|Arbeitslose)$/.test(w.noun))text+="This is a weak masculine noun or nominalized adjective: use -n/-en rather than -s.";
 else text+="Masculine and neuter Genitiv usually adds -(e)s.";
 return text;
}
function showList(){
 const selector=document.getElementById("v4VocabSelect"),previous=document.getElementById("v4VocabPrev"),next=document.getElementById("v4VocabNext");
 const label=document.getElementById("v4VocabStatus"),el=document.getElementById("wordList"),search=document.getElementById("search").value.trim().toLocaleLowerCase("de-DE");
 const decks=model.groups;
 selector.innerHTML=decks.map((group,i)=>'<option value="'+i+'">Deck '+(i+1)+' — '+esc(group.name)+'</option>').join("");
 deck=Math.min(deck,decks.length-1);selector.value=String(deck);selector.disabled=false;
 previous.disabled=deck===0;next.disabled=deck===decks.length-1;
 const group=decks[deck];label.textContent="Core 300 · "+(deck+1)+" of 30";
 const matches=group.words.filter(w=>[w.noun,w.article,w.english,w.plural,w.category].join(" ").toLocaleLowerCase("de-DE").includes(search));
 const studied=model.words.filter(w=>(study(w).correct||0)>0).length;
 const mastered=model.words.filter(w=>(study(w).correct||0)>=2&&(study(w).wrong||0)<2).length;
 document.getElementById("v4StatResultsBar")?.classList.add("hidden");
 el.innerHTML='<div class="tn-header"><div><strong>Top 300 Nouns · '+esc(group.name)+'</strong><p class="muted small">Deck '+(deck+1)+' / 30 · 10 nouns per deck · '+studied+' practised · '+mastered+' stronger</p></div><div class="tn-actions"><button type="button" id="tnFlash">Study flashcards</button><button type="button" id="tnQuiz" class="primary">Article & case quiz</button></div></div><div class="tn-list">'+matches.map(w=>'<article class="tn-noun"><div><strong>'+esc(w.article+" "+w.noun)+'</strong><span class="muted small"> '+esc(w.english)+'</span></div><p>Plural: <b>'+esc(w.plural==="—"?"no usual plural":(w.plural.startsWith("die ")?"": "die ")+w.plural)+'</b> · Genitiv: <b>'+esc(model.caseForm(w,3))+'</b></p><details><summary>All four cases · Why?</summary><div class="tn-cases">'+["Nominativ","Akkusativ","Dativ","Genitiv"].map((name,i)=>'<div><span>'+name+'</span><strong>'+esc(model.caseForm(w,i))+'</strong></div>').join("")+'</div><p>'+esc(info(w))+'</p></details></article>').join("")+'</div>';
 el.querySelector("#tnFlash").onclick=()=>{const tab=document.querySelector('.tab[data-tab="flashcards"]');tab?.click();document.getElementById("flashMode").value="topnouns";flashDeck=deck;flashIndex=0;revealed=false;showFlash()};
 el.querySelector("#tnQuiz").onclick=()=>{document.querySelector('.tab[data-tab="quiz"]')?.click();document.getElementById("quizMode").value="topnouns";document.getElementById("quizMode").dispatchEvent(new Event("change",{bubbles:true}));const d=document.getElementById("quizDeck");d.value=String(deck);d.dispatchEvent(new Event("change",{bubbles:true}))};
}
function showFlash(){
 const panel=document.querySelector("#flashcards .panel.flash");
 if(!panel)return;
 const on=document.getElementById("flashMode").value==="topnouns";
 panel.classList.toggle("tn-flash-active",on);
 let container=document.getElementById("tnFlashPanel");
 if(!container){container=document.createElement("section");container.id="tnFlashPanel";panel.append(container)}
 container.hidden=!on;if(!on)return;
 const group=model.groups[flashDeck]||model.groups[0],w=group.words[flashIndex];
 const choices=document.getElementById("deckSelect");
 choices.innerHTML=model.groups.map((x,i)=>'<option value="'+i+'">Deck '+(i+1)+' · '+esc(x.name)+'</option>').join("");
 choices.value=String(flashDeck);
 const p=study(w);
 container.innerHTML='<div class="tn-flash-meta">Deck '+(flashDeck+1)+' / 30 · '+esc(group.name)+' · '+(flashIndex+1)+' / 10</div><div class="tn-flash-question"><span>Recall the article before revealing</span><h2>'+esc(revealed?w.article+" "+w.noun:"___ "+w.noun)+'</h2>'+(revealed?'<p>'+esc(w.english)+'</p><p>Plural: <b>'+esc(w.plural)+'</b></p><p>Genitiv: <b>'+esc(model.caseForm(w,3))+'</b></p><details><summary>All cases & memory tip</summary><p>'+esc(info(w))+'</p>'+["Nominativ","Akkusativ","Dativ","Genitiv"].map((x,i)=>'<p>'+x+': '+esc(model.caseForm(w,i))+'</p>').join("")+'</details>':'')+'</div><div class="tn-flash-actions"><button type="button" id="tnPrev">← Previous</button><button type="button" id="tnReveal" class="primary">'+(revealed?"Hide article":"Reveal article")+'</button><button type="button" id="tnNext">Next →</button></div><div class="tn-flash-actions"><button type="button" id="tnHard" '+(!revealed?"disabled":"")+'>← Need practice</button><button type="button" id="tnGood" '+(!revealed?"disabled":"")+'>✓ Remembered</button></div><p class="muted small">Reviewed: '+p.correct+' correct · '+p.wrong+' mistakes. Noun progress is saved separately from your existing flashcards.</p>';
 container.querySelector("#tnPrev").disabled=flashIndex===0;container.querySelector("#tnNext").disabled=flashIndex===9;
 container.querySelector("#tnPrev").onclick=()=>{flashIndex=Math.max(0,flashIndex-1);revealed=false;showFlash()};
 container.querySelector("#tnNext").onclick=()=>{flashIndex=Math.min(9,flashIndex+1);revealed=false;showFlash()};
 container.querySelector("#tnReveal").onclick=()=>{revealed=!revealed;showFlash()};
 container.querySelector("#tnHard").onclick=()=>{rate(w,false);flashIndex=Math.min(9,flashIndex+1);revealed=false;showFlash()};
 container.querySelector("#tnGood").onclick=()=>{rate(w,true);flashIndex=Math.min(9,flashIndex+1);revealed=false;showFlash()};
}
function quiz(){
 const mode=document.getElementById("quizMode");
 if(mode.value!=="topnouns")return false;
 const sel=document.getElementById("quizDeck");
 sel.parentElement.hidden=false;sel.disabled=false;
 sel.innerHTML=model.groups.map((g,i)=>'<option value="'+i+'">Deck '+(i+1)+' · '+esc(g.name)+'</option>').join("");
 const chosen=Math.max(0,Math.min(29,Number(sel.dataset.nounDeck||0)));sel.value=String(chosen);
 const candidates=nounBatch(chosen),now=Date.now();
 const weighted=[...candidates].sort((a,b)=>{
  const ap=study(a),bp=study(b);
  return ((bp.wrong||0)*2+((bp.due||0)<=now?1:0))-((ap.wrong||0)*2+((ap.due||0)<=now?1:0));
 });
 const pool=weighted.slice(0,Math.min(6,weighted.length));
 const w=pool[Math.floor(Math.random()*pool.length)];
 const type=Math.random()<.5?"article":"genitive";
 const right=type==="article"?w.article:model.caseForm(w,3);
 const opts=type==="article"?shuffle(["der","die","das"]):genitiveOptions(w);
 nounQuestion={w,type,right,opts};
 nounAnswered=false;
 document.getElementById("quizQuestion").textContent=type==="article"?"Which article? ___ "+w.noun+" ("+w.english+")":"Choose the correct Genitiv for: "+w.article+" "+w.noun;
 document.getElementById("quizOptions").innerHTML=opts.map((a,i)=>'<button type="button" data-index="'+i+'">'+String.fromCharCode(65+i)+') '+esc(a)+'</button>').join("");
 document.getElementById("quizFeedback").textContent="";
 document.getElementById("quizOptions").querySelectorAll("button").forEach((b,i)=>b.onclick=()=>answer(opts[i]));
 return true;
}
function answer(choice){
 if(nounAnswered||!nounQuestion)return;
 nounAnswered=true;
 const {w,right,type}=nounQuestion,correct=choice===right;
 rate(w,correct);
 const fb=document.getElementById("quizFeedback");fb.style.color=correct?"var(--good)":"var(--bad)";
 const rule=type==="article"?"Learn the article with the noun: "+w.article+" "+w.noun+".":"Genitiv: "+info(w);
 fb.innerHTML='<strong>'+(correct?"✓ Correct!":"✗ Not quite. Correct answer: "+esc(right))+'</strong><details class="smart-why"><summary>Why?</summary><div class="smart-why-body"><p>'+esc(rule)+'</p><p>Plural: '+esc(w.plural)+'</p><p>Compare: '+esc(model.caseForm(w,2))+' (Dativ) / '+esc(model.caseForm(w,3))+' (Genitiv)</p></div></details>';
 document.getElementById("quizOptions").querySelectorAll("button").forEach((b,i)=>{
  b.disabled=true;const value=nounQuestion.opts[i];
  if(value===right)b.classList.add("smart-correct");
  if(value===choice&&!correct)b.classList.add("smart-incorrect");
 });
}
function attach(){
 const flash=document.getElementById("flashMode"),selector=document.getElementById("deckSelect"),quizMode=document.getElementById("quizMode"),quizDeck=document.getElementById("quizDeck");
 flash.addEventListener("change",()=>{if(flash.value==="topnouns"){flashDeck=0;flashIndex=0;revealed=false}showFlash()});
 selector.addEventListener("change",()=>{if(flash.value==="topnouns"){flashDeck=Number(selector.value)||0;flashIndex=0;revealed=false;showFlash()}});
 quizMode.addEventListener("change",()=>{if(quizMode.value==="topnouns"){quizDeck.dataset.nounDeck="0";quiz()}else quizDeck.parentElement.hidden=quizMode.value==="grammar"});
 quizDeck.addEventListener("change",()=>{if(quizMode.value==="topnouns"){quizDeck.dataset.nounDeck=quizDeck.value;quiz()}});
 document.getElementById("nextQuestion").addEventListener("click",()=>{if(quizMode.value==="topnouns")quiz()});
 const originalFlashTab=document.querySelector('.tab[data-tab="flashcards"]');
 originalFlashTab?.addEventListener("click",()=>{if(flash.value==="topnouns")showFlash()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});else attach();
window.B2TopNounsUI=Object.freeze({renderList:showList,startQuiz:quiz,showFlash,question:()=>nounQuestion,progress:()=>progress,setDeck:i=>{deck=i},getDeck:()=>deck});
})();
