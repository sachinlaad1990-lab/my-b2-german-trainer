import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=(file)=>readFileSync(new URL(file,root),'utf8');
const index=source('index.html');
const trainer=source('verb-trainer-v51.js');
const exampleSource=source('verb-examples-v53.js');
const ctx={window:{}};
vm.runInNewContext(exampleSource,ctx,{timeout:1500});
const examples=ctx.window.B2_VERB_EXAMPLES;
const dataPrefix=trainer.slice(trainer.indexOf('const records='),trainer.indexOf('const section=document.getElementById("verbTrainer");'));
assert.ok(dataPrefix.length>2000,'Verb source is available');
const words=vm.runInNewContext(dataPrefix+'\nrecords.map(v=>JSON.parse(JSON.stringify(v)))', {window:{B2_VERB_EXAMPLES:examples}},{timeout:3000});
const nameMap=new Map(words.map(v=>[v.name,v]));
test('verb dataset is complete and examples are bilingual',()=>{
  assert.equal(words.length,211,'211 curated verbs present');
  assert.equal(nameMap.size,words.length,'no duplicate verbs');
  assert.equal(Object.keys(examples).length,words.length,'example count');
  for(const v of words){
    assert.equal(v.forms.length,6,v.name+' has six Präsens forms');
    assert.ok(v.forms.every(x=>typeof x==='string'&&x.trim()),v.name+' has nonempty conjugations');
    assert.ok(v.past&&v.partizip,'past forms for '+v.name);
    assert.ok(['haben','sein'].includes(v.aux),'auxiliary for '+v.name);
    assert.ok(examples[v.name]?.de?.length>8,'German example for '+v.name);
    assert.ok(examples[v.name]?.en?.length>6,'English example for '+v.name);
    assert.ok(v.grammar&&v.english,'grammar and translation for '+v.name);
  }
});
test('regression test tricky German conjugations',()=>{
  const expected={
   'vorbereiten':['bereite vor','bereitest vor','bereitet vor','bereiten vor','bereitet vor','bereiten vor'],
   'warten':['warte','wartest','wartet','warten','wartet','warten'],
   'sich freuen':['freue mich','freust dich','freut sich','freuen uns','freut euch','freuen sich'],
   'sein':['bin','bist','ist','sind','seid','sind'],
   'haben':['habe','hast','hat','haben','habt','haben'],
   'werden':['werde','wirst','wird','werden','werdet','werden'],
   'können':['kann','kannst','kann','können','könnt','können'],
   'nehmen':['nehme','nimmst','nimmt','nehmen','nehmt','nehmen'],
   'geben':['gebe','gibst','gibt','geben','gebt','geben'],
   'sich bewerben':['bewerbe mich','bewirbst dich','bewirbt sich','bewerben uns','bewerbt euch','bewerben sich'],
   'anfangen':['fange an','fängst an','fängt an','fangen an','fangt an','fangen an']
  };
  for(const [name,forms] of Object.entries(expected)){
    const actual=nameMap.get(name);
    if(name==='anfangen'&&!actual)continue;
    assert.ok(actual,'has '+name);
    assert.deepEqual(Array.from(actual.forms),forms,name);
  }
  assert.equal(nameMap.get('ausziehen').aux,'sein','moving out uses sein');
  assert.equal(nameMap.get('sich ausziehen').aux,'haben','getting undressed uses haben');
  assert.equal(nameMap.get('steigen').partizip,'gestiegen');
  assert.equal(nameMap.get('sich ergeben').past,'ergab sich');
});
test('home cards route to real existing tabs',()=>{
 const tiles=[...index.matchAll(/class="home-path" data-destination="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(tiles,['library','verbTrainer','grammarGuide','quiz']);
 for(const tab of tiles){
  assert.match(index,new RegExp('id="'+tab+'" class="view'));
  assert.match(index,new RegExp('data-tab="'+tab+'"'));
 }
 assert.match(source('release-v60.js'),/data-destination/);
 assert.match(source('release-v60.js'),/tab\.click\(\)/);
});
test('existing vocabulary, account and progress storage remains intact',()=>{
 assert.match(index,/deutschB2BerufWords_v1/);
 assert.match(index,/deutschB2Appearance_v1/);
 assert.match(trainer,/b2VerbTrainerSeparate_v1/);
 assert.match(index,/supabase\.createClient/);
 assert.match(index,/GOOGLE_SHEET_CSV_URL/);
 assert.match(index,/id="exportBtn"/);
 assert.match(index,/id="releaseExportBtn"/);
 assert.match(source('release-v60.js'),/exporter\.click\(\)/);
});
test('no duplicate static element IDs and all local assets present',()=>{
 const markup=index.slice(0,index.indexOf('<script src="mnemonic-engine'));
 const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,'unique static IDs');
 const assets=[...index.matchAll(/(?:src|href)="([^"]+)"/g)].map(x=>x[1]).filter(x=>!x.startsWith('http')&&!x.startsWith('data:')&&!x.startsWith('#')&&!x.startsWith('mailto:')).map(x=>x.split('?')[0]);
 for(const asset of assets)assert.ok(existsSync(new URL(asset,root)),'Referenced file exists: '+asset);
});
test('app modules and inline JavaScript all parse',()=>{
 for(const file of ['verb-trainer-v51.js','verb-examples-v53.js','release-v60.js','ui-enhancements-v55.js','v4.js','grammar-handbook-ui.js','grammar-data-v4.js','split-study-v49.js','swipe-navigation-v44.js']){
   assert.doesNotThrow(()=>new vm.Script(source(file),{filename:file}),file);
 }
 for(const m of index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
   if(m[1].trim())assert.doesNotThrow(()=>new vm.Script(m[1]),'inline JS');
 }
});
test('mobile and accessibility design protection',()=>{
 const css=source('design-system-v55.css')+'\n'+source('home-shortcuts-v56.css');
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/body\[data-theme="dark"\]/);
 assert.match(index,/id="appearanceTheme"/);
 assert.match(index,/id="homePathsHeading"/);
 assert.match(index,/name="viewport"/);
 assert.match(index,/name="description"/);
 assert.match(index,/id="todayAnswer"[^>]*aria-live/);
 assert.match(source('ui-enhancements-v55.js'),/Skip to learning content/);
});
test('web app install assets valid and no fake paid state',()=>{
 const manifest=JSON.parse(source('manifest.webmanifest'));
 assert.equal(manifest.display,'standalone');
 assert.ok(manifest.icons.length);
 for(const icon of manifest.icons)assert.ok(existsSync(new URL(icon.src,root)));
 assert.ok(!index.includes('Premium activated successfully'));
 assert.ok(!index.includes('68% progress'));
});

