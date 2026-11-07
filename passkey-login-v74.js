/* Optional passkey login v7.4
 * Supabase WebAuthn, no fingerprint data is handled by this app.
 * Requires Supabase Dashboard > Authentication > Passkeys enabled and configured.
 */
(()=>{
"use strict";
function ready(){
 const signIn=document.getElementById("signInPasskeyBtn");
 const register=document.getElementById("registerPasskeyBtn");
 const status=document.getElementById("authStatus");
 if(!signIn||!register||!status)return;
 const supported=window.isSecureContext&&typeof window.PublicKeyCredential!=="undefined";
 const api=supabaseClient?.auth;
 const capable=supported&&typeof api?.signInWithPasskey==="function"&&typeof api?.registerPasskey==="function";
 if(!capable)return;
 signIn.hidden=false;register.hidden=false;
 function message(text){status.textContent=text}
 function fail(error){
  const code=error?.code||error?.error_code||"";
  if(code==="passkey_disabled"){
   message("Fingerprint/Face ID login is not enabled on this app's authentication server yet. Please log in with email and password.");
   return;
  }
  if(error?.name==="NotAllowedError"||/cancel|abort/i.test(code)){
   message("Passkey prompt cancelled. You can try again or use your password.");
   return;
  }
  message("Passkey didn't work: "+(error?.message||"Please try email and password."));
 }
 signIn.addEventListener("click",async()=>{
  signIn.disabled=true;
  message("Use your device's fingerprint, Face ID, PIN or passkey to log in…");
  try{
   const {data,error}=await api.signInWithPasskey();
   if(error)throw error;
   if(!data?.user)throw new Error("No signed-in user was returned.");
   await handleSignedIn(data.user);
   message("Signed in. Your learning progress and deck order are syncing.");
   document.getElementById("frontAccountDialog")?.close();
  }catch(e){fail(e)}
  finally{signIn.disabled=false}
 });
 register.addEventListener("click",async()=>{
  register.disabled=true;
  message("Confirm with your device to register a passkey…");
  try{
   if(!currentUser)throw new Error("First sign in with email and password.");
   const {data,error}=await api.registerPasskey();
   if(error)throw error;
   message("Passkey added. Next time, use fingerprint, Face ID, device PIN or your passkey.");
  }catch(e){fail(e)}
  finally{register.disabled=false}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});
else ready();
})();