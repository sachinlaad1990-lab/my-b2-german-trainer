/* Deck Layout Transfer v7.1
 * Preserves word progress, reviews, bookmarks and ids. No automatic reorder.
 * A shared cloud login does NOT sync deck order; users can explicitly transfer it.
 */
(()=>{
"use strict";
const q=id=>document.getElementById(id);
const format="deutsch-b2-deck-layout",version=1;
const undoKey="deutschB2DeckLayoutBeforeImport_v71";
const norm=x=>String(x??"").trim().replace(/\s+/g," ").toLocaleLowerCase("de-DE");
let pending=null;
const report=(text,bad=false)=>{
 const el=q("deckTransferStatus");if(!el)return;
 el.textContent=text;el.dataset.error=bad?"true":"false";
};
const available=()=>typeof words!=="undefined"&&Array.isArray(words)&&typeof deckOrder!=="undefined";
function currentOrder(){
 const indexed=new Map(words.map(w=>[String(w.id),w]));
 const seen=new Set();
 return deckOrder.map(id=>{
  const w=indexed.get(String(id));
  if(!w||seen.has(String(w.id)))return null;
  seen.add(String(w.id));return w;
 }).filter(Boolean).concat(words.filter(w=>!seen.has(String(w.id))));
}
function serialize(){
 const rows=currentOrder().map(w=>({german:String(w.german??""),id:String(w.id??"")}));
 return {format,version,exportedAt:new Date().toISOString(),wordCount:rows.length,rows};
}
function download(json,filename){
 const blob=new Blob([JSON.stringify(json,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function prepare(raw){
 if(!raw||typeof raw!=="object"||raw.format!==format||raw.version!==version||!Array.isArray(raw.rows))
   throw new Error("This isn't a Deutsch B2 deck-layout file. Export a layout from the other device first.");
 if(!raw.rows.length||raw.rows.length>10000)throw new Error("The file doesn't contain a valid deck layout.");
 const lookup=new Map();
 for(const w of words){
   const key=norm(w.german);
   if(!key)continue;
   if(!lookup.has(key))lookup.set(key,[]);
   lookup.get(key).push(String(w.id));
 }
 const ids=[],seen=new Set();
 let unmatched=0;
 for(const item of raw.rows){
   if(!item||typeof item.german!=="string"||item.german.length>350)
     throw new Error("The deck-layout file has an invalid word entry.");
   const choices=lookup.get(norm(item.german))||[];
   const match=choices.find(id=>!seen.has(id));
   if(!match){unmatched++;continue}
   seen.add(match);ids.push(match);
 }
 if(!ids.length)throw new Error("None of the exported words match the vocabulary on this device.");
 for(const w of currentOrder()){
   const id=String(w.id);
   if(!seen.has(id)){ids.push(id);seen.add(id)}
 }
 return {ids,matched:raw.rows.length-unmatched,sourceCount:raw.rows.length,missing:unmatched,localOnly:ids.length-(raw.rows.length-unmatched)};
}
function applyOrder(newOrder){
 deckOrder=newOrder.map(id=>{
   const w=words.find(w=>String(w.id)===String(id));return w?w.id:id;
 });
 saveDeckOrder();
 // Reset only where the learner is positioned, not what they've mastered.
 flashDeckIndex=0;flashIndex=0;v4VocabDeckIndex=0;
 try{
  localStorage.setItem("deutschB2VocabDeck_v4","0");
  localStorage.setItem("deutschB2FlashDeck_v4","0");
  localStorage.setItem("deutschB2FlashCard_v4","0");
 }catch(_){}
 reconcileOrders();
 renderAll();
}
function init(){
 if(!available())return;
 const downloadBtn=q("deckTransferExport"),file=q("deckTransferFile"),applyBtn=q("deckTransferApply");
 const undoBtn=q("deckTransferUndo");
 if(!downloadBtn||!file||!applyBtn||!undoBtn)return;
 downloadBtn.onclick=()=>{
  download(serialize(),"deutsch-b2-deck-layout.json");
  report("Deck arrangement exported. Send this file to your phone, then open Settings there to import it.");
 };
 file.onchange=async()=>{
  pending=null;applyBtn.disabled=true;
  const chosen=file.files&&file.files[0];
  if(!chosen)return;
  if(chosen.size>1000000){report("The file is too large (maximum 1 MB).",true);return}
  try{
    const data=JSON.parse(await chosen.text());
    pending=prepare(data);
    applyBtn.disabled=false;
    report("Ready to apply: "+pending.matched+" words matched in the same order. "+
      pending.missing+" not on this device; "+pending.localOnly+" words here will stay at the end. Your study progress will not be changed.");
  }catch(err){report("Could not preview: "+err.message,true)}
 };
 applyBtn.onclick=()=>{
   if(!pending){report("Choose and preview a deck-layout file first.",true);return}
   try{
     const previous=deckOrder.slice();
     localStorage.setItem(undoKey,JSON.stringify(previous));
     applyOrder(pending.ids);
     const matched=pending.matched;
     pending=null;file.value="";applyBtn.disabled=true;undoBtn.disabled=false;
     report("Deck order updated: "+matched+" matching words. Open Flashcards and choose Deck 1. Progress and bookmarks were kept.");
   }catch(err){report("Could not apply deck layout: "+err.message,true)}
 };
 undoBtn.disabled=!localStorage.getItem(undoKey);
 undoBtn.onclick=()=>{
  try{
    const previous=JSON.parse(localStorage.getItem(undoKey)||"null");
    if(!Array.isArray(previous))throw new Error("No saved previous order.");
    applyOrder(previous);
    localStorage.removeItem(undoKey);undoBtn.disabled=true;
    report("Your previous deck arrangement has been restored.");
  }catch(err){report("Could not restore previous order: "+err.message,true)}
 };
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();