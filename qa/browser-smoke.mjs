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
  assert.match(await page.locator("#verbTrainer .vt-top").innerText(),/1 \/ 211 learned/,profile.name+": mastery persists");
  await page.locator("#vtQuiz").click();
  await page.waitForSelector("#vtAnswer");
  await page.locator("#vtAnswer").fill("incorrecttest");
  await page.locator("#vtAnswerForm button").click();
  assert.match(await page.locator("#vtFeedback").innerText(),/Correct:|✅/,profile.name+": quiz feedback");
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
  assert.ok(!jsErrors.length,profile.name+": browser JS errors: "+jsErrors.join("; "));
  console.log("PASS "+profile.name+": home shortcuts, verbs, example, next, search, progress, reload, quiz, left/right review swipes, vocabulary");
  await context.close();
 }
} catch(e){console.error(e.stack||String(e));process.exitCode=1}
finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}