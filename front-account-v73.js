/* Front-of-app login v7.3
 * Reuses the real Supabase auth controls already wired in Settings.
 * Does NOT duplicate credentials, store passwords or alter cloud sync.
 */
(()=>{"use strict";
const $=selector=>document.querySelector(selector);
function init(){
 const auth=$("#authPanel"),brand=$("header .brandhead"),home=$("#today .today-hero");
 if(!auth||!brand||!home)return;
 const openButton=document.createElement("button");
 openButton.type="button";openButton.id="frontAccountButton";
 openButton.className="front-account-button";
 openButton.textContent="Log in";
 openButton.setAttribute("aria-haspopup","dialog");
 openButton.setAttribute("aria-controls","frontAccountDialog");
 brand.appendChild(openButton);
 const dialog=document.createElement("dialog");
 dialog.id="frontAccountDialog";
 dialog.className="front-account-dialog";
 dialog.setAttribute("aria-label","Account login and cloud synchronization");
 const top=document.createElement("div");top.className="front-account-dialog-top";
 const heading=document.createElement("h2");heading.textContent="Your learning account";
 const close=document.createElement("button");close.type="button";close.className="front-account-close";
 close.textContent="×";close.setAttribute("aria-label","Close account dialog");
 top.append(heading,close);
 dialog.appendChild(top);
 // The existing inputs and event listeners continue working with no changes.
 dialog.appendChild(auth);
 document.body.appendChild(dialog);
 const prompt=document.createElement("div");
 prompt.className="front-account-hint";prompt.id="frontAccountHint";
 const label=document.createElement("span");label.textContent="☁ Sync your learning across devices.";
 const openHome=document.createElement("button");openHome.type="button";openHome.textContent="Log in";
 prompt.append(label,openHome);
 const headingToday=home.querySelector(".today-heading");
 if(headingToday)headingToday.after(prompt);else home.prepend(prompt);
 let lastFocus=null;
 const signedIn=()=>!$("#authLoggedIn")?.classList.contains("hidden");
 function render(){
   const loggedIn=signedIn();
   openButton.textContent=loggedIn?"◉ My account":"Log in";
   openButton.classList.toggle("signed-in",loggedIn);
   const email=$("#authUserEmail")?.textContent||"";
   openButton.setAttribute("aria-label",loggedIn?("My account"+(email?" — "+email:"")):"Log in or create an account");
   prompt.hidden=loggedIn;
 }
 const open=()=>{
   lastFocus=document.activeElement;
   if(typeof dialog.showModal==="function"&&!dialog.open)dialog.showModal();
   else dialog.setAttribute("open","");
   (signedIn()?$("#syncProgressBtn"):$("#authEmail"))?.focus();
 };
 const shut=()=>dialog.close();
 openButton.addEventListener("click",open);
 openHome.addEventListener("click",open);
 close.addEventListener("click",shut);
 dialog.addEventListener("click",event=>{
   if(event.target!==dialog)return;
   const rect=dialog.getBoundingClientRect();
   if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)shut();
 });
 dialog.addEventListener("close",()=>{
   if(lastFocus?.isConnected)lastFocus.focus();
   else openButton.focus();
 });
 window.addEventListener("b2-auth-updated",render);
 // Auth may resolve while this enhancement is loading; render actual current state.
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();