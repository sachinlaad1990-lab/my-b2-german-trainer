/* Optional passkey login v7.5
 * Uses browser WebAuthn via Supabase. Never reads or stores biometric data.
 * Always shows immediate feedback beside the button; a missing server toggle
 * cannot look like a button that does nothing.
 */
(()=>{
"use strict";
function ready(){
 const signIn=document.getElementById("signInPasskeyBtn");
 const register=document.getElementById("registerPasskeyBtn");
 const status=document.getElementById("authStatus");
 if(!signIn||!register||!status)return;
 const supported=window.isSecureContext&&typeof window.PublicKeyCredential!=="undefined";
 const api=typeof supabaseClient!=="undefined"?supabaseClient.auth:null;
 const capable=supported&&typeof api?.signInWithPasskey==="function"&&typeof api?.registerPasskey==="function";
 function feedback(button,message,type="info"){
   // Keep feedback beside the actual action, not at the bottom of a long dialog.
   let local=button.parentElement.querySelector(".passkey-inline-feedback");
   if(!local){
     local=document.createElement("p");
     local.className="passkey-inline-feedback";
     local.setAttribute("role","status");local.setAttribute("aria-live","polite");
     button.insertAdjacentElement("afterend",local);
   }
   local.textContent=message;
   local.dataset.kind=type;
   // Feedback is already shown beside the button; avoid showing it twice.
   if(status.textContent===message || /passkey registration did not start|authenticator was previously registered/i.test(status.textContent)) status.textContent="";
   if(type==="error")local.scrollIntoView({block:"nearest",behavior:"auto"});
 }
 function formatError(err){
   const code=err?.code||err?.error_code||"";
   if(code==="passkey_disabled"||/passkey.+disabled/i.test(err?.message||""))
      return "Fingerprint/Face ID login is disabled in the app's Supabase project. Enable Authentication → Passkeys in Supabase, then try again.";
   if(code==="too_many_passkeys")return "This account has reached its passkey limit. Remove an unused passkey from your account settings.";
   if(code==="webauthn_credential_exists"||err?.name==="InvalidStateError"||/authenticator was previously registered|credential already (exists|registered)|already registered/i.test(err?.message||"")) return "A passkey may already exist on this device for this site. You do not need to set it up again. Try signing in with your passkey next time. Email login remains available.";
   if(err?.name==="NotAllowedError"||/cancel|abort/i.test(code))return "The device prompt was cancelled or unavailable. Try again or use email login.";
   if(err?.name==="SecurityError")return "The passkey cannot be registered from this website origin. Check the Relying Party settings in Supabase.";
   if(err?.name==="NotSupportedError")return "This browser does not support the requested passkey. Try an updated Chrome, Safari or Edge.";
   return "Passkey registration did not start: "+(err?.message||"Unknown error")+". You can continue using your email and password.";
 }
 if(!capable){
   const why=!window.isSecureContext
     ?"Passkeys require a secure HTTPS connection."
     :!supported
       ?"This browser does not support passkeys."
       :"Passkeys need a newer Supabase JavaScript client. Use email login until the app is updated.";
   // No misleading clickable biometric controls when the client cannot use them.
   for(const btn of [signIn,register]){
     btn.hidden=true;
     const hint=btn.parentElement.querySelector(".passkey-inline-feedback")||document.createElement("p");
     hint.className="passkey-inline-feedback";
     hint.textContent=why;
     if(!hint.isConnected)btn.insertAdjacentElement("afterend",hint);
   }
   return;
 }
 signIn.hidden=false;register.hidden=false;
 signIn.addEventListener("click",async()=>{
   signIn.disabled=true;
   feedback(signIn,"Checking passkey availability… Your phone may ask for Face ID, fingerprint, or a PIN.");
   try{
     const {data,error}=await api.signInWithPasskey();
     if(error)throw error;
     if(!data?.user)throw new Error("No signed-in user was returned by the authentication service");
     await handleSignedIn(data.user);
     feedback(signIn,"Signed in! Your learning and deck order are syncing.","success");
     document.getElementById("frontAccountDialog")?.close();
   }catch(err){feedback(signIn,formatError(err),"error")}
   finally{signIn.disabled=false}
 });
 register.addEventListener("click",async()=>{
   register.disabled=true;
   feedback(register,"Contacting the authentication service… If enabled, a fingerprint, Face ID, or device PIN prompt will appear.");
   try{
     if(typeof currentUser==="undefined"||!currentUser)throw new Error("First log in with email and password");
     const {data,error}=await api.registerPasskey();
     if(error)throw error;
     if(!data?.id)throw new Error("The server didn't confirm registration");
     feedback(register,"Passkey registered successfully. You can use it for your next sign-in.","success");
   }catch(err){
     const alreadyExists=err?.code==="webauthn_credential_exists"||err?.name==="InvalidStateError"||/authenticator was previously registered|credential already (exists|registered)|already registered/i.test(err?.message||"");
     feedback(register,formatError(err),alreadyExists?"info":"error");
   }
   finally{register.disabled=false}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});else ready();
})();