test('spoken German is separate, complete, and appropriately labeled',()=>{
 const module=source('spoken-german-v67.js');
 const match=module.match(/const entries=("(?:\\.|[^"\\])*")\.trim\(\)\.split\("\\n"\)/);
 assert.ok(match,'spoken entries are encoded as data');
 const rows=JSON.parse(match[1]).trim().split('\n').map(line=>line.split('|'));
 assert.equal(rows.length,115,'100 expressions and 15 ready-to-use phrases');
 assert.equal(new Set(rows.map(r=>r[0])).size,115,'no repeated German expressions');
 assert.equal(rows.filter(r=>r[5]==='Useful phrases').length,15,'15 ready-to-use phrases');
 assert.ok(rows.every(r=>r.length===6&&r[0]&&r[1]&&r[2].length>8&&r[3].length>8),'all entries include meaning and bilingual example');
 assert.ok(rows.every(r=>['safe','informal','strong'].includes(r[4])),'register labels valid');
 assert.equal(rows.filter(r=>r[4]==='strong').length,2,'rude expressions are labeled');
 assert.ok(rows.some(r=>r[0]==='Jemandem einen Korb geben'),'formatting typo corrected');
 assert.match(index,/id="spokenGerman" class="view hidden"/);
 assert.match(index,/data-tab="spokenGerman"/);
 assert.match(index,/spoken-german-v67\.css/);
 assert.match(index,/spoken-german-v67\.js/);
 assert.match(module,/b2SpokenGerman_v1/);
 assert.match(source('spoken-german-v67.css'),/prefers-reduced-motion/);
 assert.doesNotThrow(()=>new vm.Script(module));
});

