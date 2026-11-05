/* B2 Grammar Handbook 4.1 */
(function(){
'use strict';
const data=window.B2_GRAMMAR_COMPLETE,root=document.getElementById('grammarGuide');
if(!data||!root)return;
const {sections,tables,lessons}=data;
const KEY='b2GrammarHandbookProgress_v41',BK='b2GrammarHandbookBookmarks_v41',LAST='b2GrammarHandbookLast_v41';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch(e){return f}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scores=read(KEY,{}),bookmarks=read(BK,[]);
const articles={definite:{m:['der','den','dem','des'],f:['die','die','der','der'],n:['das','das','dem','des'],p:['die','die','den','der']},indefinite:{m:['ein','einen','einem','eines'],f:['eine','eine','einer','einer'],n:['ein','ein','einem','eines'],p:['—','—','—','—']},negative:{m:['kein','keinen','keinem','keines'],f:['keine','keine','keiner','keiner'],n:['kein','kein','keinem','keines'],p:['keine','keine','keinen','keiner']},possessive:{m:['mein','meinen','meinem','meines'],f:['meine','meine','meiner','meiner'],n:['mein','mein','meinem','meines'],p:['meine','meine','meinen','meiner']}};
const noun={m:'Chef',f:'Firma',n:'Team',p:'Kollegen'},cases=['Nominativ','Akkusativ','Dativ','Genitiv'];
let section='all',search='',savedOnly=false,active=read(LAST,lessons[0].id),locked=false,choice='definite',gender='m',caseIndex=0;
if(!lessons.some(l=>l.id===active))active=lessons[0].id;
const current=()=>lessons.find(l=>l.id===active)||lessons[0];
const stats=l=>scores[l.id]||{right:0,wrong:0};
const studied=()=>lessons.filter(l=>stats(l).right>0).length;
const make=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e};
const persist=()=>{store(KEY,scores);store(BK,bookmarks);store(LAST,active)};
function counts(){
 document.getElementById('bhTotal').textContent=lessons.length;
 document.getElementById('bhDone').textContent=studied();
 document.getElementById('bhRight').textContent=lessons.reduce((s,l)=>s+stats(l).right,0);
}
function mount(){
 root.innerHTML='<div class="v4-hero"><div class="b2-eyebrow">A1–B2 Beruf · full grammar handbook</div><h2>📘 Grammar Made Easy</h2><p>Study complete grammar tables, learn how to recognise sentence patterns, remember the rule, and test yourself.</p><div class="bh-stats"><span><b id="bhTotal">0</b> rules</span><span><b id="bhDone">0</b> practised</span><span><b id="bhRight">0</b> correct answers</span></div></div><div class="bh-layout"><aside class="bh-sidebar"><label for="bhSearch">Search for a grammar rule</label><input id="bhSearch" type="search" placeholder="der, dativ, kein, reflexiv, je desto"><div class="bh-filter-row"><button id="bhAll">All lessons</button><button id="bhSaved">★ Bookmarks</button></div><div class="bh-section-list" id="bhSections"></div><p class="b2-muted" id="bhMatchCount"></p><div class="bh-lesson-list" id="bhTopics"></div></aside><div class="bh-workspace" id="bhWorkspace"></div></div>';
 document.getElementById('bhSearch').oninput=e=>{search=e.target.value.trim().toLocaleLowerCase('de-DE');menu()};
 document.getElementById('bhAll').onclick=()=>{savedOnly=false;menu()};
 document.getElementById('bhSaved').onclick=()=>{savedOnly=true;menu()};
 menu();lesson();counts();
}
function menu(){
 const sect=document.getElementById('bhSections'),list=document.getElementById('bhTopics');sect.replaceChildren();list.replaceChildren();
 const cats=[['all','◈','All topics'],...sections];
 cats.forEach(s=>{const btn=make('button',s[1]+' · '+s[2],'bh-section'+(section===s[0]?' active':''));btn.onclick=()=>{section=s[0];menu()};sect.append(btn)});
 const found=lessons.filter(l=>(section==='all'||section===l.section)&&(!savedOnly||bookmarks.includes(l.id))&&(!search||[l.title,l.when,l.pattern,l.decision,l.hook].join(' ').toLocaleLowerCase('de-DE').includes(search)));
 document.getElementById('bhMatchCount').textContent=found.length+' matching lessons';
 document.getElementById('bhAll').classList.toggle('active',!savedOnly);document.getElementById('bhSaved').classList.toggle('active',savedOnly);
 found.forEach(l=>{const btn=make('button',undefined,'bh-topic'+(active===l.id?' active':''));btn.innerHTML='<span>'+esc(l.title)+'</span><small>'+esc(l.level)+' · '+(stats(l).right?'✓ Practised':bookmarks.includes(l.id)?'★ Saved':'Learn')+'</small>';btn.onclick=()=>navigate(l.id,true);list.append(btn)});
 if(!found.length)list.append(make('p','No matches. Clear the search or select another section.','b2-muted'));
}
function navigate(id,scroll){active=id;locked=false;persist();menu();lesson();if(scroll&&window.matchMedia('(max-width:820px)').matches)document.getElementById('bhWorkspace').scrollIntoView({behavior:'smooth'})}
function table(key){
 const t=tables[key];if(!t)return '';
 return '<div class="bh-table-scroll" role="region" tabindex="0" aria-label="'+esc(t.title)+'"><table class="bh-table"><thead><tr>'+t.head.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+t.rows.map(row=>'<tr>'+row.map((cell,i)=>i?'<td>'+esc(cell)+'</td>':'<th scope="row">'+esc(cell)+'</th>').join('')+'</tr>').join('')+'</tbody></table></div><div class="bh-table-tip"><strong>Memory rule:</strong> '+esc(t.note)+'</div>';
}
function lesson(){
 const l=current(),pos=lessons.findIndex(t=>t.id===l.id),group=sections.find(s=>s[0]===l.section);
 const w=document.getElementById('bhWorkspace');
 w.innerHTML='<div class="bh-lesson-meta"><span>'+esc(group?.[2]||l.section)+' · '+esc(l.level)+'</span><span>Rule '+(pos+1)+' of '+lessons.length+'</span></div><h2>'+esc(l.title)+'</h2>'+
 '<div class="bh-two"><div class="bh-panel"><h3>1. When is this used?</h3><p>'+esc(l.when)+'</p></div><div class="bh-panel"><h3>2. How do I choose?</h3><p>'+esc(l.decision)+'</p></div></div>'+
 '<div class="bh-pattern"><h3>3. Sentence structure / formula</h3><p>'+esc(l.pattern)+'</p><button id="bhCopy">Copy formula</button></div>'+
 '<div class="bh-memory"><h3>🧠 4. Easy memory trick</h3><p>'+esc(l.hook)+'</p></div>'+
 '<div class="bh-reference"><h3>5. Complete reference table</h3>'+table(l.table)+'</div>'+
 '<div class="bh-reference"><h3>6. Examples with English meaning</h3>'+l.examples.map(e=>'<div class="bh-example"><b lang="de">'+esc(e[0])+'</b><span>'+esc(e[1])+'</span></div>').join('')+'</div>'+
 '<div class="bh-warning"><h3>⚠️ Common mistake</h3><p>'+esc(l.mistake)+'</p></div>'+
 '<div class="bh-practice"><h3>7. Check your memory</h3><p class="bh-question">'+esc(l.quiz.question)+'</p><div class="bh-choices" id="bhChoices"></div><p id="bhFeedback" aria-live="polite"></p><button id="bhAgain" class="hidden">Another attempt</button></div>'+
 '<div class="bh-reference"><h3>8. Article / case builder</h3><p>Change article, noun gender and case to compare all endings. The case must be determined by the sentence role or preposition.</p><div id="bhBuilder"></div></div>'+
 '<div class="bh-footer"><button id="bhPrev">← Previous</button><button id="bhBookmark">'+(bookmarks.includes(l.id)?'★ Saved':'☆ Save rule')+'</button><button id="bhNext">Next →</button></div>';
 document.getElementById('bhCopy').onclick=()=>{const text=l.title+'\n'+l.pattern+'\nMemory trick: '+l.hook;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>document.getElementById('bhCopy').textContent='Copied ✓',()=>document.getElementById('bhCopy').textContent='Copy unavailable');else document.getElementById('bhCopy').textContent='Copy unavailable'};
 document.getElementById('bhPrev').disabled=pos===0;document.getElementById('bhNext').disabled=pos===lessons.length-1;
 document.getElementById('bhPrev').onclick=()=>navigate(lessons[pos-1].id);
 document.getElementById('bhNext').onclick=()=>navigate(lessons[pos+1].id);
 document.getElementById('bhBookmark').onclick=()=>{const i=bookmarks.indexOf(l.id);if(i<0)bookmarks.push(l.id);else bookmarks.splice(i,1);persist();menu();document.getElementById('bhBookmark').textContent=bookmarks.includes(l.id)?'★ Saved':'☆ Save rule'};
 quiz();builder();
}
function quiz(){
 const l=current(),q=l.quiz,rec=stats(l),opts=[q.correct,...q.wrong],seed=Number(l.id.slice(1))*7+rec.right*3+rec.wrong*5,rot=seed%opts.length;
 let ordered=[...opts.slice(rot),...opts.slice(0,rot)];if(seed%2)ordered.reverse();
 const el=document.getElementById('bhChoices'),fb=document.getElementById('bhFeedback');el.replaceChildren();fb.textContent='';locked=false;
 ordered.forEach(answer=>{
  const btn=make('button',answer);btn.onclick=()=>{
   if(locked)return;
   const row=scores[l.id]||{right:0,wrong:0};
   if(answer===q.correct){locked=true;row.right++;btn.classList.add('right');el.querySelectorAll('button').forEach(b=>b.disabled=true);fb.innerHTML='<strong>✓ Correct!</strong> '+esc(q.why||l.hook);document.getElementById('bhAgain').classList.remove('hidden');menu();}
   else{row.wrong++;btn.classList.add('wrong');btn.disabled=true;fb.innerHTML='<strong>Try again.</strong> '+esc(q.why||l.hook)}
   scores[l.id]=row;persist();counts();
  };el.append(btn);
 });
 document.getElementById('bhAgain').onclick=quiz;
}
function builder(){
 const area=document.getElementById('bhBuilder');
 area.innerHTML='<div class="bh-builder-grid"><label>Article family<select id="bhFamily"><option value="definite">der / die / das</option><option value="indefinite">ein / eine / ein</option><option value="negative">kein / keine</option><option value="possessive">mein / meine</option></select></label><label>Gender or number<select id="bhGender"><option value="m">Masculine · Chef</option><option value="f">Feminine · Firma</option><option value="n">Neuter · Team</option><option value="p">Plural · Kollegen</option></select></label><label>Case<select id="bhCase"><option value="0">Nominativ</option><option value="1">Akkusativ</option><option value="2">Dativ</option><option value="3">Genitiv</option></select></label></div><div class="bh-builder-result" id="bhBuildResult"></div><div class="bh-case-row" id="bhCaseRow"></div><p class="b2-muted">This demonstrates article forms. Noun endings and natural sentence context also matter (e.g. des Chefs).</p>';
 const f=document.getElementById('bhFamily'),g=document.getElementById('bhGender'),c=document.getElementById('bhCase');
 f.value=choice;g.value=gender;c.value=String(caseIndex);
 const update=()=>{
  choice=f.value;gender=g.value;caseIndex=Number(c.value);
  const article=articles[choice][gender][caseIndex],word=noun[gender],printed=gender==='m'&&caseIndex===3?word+'s':word;
  document.getElementById('bhBuildResult').innerHTML='<span>'+esc(cases[caseIndex])+'</span><strong>'+esc(article==='—'?'(no ein-plural)':article+' '+printed)+'</strong>';
  const row=document.getElementById('bhCaseRow');row.replaceChildren();
  for(let i=0;i<4;i++){const b=make('button',cases[i].slice(0,3)+' · '+articles[choice][gender][i],caseIndex===i?'active':'');b.onclick=()=>{c.value=i;update()};row.append(b)}
 };
 [f,g,c].forEach(x=>x.onchange=update);update();
}
mount();
window.B2_GrammarHandbook={lessonCount:lessons.length,open:(term)=>{document.querySelector('button.tab[data-tab="grammarGuide"]')?.click();const input=document.getElementById('bhSearch');input.value=term||'';search=input.value.toLocaleLowerCase('de-DE');menu()}};
})();