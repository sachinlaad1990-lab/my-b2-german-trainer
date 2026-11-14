// Dedicated exam navigation regression checks, desktop and mobile, including numbered progress.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import assert from "node:assert/strict";

const root=resolve(process.cwd());
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml"};
const server=createServer((req,res)=>{
  const path=resolve(root,"."+decodeURIComponent(new URL(req.url||"/","http://localhost").pathname));
  if((!path.startsWith(root+sep)&&path!==root)||!existsSync(path)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"Content-Type":mime[extname(path)]||"application/octet-stream"});
  res.end(readFileSync(path));
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));
const base="http://127.0.0.1:"+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const profile of [{name:"desktop",width:1300,height:900},{name:"mobile",width:390,height:844}]){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+"/exam-practice.html",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#examUxBar",{timeout:20000});
  assert.equal(await page.locator(".exam-ux-sections .ux-tab").count(),4);
  assert.equal(await page.locator("#uxExerciseSelect").count(),1);
  assert.equal(await page.locator("#uxQuestionSelect").count(),1);
  const initial=await page.locator("#questionList .question").count();
  assert.ok(initial>0,"At least one source question in first practice set");
  assert.equal(await page.locator("#questionList .question:visible").count(),1);
  const label=await page.locator("#uxQuestionProgress").textContent();
  assert.match(label,/1\s*\/\s*\d+/);
  if(initial>1){
   await page.locator("#uxNextQuestion").click();
   assert.equal(await page.locator("#questionList .question:visible").count(),1);
   assert.match(await page.locator("#uxQuestionProgress").textContent(),/2\s*\/\s*\d+/);
  }
  await page.locator(".exam-ux-sections button[data-section='Hören']").click();
  await page.waitForFunction(()=>document.querySelector("#sectionLabel").textContent.startsWith("Hören"));
  assert.equal(await page.locator("#questionList .question:visible").count(),1);
  await page.locator(".exam-ux-sections button[data-section='Schreiben']").click();
  await page.waitForFunction(()=>document.querySelector("#sectionLabel").textContent.startsWith("Schreiben"));
  assert.equal(await page.locator("#questionList .question:visible").count(),1);
  if(profile.name==="mobile"){
   await page.locator("#uxShowSource").click();
   assert.equal(await page.locator("#sourcePanel").isVisible(),true);
   assert.equal(await page.locator("#answerPanel").isVisible(),false);
   await page.locator("#uxShowQuestion").click();
   assert.equal(await page.locator("#answerPanel").isVisible(),true);
   assert.equal(await page.locator("#sourcePanel").isVisible(),false);
  }else{
   assert.equal(await page.locator("#sourcePanel").isVisible(),true);
   assert.equal(await page.locator("#answerPanel").isVisible(),true);
  }
  assert.deepEqual(errors,[],profile.name+" page JS errors");
  console.log("EXAM_UX_BROWSER_OK",profile.name,{visibleQuestion:1,sections:4});
  await context.close();
 }
}finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
