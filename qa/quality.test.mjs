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
