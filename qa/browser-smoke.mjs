import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import assert from "node:assert/strict";
const root=resolve(process.cwd());
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};
const server=createServer((req,res)=>{
 let url=new URL(req.url||"/","http://localhost");
 let pathname=decodeURIComponent(url.pathname);
 if(pathname==="/")pathname="/index.html";
 const path=resolve(root,"."+pathname);
 if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403);res.end();return}
 if(!existsSync(path)){res.writeHead(404);res.end();return}
 const body=readFileSync(path);
 res.writeHead(200,{"Content-Type":types[extname(path)]||"application/octet-stream","Cache-Control":"no-cache"});
 res.end(body);
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const address="http://127.0.0.1:"+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const profile of [{name:"iPhone-sized",width:390,height:844},{name:"desktop",width:1280,height:900}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},reducedMotion:"reduce"});
  const page=await context.newPage();
  const jsErrors=[];
  page.on("pageerror",e=>jsErrors.push(e.message));
  const stub='window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>({error:{message:"Test only"}}),signOut:async()=>({error:null})},from:()=>({select:async()=>({data:[],error:null}),upsert:async()=>({data:[],error:null})})})};';
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",route=>route.fulfill({status:200,contentType:"text/javascript",body:stub}));
  await page.route("https://docs.google.com/**",r=>r.abort());
  await page.goto(address+"/?qa=1",{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForSelector(".home-path[data-destination='verbTrainer']",{timeout:15000});
  assert.equal(await page.locator(".home-path").count(),4,profile.name+": home cards");
  assert.equal(await page.locator("#frontAccountButton:visible").count(),1,profile.name+": account login visible in header");
  await page.locator("#frontAccountButton").click();
  assert.equal(await page.locator("#frontAccountDialog[open] #authEmail:visible").count(),1,profile.name+": real email field accessible at front");
  assert.equal(await page.locator("#frontAccountDialog[open] #signInBtn:visible").count(),1,profile.name+": existing sign-in action accessible");
  await page.locator("#frontAccountDialog .front-account-close").click();
  assert.equal(await page.locator("#frontAccountDialog[open]").count(),0,profile.name+": account popup closes");
  assert.equal(await page.locator("#frontAccountHint:visible").count(),1,profile.name+": home displays cloud login prompt");

  await page.locator(".home-path[data-destination='verbTrainer']").click();
  await page.waitForSelector("#verbTrainer:not(.hidden) .vt-card h2",{timeout:10000});
  assert.ok((await page.locator("#verbTrainer .vt-example").innerText()).trim().length>10,profile.name+": example appears");
  const before=await page.locator("#verbTrainer .vt-card h2").innerText();
  await page.locator("#vtNext").click();
  const after=await page.locator("#verbTrainer .vt-card h2").innerText();
  assert.notEqual(before,after,profile.name+": Next changes verb");
  await page.locator("#vtFilters").click();
  assert.ok(await page.locator("#vtSearch").isVisible(),profile.name+": accessible search");
  await page.locator("#vtSearch").fill("sich freuen");
  assert.match(await page.locator("#verbTrainer .vt-card h2").innerText(),/sich freuen/,profile.name+": search filters");
  await page.locator("#vtFilters").click();
  await page.locator("#vtMaster").click();
  assert.match(await page.locator("#verbTrainer .vt-top").innerText(),/1 \/ 211 learned/,profile.name+": progress saved");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator(".focus-nav .tab[data-tab='verbTrainer']").first().click();
  await page.waitForSelector("#verbTrainer:not(.hidden) .vt-top",{timeout:10000});
  assert.match(await page.locator("#verbTrainer .vt-top").innerText(),/1 \/ 211 learned/,profile.name+": mastery persists");
  await page.locator("#vtQuiz").click();
  await page.waitForSelector("#verbTrainer:not(.hidden) .smart-verb-choices button",{timeout:12000}).catch(async error=>{
    const details=await page.evaluate(()=>({active:document.querySelector('#verbTrainer')?.className,body:document.querySelector('#vtBody')?.textContent?.slice(0,350),quiz:document.querySelector('#vtQuiz')?.outerHTML}));
    throw new Error(profile.name+" verb quiz unavailable: "+JSON.stringify({details,jsErrors})+"; "+error.message);
  });
  assert.equal(await page.locator("#verbTrainer .smart-verb-choices button").count(),4,profile.name+": verb four-answer MCQ");
  await page.locator("#verbTrainer .smart-verb-choices button").first().click();
  assert.match(await page.locator("#vtFeedback").innerText(),/Correct|Not quite/,profile.name+": verb quiz feedback");
  assert.ok(await page.locator("#verbTrainer .smart-why").count(),profile.name+": verb quiz optional Why explanation");
  assert.ok(await page.locator("#vtAnother").isEnabled(),profile.name+": next question available after answer");
  await page.locator("#vtLearn").click();
  await page.locator("#vtFilters").click();
  await page.locator("#vtSearch").fill("sich freuen");
  await page.locator("#vtFilters").click();
  const simulateSwipe=async(direction)=>{
    await page.evaluate(dir=>{
      const target=document.querySelector("#verbTrainer .vt-card h2");
      if(!target)throw new Error("Study card missing");
      const x0=dir==="left"?220:100, x1=dir==="left"?100:220, y=340;
      const makeTouch=x=>new Touch({identifier:1,target,clientX:x,clientY:y,pageX:x,pageY:y,screenX:x,screenY:y});
      const beginning=makeTouch(x0),ending=makeTouch(x1);
      target.dispatchEvent(new TouchEvent("touchstart",{bubbles:true,touches:[beginning],targetTouches:[beginning],changedTouches:[beginning]}));
      target.dispatchEvent(new TouchEvent("touchend",{bubbles:true,touches:[],targetTouches:[],changedTouches:[ending]}));
    },direction);
  };
  await simulateSwipe("left");
  let data=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2VerbTrainerSeparate_v1")||"{}"));
  assert.equal(data.difficult?.length,1,profile.name+": swipe left adds Needs practice");
  assert.equal(data.mastered?.length,0,profile.name+": swipe left removes learned flag");
  await simulateSwipe("right");
  data=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2VerbTrainerSeparate_v1")||"{}"));
  assert.equal(data.mastered?.length,1,profile.name+": swipe right marks learned");
  assert.equal(data.difficult?.length,0,profile.name+": swipe right clears Needs practice");
  // Motion-enabled mode: falling animation must occur BEFORE progress changes.
  await page.emulateMedia({reducedMotion:"no-preference"});
  await simulateSwipe("left");
  const animation=await page.locator("#verbTrainer .vt-card").evaluate(card=>({
    falling:card.classList.contains("swipe-card-fall-left"),
    name:getComputedStyle(card).animationName
  }));
  assert.ok(animation.falling,profile.name+": outgoing card has fall-left class");
  assert.match(animation.name,/swipeCardFallLeft/,profile.name+": outgoing card actually animates");
  let beforeFinish=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2VerbTrainerSeparate_v1")||"{}"));
  assert.equal(beforeFinish.difficult?.length,0,profile.name+": rating waits for fall animation");
  await page.waitForTimeout(480);
  data=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2VerbTrainerSeparate_v1")||"{}"));
  assert.equal(data.difficult?.length,1,profile.name+": rating commits after the card falls");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.locator(".focus-nav .tab[data-tab='today']").first().click();
  await page.locator(".home-path[data-destination='library']").click();
  assert.ok(await page.locator("#library:not(.hidden)").count(),profile.name+": vocabulary shortcut");
  await page.locator("#focusMoreMenu summary").click();
  await page.locator('.focus-nav .tab[data-tab="spokenGerman"]').click();
  await page.waitForSelector("#spokenGerman:not(.hidden) .sg-card h3");
  assert.equal(await page.locator("#spokenGerman .sg-card .sg-example").count(),1,profile.name+": bilingual spoken German example");
  await page.locator("#sgPractice").click();
  let spoken=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2SpokenGerman_v1")||"{}"));
  assert.equal(spoken.practice?.length,1,profile.name+": spoken practice saved");
  await page.locator("#sgFilters").click();
  await page.locator("#sgSearch").fill("Quasi");
  assert.match(await page.locator("#spokenGerman .sg-card h3").innerText(),/Quasi/);
  await page.locator("#sgFilters").click();
  await page.locator("#sgLearned").click();
  spoken=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2SpokenGerman_v1")||"{}"));
  assert.ok(spoken.learned?.includes(0),profile.name+": spoken learned stored");
  await page.locator("#sgQuiz").click();
  const choice=page.locator(".sg-choices button");
  assert.equal(await choice.count(),4,profile.name+": four MCQ options");
  await choice.first().click();
  assert.ok((await page.locator(".sg-feedback").innerText()).length>3,profile.name+": instant MCQ feedback");
  await page.reload({waitUntil:"domcontentloaded"});
  spoken=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2SpokenGerman_v1")||"{}"));
  assert.ok(spoken.learned?.includes(0),profile.name+": spoken progress retained after reload");
  // Deck transfer: seed a representative two-word library in this isolated test browser.
  await page.evaluate(()=>{
    const demo=[
      {id:"demo_1",german:"die Herausforderung",english:"the challenge",learned:false,bookmarked:true,difficult:false},
      {id:"demo_2",german:"aufstehen",english:"to get up",learned:true,bookmarked:false,difficult:false}
    ];
    localStorage.setItem("deutschB2BerufWords_v1",JSON.stringify(demo));
    localStorage.removeItem("deutschB2BerufDeckOrder_v2");
  });
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#focusMoreMenu summary").click();
  await page.locator('.focus-nav .tab[data-tab="settings"]').click();
  const original=await page.evaluate(()=>({
    order:JSON.parse(localStorage.getItem("deutschB2BerufDeckOrder_v2")||"[]"),
    words:localStorage.getItem("deutschB2BerufWords_v1")
  }));
  const fakeOtherDevice={format:"deutsch-b2-deck-layout",version:1,rows:[
    {german:"aufstehen",id:"phone_23"},
    {german:"die Herausforderung",id:"phone_24"}
  ]};
  await page.locator("#deckTransferPanel .deck-manual-fallback summary").click();
  await page.locator("#deckTransferFile").setInputFiles({name:"deck-layout.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(fakeOtherDevice))});
  await page.locator("#deckTransferApply:enabled").waitFor();
  assert.match(await page.locator("#deckTransferStatus").innerText(),/2 words matched/,profile.name+": cross-device IDs matched by German text");
  await page.locator("#deckTransferApply").click();
  let order=await page.evaluate(()=>JSON.parse(localStorage.getItem("deutschB2BerufDeckOrder_v2")||"[]"));
  assert.deepEqual(order.slice(0,2),["demo_2","demo_1"],profile.name+": order applied from remote device despite different IDs");
  assert.equal(await page.evaluate(()=>localStorage.getItem("deutschB2BerufWords_v1")),original.words,profile.name+": learning records unchanged");
  await page.locator("#deckTransferUndo").click();
  order=await page.evaluate(()=>JSON.parse(localStorage.getItem("deutschB2BerufDeckOrder_v2")||"[]"));
  assert.deepEqual(order,original.order,profile.name+": undo restores old deck order");

  // Account-level cloud layout: the same user pulls server order despite differing IDs.
  const cloudState=await page.evaluate(async()=>{
    currentUser={id:"qa_same_account",email:"tester@example.com"};
    const server={id:"qa_same_account",user_metadata:{b2_deck_layout_v1:{v:1,terms:["aufstehen","die herausforderung"]}}};
    window.__qaCloudAccount=server;
    supabaseClient.auth.getUser=async()=>({data:{user:server},error:null});
    supabaseClient.auth.updateUser=async({data})=>{Object.assign(server.user_metadata,data);return {data:{user:server},error:null}};
    await window.b2DeckCloudSync({preferCloud:true});
    return {
      order:JSON.parse(localStorage.getItem("deutschB2BerufDeckOrder_v2")),
      words:localStorage.getItem("deutschB2BerufWords_v1")
    };
  });
  assert.deepEqual(cloudState.order.slice(0,2),["demo_2","demo_1"],profile.name+": account cloud deck order applies automatically");
  assert.equal(cloudState.words,original.words,profile.name+": cloud deck sync preserves vocabulary and progress");

  // Both independent split selectors must remain visible on mobile and desktop.
  await page.locator("#splitStudyToggle").click();
  assert.equal(await page.locator("#splitStudyLeft:visible").count(),1,profile.name+": left lesson selector visible");
  assert.equal(await page.locator("#splitStudyRight:visible").count(),1,profile.name+": right lesson selector visible");
  await page.locator("#splitStudyLeft").selectOption("verbTrainer");
  await page.locator("#splitStudyRight").selectOption("spokenGerman");
  assert.equal(await page.locator("#verbTrainer:not(.hidden)").count(),1,profile.name+": chosen left verb lesson displayed");
  assert.equal(await page.locator("#spokenGerman:not(.hidden)").count(),1,profile.name+": chosen right spoken lesson displayed");
  const sides=await page.evaluate(()=>[document.querySelector("#verbTrainer").dataset.splitSide,document.querySelector("#spokenGerman").dataset.splitSide]);
  assert.deepEqual(sides,["left","right"],profile.name+": independent pane order maintained");
  await page.locator("#splitStudyToggle").click();
  assert.equal(await page.locator("main.split-study").count(),0,profile.name+": split mode exits cleanly");
  // Smart grammar mode is an option inside the EXISTING quiz, not a new screen.
  await page.locator("#focusMoreMenu summary").click();
  await page.locator(".focus-nav .tab[data-tab='quiz']").click();
  await page.locator("#quizMode").selectOption("grammar");
  assert.ok(await page.locator("#quizQuestion").innerText(),profile.name+": grammar question visible");
  assert.equal(await page.locator("#quizOptions button").count(),4,profile.name+": four grammar choices");
  const current=await page.evaluate(()=>{
    const prompt=document.getElementById("quizQuestion").textContent;
    const rule=window.B2SmartGrammar.rules.find(x=>x.prompt===prompt);
    if(!rule)throw new Error("No grammar rule matches prompt");
    return {id:rule.id,correct:rule.correct,wrong:rule.options.find(x=>x!==rule.correct)};
  });
  const clickChoice=async(choice)=>{
    await page.evaluate(expected=>{
      const btn=[...document.querySelectorAll("#quizOptions button")].find(b=>b.textContent.slice(3).trim()===expected);
      if(!btn)throw new Error("No exact answer choice: "+expected);
      btn.click();
    },choice);
  };
  await clickChoice(current.wrong);
  assert.match(await page.locator("#quizFeedback").innerText(),/Not quite/,profile.name+": wrong grammar answer is rejected");
  assert.ok(await page.locator("#quizFeedback .smart-why").count(),profile.name+": Why disclosed on demand");
  await page.locator("#quizFeedback .smart-why summary").click();
  assert.match(await page.locator("#quizFeedback .smart-why").innerText(),/Why the other options are wrong/,profile.name+": explanations provided");
  const mistake=await page.evaluate(id=>JSON.parse(localStorage.getItem("b2GrammarConceptMistakes_v1")||"{}")[id],current.id);
  assert.equal(mistake.wrong,1,profile.name+": incorrect concept remembered");
  await page.locator("#nextQuestion").click();
  const correct=await page.evaluate(()=>{
    const prompt=document.getElementById("quizQuestion").textContent;
    return window.B2SmartGrammar.rules.find(x=>x.prompt===prompt)?.correct;
  });
  assert.ok(correct,profile.name+": second grammar question exists");
  await clickChoice(correct);
  assert.match(await page.locator("#quizFeedback").innerText(),/Correct/,profile.name+": correct grammar answer accepted");
  assert.match(await page.locator("#score").innerText(),/1 correct \/ 2 answered/,profile.name+": scores reflect one right and one wrong");
  // Audit Genitiv in the live article/case builder across all four genders.
  await page.locator('.focus-nav .tab[data-tab="grammarGuide"]').click();
  await page.waitForSelector("#bhBuildResult");
  const genCases=[
    ["m","des Chefs","eines Chefs","keines Chefs","meines Chefs"],
    ["f","der Firma","einer Firma","keiner Firma","meiner Firma"],
    ["n","des Teams","eines Teams","keines Teams","meines Teams"],
    ["p","der Kollegen","(no ein-plural)","keiner Kollegen","meiner Kollegen"]
  ];
  for(const [gender,...expected] of genCases){
    await page.locator("#bhGender").selectOption(gender);
    await page.locator("#bhCase").selectOption("3");
    for(const [index,family] of ["definite","indefinite","negative","possessive"].entries()){
      await page.locator("#bhFamily").selectOption(family);
      assert.equal((await page.locator("#bhBuildResult strong").innerText()).trim(),expected[index],profile.name+": Genitiv "+gender+" "+family);
    }
  }
  await page.locator("#bhGender").selectOption("n");
  await page.locator("#bhFamily").selectOption("definite");
  await page.locator("#bhCase").selectOption("0");
  assert.equal((await page.locator("#bhBuildResult strong").innerText()).trim(),"das Team",profile.name+": neuter Nominativ unchanged");
  await page.locator("#bhCase").selectOption("2");
  assert.equal((await page.locator("#bhBuildResult strong").innerText()).trim(),"dem Team",profile.name+": neuter Dativ unchanged");
  // The original offline checker must correct BOTH article and noun ending.
  await page.evaluate(()=>document.querySelector('.focus-nav .tab[data-tab="grammarTrainer"]').click());
  await page.locator("#grammarInput").fill("Wegen dem Team findet das Meeting später statt.");
  await page.waitForTimeout(430);
  assert.match(await page.locator("#liveGrammarResults").innerText(),/wegen des Teams/i,profile.name+": offline checker fixes Genitiv noun suffix");
  await page.locator("#grammarInput").fill("Ich spreche mit den Kollege.");
  await page.waitForTimeout(430);
  assert.match(await page.locator("#liveGrammarResults").innerText(),/mit dem Kollegen/i,profile.name+": offline checker fixes weak-noun Dativ ending");
  // Top nouns stay inside existing Vocabulary / Flashcards / Quiz, with separate saved progress.
  await page.evaluate(()=>document.querySelector('.tab[data-tab="library"]').click());
  await page.locator("#filter").selectOption("topnouns");
  assert.equal(await page.locator(".tn-noun").count(),10,profile.name+": noun deck displays ten nouns");
  assert.match(await page.locator(".tn-noun").first().innerText(),/der Chef[\s\S]*Chefs/,profile.name+": correct article plural and Genitiv");
  await page.locator("#v4VocabNext").click();
  assert.match(await page.locator(".tn-header").innerText(),/Deck 2 \/ 30/,profile.name+": noun deck next");
  await page.locator("#v4VocabSelect").selectOption("0");
  assert.match(await page.locator(".tn-header").innerText(),/Deck 1 \/ 30/,profile.name+": noun deck select");
  await page.locator("#tnFlash").click();
  assert.ok(await page.locator("#tnFlashPanel:visible").count(),profile.name+": noun flashcards appear");
  assert.match(await page.locator("#tnFlashPanel h2").innerText(),/^___ /,profile.name+": initial noun article hidden");
  await page.locator("#tnReveal").click();
  assert.match(await page.locator("#tnFlashPanel h2").innerText(),/^(der|die|das) /,profile.name+": article revealed");
  await page.locator("#tnGood").click();
  assert.equal(await page.evaluate(()=>Object.values(window.B2TopNounsUI.progress()).filter(x=>x.correct>0).length),1,profile.name+": noun progress tracked separately");
  await page.evaluate(()=>document.querySelector('.tab[data-tab="quiz"]').click());
  await page.locator("#quizMode").selectOption("topnouns");
  assert.ok(await page.locator("#quizOptions button").count()>=3,profile.name+": noun article/case options visible");
  let currentNoun=await page.evaluate(()=>window.B2TopNounsUI.question());
  assert.ok(currentNoun?.right,profile.name+": noun quiz exact answer set");
  await page.evaluate(answer=>{
    const q=window.B2TopNounsUI.question();
    const btn=[...document.querySelectorAll("#quizOptions button")].find(b=>b.textContent.slice(3).trim()===answer);
    if(!btn)throw new Error("Noun quiz answer absent");
    btn.click();
  },currentNoun.right);
  assert.match(await page.locator("#quizFeedback").innerText(),/Correct/,profile.name+": noun MCQ exact correct answer");
  await page.locator("#nextQuestion").click();
  assert.ok(await page.locator("#quizOptions button").count()>=3,profile.name+": next noun question");
  await page.evaluate(()=>{
    const q=window.B2TopNounsUI.question();
    const wrong=q.opts.find(x=>x!==q.right);
    const btn=[...document.querySelectorAll("#quizOptions button")].find(b=>b.textContent.slice(3).trim()===wrong);
    if(!btn)throw new Error("Noun quiz distractor absent");
    btn.click();
  });
  assert.match(await page.locator("#quizFeedback").innerText(),/Not quite/,profile.name+": wrong noun case rejected");
  assert.ok(await page.locator("#quizFeedback .smart-why").count(),profile.name+": noun grammar why explanation");
  await page.reload({waitUntil:"domcontentloaded"});
  const savedNouns=await page.evaluate(()=>JSON.parse(localStorage.getItem("b2TopNounsProgress_v90")||"{}"));
  assert.ok(Object.keys(savedNouns).length>0,profile.name+": noun progress survives reload");
  assert.ok(!jsErrors.length,profile.name+": browser JS errors: "+jsErrors.join("; "));
  console.log("PASS "+profile.name+": home shortcuts, verbs, example, next, search, progress, reload, quiz, left/right review swipes, vocabulary, spoken German, deck transfer & undo");
  await context.close();
 }
} catch(e){console.error(e.stack||String(e));process.exitCode=1}
finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}