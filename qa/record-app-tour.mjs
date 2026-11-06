/* Real app walkthrough recording. Run only in the isolated CI browser.
 * Demonstration vocabulary is seeded in the test browser, never in the public app.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
const root=resolve(process.cwd()), out=resolve(root,"media","_tour_build");
mkdirSync(out,{recursive:true});
const contentTypes={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
const server=createServer((req,res)=>{
 let pathname=decodeURIComponent(new URL(req.url||"/","http://localhost").pathname);
 if(pathname==="/")pathname="/index.html";
 const p=resolve(root,"."+pathname);
 if(!p.startsWith(root+sep)||!existsSync(p)){res.writeHead(404);res.end();return}
 res.writeHead(200,{"Content-Type":contentTypes[extname(p)]||"application/octet-stream","Cache-Control":"no-store"});
 res.end(readFileSync(p));
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const url="http://127.0.0.1:"+server.address().port+"/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let context;
try{
 context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:"reduce",recordVideo:{dir:out,size:{width:390,height:844}}});
 const page=await context.newPage();
 const errors=[];page.on("pageerror",err=>errors.push(err.message));
 const stub='window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signInWithPassword:async()=>({error:{message:"Demo"}}),signOut:async()=>({error:null})},from:()=>({select:async()=>({data:[],error:null}),upsert:async()=>({data:[],error:null})})})};';
 await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",route=>route.fulfill({status:200,contentType:"text/javascript",body:stub}));
 await page.route("https://docs.google.com/**",r=>r.abort());
 const sample=[{id:"demo_1",german:"die Herausforderung",english:"the challenge",category:"Workplace",article:"die",example:"Diese Aufgabe ist eine große Herausforderung.",translation:"This task is a big challenge.",learned:false,bookmarked:false,difficult:false},{id:"demo_2",german:"aufstehen",english:"to get up",category:"Everyday",example:"Ich stehe jeden Morgen um sieben Uhr auf.",translation:"I get up at seven every morning.",learned:false,bookmarked:false,difficult:false}];
 await page.addInitScript(words=>{localStorage.setItem("deutschB2BerufWords_v1",JSON.stringify(words))},sample);
 await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
 await page.waitForSelector(".home-path[data-destination='verbTrainer']", {timeout:12000});
 const pause=()=>page.waitForTimeout(3100);
 const show=async(selector)=>{const node=page.locator(selector).first();if(await node.count())await node.scrollIntoViewIfNeeded({timeout:4000})};
 const tab=async(name)=>{await page.locator('.focus-nav .tab[data-tab="'+name+'"]').first().click();await page.waitForTimeout(150)};
 await show("#today .today-card");await pause();                                  // 01: home and daily study
 await show("#today .home-paths");await pause();                                 // 02: 4 learning shortcuts
 await tab("library");await show("#library #wordList");await pause();            // 03: vocabulary
 await tab("flashcards");await show("#flashcards #flashGerman");await pause();    // 04: flashcards
 const reveal=page.locator("#revealBtn");if(await reveal.isVisible())await reveal.click();
 await show("#flashcards #flashEnglish");await pause();                          // 05: recall and answer
 await tab("verbTrainer");await show("#verbTrainer .vt-card");await pause();       // 06: verbs
 const more=page.locator("#verbTrainer .vt-more summary");if(await more.count())await more.click();
 await show("#verbTrainer .vt-more");await pause();                              // 07: full conjugations / grammar
 await tab("grammarGuide");await show("#grammarGuide");await pause();            // 08: grammar
 await tab("verbTrainer");await page.locator("#vtQuiz").click();await show("#verbTrainer .vt-card");
 const answer=page.locator("#vtAnswer");if(await answer.count()){await answer.fill("gefreut");await page.locator("#vtAnswerForm button").click()}
 await pause();                                                                  // 09: quiz with feedback
 await tab("today");await show("#today .home-paths");await pause();               // 10: close with learn choices
 if(errors.length)console.log("Recording warnings:",errors.slice(0,5).join(" | "));
 const video=page.video();await page.close();await context.close();context=null;
 console.log("RECORDED_WEBM="+await video.path());
}catch(e){console.error("Tour recording error",e);process.exitCode=1}finally{
 if(context)await context.close();
 await browser.close();
 await new Promise(ok=>server.close(ok));
}