test('device passkey login is optional and does not store biometrics',()=>{
 const js=source('passkey-login-v74.js');
 assert.match(index,/experimental: \{ passkey: true \}/);
 assert.match(index,/id="signInPasskeyBtn"/);
 assert.match(index,/id="registerPasskeyBtn"/);
 assert.match(index,/passkey-login-v74\.js/);
 assert.match(js,/signInWithPasskey\(\)/);
 assert.match(js,/registerPasskey\(\)/);
 assert.match(js,/window\.isSecureContext/);
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.ok(!js.includes('localStorage.setItem'),'Biometrics are never saved in local storage');
});

test('contextual grammar examples have one exact answer and explanations for all distractors',()=>{
 const sandbox={window:{},localStorage:{getItem:()=>null,setItem:()=>{}},Date,Math};
 vm.runInNewContext(source('smart-grammar-v80.js'),sandbox,{timeout:3000});
 const g=sandbox.window.B2SmartGrammar;
 assert.equal(g.rules.length,19);
 const kinds=new Set(g.rules.map(r=>r.type));
 for(const kind of ['case-dative','case-accusative','double-object','fixed-preposition','nominalized-adjective','n-declension','adjective-declension','word-order','comparative'])
   assert.ok(kinds.has(kind),'Grammar category included: '+kind);
 for(const r of g.rules){
   assert.equal(r.options.length,4,r.id+' has four options');
   assert.equal(new Set(r.options).size,4,r.id+' has unique options');
   assert.equal(r.options.filter(v=>v===r.correct).length,1,r.id+' has one correct choice');
   assert.ok(r.example.length>12&&r.rule.length>15,r.id+' explained with authentic example');
   assert.ok(r.options.filter(v=>v!==r.correct).every(v=>r.reasons[v]),r.id+' gives a reason for every distractor');
   assert.equal(g.shuffledOptions(r,()=>.73).filter(x=>x===r.correct).length,1,r.id+' retains correct choice after shuffle');
   assert.match(g.whyHTML(r,r.options.find(x=>x!==r.correct)),/Why the other options are wrong/,r.id+' explains all alternatives');
   assert.match(g.whyHTML(r,r.correct),/Correct:/,r.id+' explains correct answer');
 }
 for(const [word,id] of [['helfen','helfen'],['anrufen','anrufen'],['sprechen mit','sprechen mit'],['warten auf','warten auf'],['der Vorgesetzte','vorgesetzte'],['der Angestellte','angestellte'],['der Arbeitslose','arbeitslose'],['der Bekannte','bekannte'],['der Deutsche','deutsche']]){
  assert.equal(g.forWord(word)?.id,id,'contextual label: '+word);
 }
 assert.equal(g.forWord('das Auto'),null,'no grammar hint for unrelated word');
 assert.match(index,/value="grammar">Grammar in context/,'grammar MCQs integrated into current quiz');
 assert.match(index,/smart-grammar-v80\.js/);
 assert.match(index,/smart-grammar-v80-ui\.js/);
 assert.match(index,/smart-grammar-v80\.css/);
 for(const path of ['smart-grammar-v80.js','smart-grammar-v80-ui.js'])
   assert.doesNotThrow(()=>new vm.Script(source(path),{filename:path}));
});
test('grammar mistake tracking prioritizes difficult concepts and does not corrupt other progress',()=>{
 const values={};
 const store={getItem:k=>values[k]||null,setItem:(k,v)=>{values[k]=String(v)}};
 const sandbox={window:{},localStorage:store,Date,Math};
 vm.runInNewContext(source('smart-grammar-v80.js'),sandbox,{timeout:3000});
 const g=sandbox.window.B2SmartGrammar;
 assert.equal(g.choose([g.byId('helfen'),g.byId('anrufen')],()=>.4).id,'helfen');
 g.record('helfen',false);g.record('helfen',false);g.record('helfen',false);
 assert.equal(g.mistakes().helfen.wrong,3);
 assert.equal(g.choose([g.byId('helfen'),g.byId('anrufen')],()=>.4).id,'helfen','difficult concept receives higher probability');
 g.record('helfen',true);
 assert.equal(g.mistakes().helfen.wrong,2,'correct answer reduces mistake weight');
 assert.equal(Object.keys(values).length,1,'only grammar-specific progress key is saved');
});

