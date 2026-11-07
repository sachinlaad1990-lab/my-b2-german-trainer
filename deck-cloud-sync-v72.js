/* Account deck sync v7.2
 * Stores compact ordered German terms in the existing Supabase auth user_metadata.
 * No new database schema. User_id, not email text, defines the account.
 * Existing per-device deck order remains a fallback if cloud metadata is unavailable.
 */
(()=>{
"use strict";
const metaKey="b2_deck_layout_v1",ackPrefix="b2DeckCloudAck_v72:",backupPrefix="b2DeckLocalBeforeCloud_v72:";
const normalize=s=>String(s??"").trim().replace(/\s+/g," ").toLocaleLowerCase("de-DE");
const available=()=>typeof words!=="undefined"&&Array.isArray(words)&&typeof deckOrder!=="undefined";
let fetching=false,publishing=false,lastPoll=0,debounce=null,applying=false;
const unique=array=>[...new Set(array)];
function localTerms(){
 if(!available())return [];
 const byId=new Map(words.map(w=>[String(w.id),w]));
 const terms=[],seen=new Set();
 for(const id of deckOrder){
   const key=normalize(byId.get(String(id))?.german);
   if(key&&!seen.has(key)){terms.push(key);seen.add(key)}
 }
 for(const w of words){
   const key=normalize(w.german);
   if(key&&!seen.has(key)){terms.push(key);seen.add(key)}
 }
 return terms;
}
function read(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function write(key,data){try{localStorage.setItem(key,JSON.stringify(data))}catch{}}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function valid(remote){
 return remote&&remote.v===1&&Array.isArray(remote.terms)&&remote.terms.length<=10000
  &&remote.terms.every(x=>typeof x==="string"&&x.length<400);
}
function cloudStatus(text){
 const indicator=document.getElementById("deckCloudStatus");
 if(indicator)indicator.textContent=text;
}
function apply(terms,uid){
 if(!available()||!words.length)return false;
 const byTerm=new Map();
 words.forEach(w=>{
   const t=normalize(w.german);
   if(!byTerm.has(t))byTerm.set(t,[]);
   byTerm.get(t).push(w.id);
 });
 const seen=new Set(),ordered=[];
 for(const term of terms){
   for(const id of byTerm.get(normalize(term))||[]){
     if(!seen.has(String(id))){seen.add(String(id));ordered.push(id);break}
   }
 }
 for(const oldId of deckOrder){
   if(words.some(w=>String(w.id)===String(oldId))&&!seen.has(String(oldId))){
     ordered.push(oldId);seen.add(String(oldId))
   }
 }
 for(const w of words){if(!seen.has(String(w.id))){ordered.push(w.id);seen.add(String(w.id))}}
 if(!ordered.length)return false;
 if(same(ordered,deckOrder))return false;
 write(backupPrefix+uid,deckOrder);
 applying=true;
 try{
  deckOrder=ordered;
  saveDeckOrder();
  flashIndex=0;flashDeckIndex=0;
  try{
   localStorage.setItem("deutschB2FlashDeck_v4","0");
   localStorage.setItem("deutschB2FlashCard_v4","0");
  }catch{}
  reconcileOrders();
  renderAll();
 }finally{applying=false}
 return true;
}
function key(uid){return ackPrefix+uid}
async function sync(options={}){
 if(fetching||publishing||!available()||!currentUser?.id)return;
 const uid=currentUser.id;
 fetching=true;
 try{
  // getUser fetches server-authoritative metadata, not a stale client session.
  const result=await supabaseClient.auth.getUser();
  if(result.error)throw result.error;
  const account=result.data?.user;
  if(!account||account.id!==uid)return;
  const remote=account.user_metadata?.[metaKey];
  const ack=read(key(uid));
  const local=localTerms();
  if(!local.length){
   cloudStatus("Deck sync will start after vocabulary loads.");
   return;
  }
  if(valid(remote)){
   const cloud=unique(remote.terms.map(normalize).filter(Boolean));
   const ackTerms=Array.isArray(ack?.terms)?ack.terms:[];
   const isLocalEdit=ack&&(!same(ackTerms,local))&&!options.preferCloud;
   // Cloud order is canonical on login/new device. Only explicit local deck imports
   // after the last cloud acknowledgement are uploaded.
   if(isLocalEdit){
     cloudStatus("Saving updated deck arrangement to your account…");
     write(key(uid),{terms:local,updatedAt:Date.now()});
     await publish(uid,local);
   }else{
     const changed=apply(cloud,uid);
     const latest=localTerms();
     write(key(uid),{terms:latest,updatedAt:Date.now()});
     cloudStatus(changed?"Deck order synchronized across your devices.":"Deck order matches your account.");
     // Append newly imported sheet words to the server layout without changing
     // the order of any existing entries on either device.
     if(latest.length>cloud.length&&latest.some(t=>!cloud.includes(t))){
       await publish(uid,latest);
     }
   }
  }else{
   // First device with vocabulary starts the shared layout; other devices
   // will fetch it on their next login or foreground refresh.
   write(key(uid),{terms:local,updatedAt:Date.now()});
   await publish(uid,local);
  }
 }catch(err){
  cloudStatus("Deck sync unavailable; your local deck order is preserved.");
  console.warn("Deck cloud sync:",err?.message||err);
 }finally{fetching=false;lastPoll=Date.now()}
}
async function publish(uid,terms){
 if(publishing||!currentUser||currentUser.id!==uid)return;
 publishing=true;
 try{
  const {error}=await supabaseClient.auth.updateUser({data:{[metaKey]:{
   v:1,terms,updatedAt:new Date().toISOString()
  }}});
  if(error)throw error;
  write(key(uid),{terms,updatedAt:Date.now()});
  cloudStatus("Deck order saved to your account.");
 }finally{publishing=false}
}
function changed(){
 if(applying||!currentUser?.id)return;
 clearTimeout(debounce);
 debounce=setTimeout(()=>{if(!fetching&&!publishing)sync()},1200);
}
function poll(){
 if(!currentUser?.id||document.hidden||Date.now()-lastPoll<60000)return;
 sync({preferCloud:true});
}
window.b2DeckCloudSync=sync;
window.b2DeckCloudChanged=changed;
window.addEventListener("online",poll);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)poll()});
document.addEventListener("DOMContentLoaded",()=>{
 const panel=document.getElementById("deckTransferPanel");
 if(panel){
  const header=panel.querySelector("h2");
  if(header)header.textContent="Deck order across your devices";
  const intro=panel.querySelector("p");
  if(intro)intro.textContent="When you log in with the same account on your phone and computer, the app automatically synchronizes deck order. The file transfer below is an optional backup for offline use.";
  const line=document.createElement("p");line.className="small muted";line.id="deckCloudStatus";line.setAttribute("role","status");line.setAttribute("aria-live","polite");
  line.textContent="Sign in to sync deck arrangement automatically.";
  (intro||header)?.after(line);
  const wrap=document.createElement("details");wrap.className="deck-manual-fallback";
  const label=document.createElement("summary");label.textContent="Advanced: manual layout backup / restore";
  wrap.appendChild(label);
  const keep=[...panel.children].filter(x=>x!==header&&x!==intro&&x!==line);
  for(const item of keep)wrap.appendChild(item);
  panel.appendChild(wrap);
 }
});
})();