test('grammar handbook: every lesson and quiz has a valid unique answer',()=>{
 const env={window:{}};
 vm.runInNewContext(source('grammar-data-v4.js'),env,{timeout:5000});
 const {sections,tables,lessons}=env.window.B2_GRAMMAR_COMPLETE;
 assert.ok(lessons.length>=60,"comprehensive handbook lessons");
 assert.equal(new Set(lessons.map(x=>x.id)).size,lessons.length,"unique lesson IDs");
 for(const lesson of lessons){
   assert.ok(sections.some(x=>x[0]===lesson.section),lesson.id+" section exists");
   assert.ok(tables[lesson.table],lesson.id+" reference table exists");
   assert.ok(lesson.examples.length>=1,lesson.id+" natural examples");
   assert.ok(lesson.quiz?.correct,lesson.id+" quiz answer exists");
   const choices=[lesson.quiz.correct,...lesson.quiz.wrong];
   assert.equal(choices.length,4,lesson.id+" four MCQ choices");
   assert.equal(new Set(choices).size,4,lesson.id+" only one correct answer");
   assert.ok(lesson.quiz.why,lesson.id+" provides an explanation");
 }
 for(const [key,table] of Object.entries(tables)){
   assert.ok(table.head.length>=2,key+" table headers present");
   assert.ok(table.rows.length>=1,key+" table rows present");
   for(const [i,row] of table.rows.entries())
     assert.equal(row.length,table.head.length,key+" row "+i+" matches header count");
 }
});
test('Genitiv reference tables and weak noun exceptions stay consistent',()=>{
 const env={window:{}};
 vm.runInNewContext(source('grammar-data-v4.js'),env,{timeout:5000});
 const tables=env.window.B2_GRAMMAR_COMPLETE.tables;
 const lookup=(name)=>tables[name]?.rows.find(r=>r[0]==='Genitiv')||null;
 const defs=lookup('articles');
 const indef=lookup('ein');
 const negative=lookup('kein');
 const possessive=lookup('poss');
 assert.deepEqual(Array.from(defs.slice(1)),['des (+s noun)','der','des (+s noun)','der']);
 assert.deepEqual(Array.from(indef.slice(1)),['eines','einer','eines','—']);
 assert.deepEqual(Array.from(negative.slice(1)),['keines','keiner','keines','keiner']);
 assert.deepEqual(Array.from(possessive.slice(1)),['meines','meiner','meines','meiner']);
 const joined=JSON.stringify(env.window.B2_GRAMMAR_COMPLETE);
 for(const word of ['des Kollegen','des Kunden','des Chefs','des Problems'])
   assert.ok(joined.includes(word),word+" documented");
 assert.match(source('grammar-handbook-ui.js'),/n:\['Team','Team','Team','Teams'\]/);
 assert.match(source('grammar-handbook-ui.js'),/printed=caseNoun\(gender,caseIndex\)/);
 assert.ok(!source('index.html').includes("m.replace(/\\bdem\\b/i,'des')"),"no article-only Genitiv correction");
});
