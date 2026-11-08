/* Optional grammar hints in existing flashcard screen: no new section or pop-up. */
(()=>{"use strict";
function attach(){
 const word=document.getElementById("flashGerman");
 if(!word)return;
 const flash=document.querySelector("#flashcards .panel.flash");
 if(!flash)return;
 const hint=document.createElement("span");
 hint.id="smartFlashCase";
 hint.className="smart-case-tag smart-flash-tag";
 hint.hidden=true;
 word.insertAdjacentElement("afterend",hint);
 const details=document.createElement("details");
 details.className="smart-why smart-flash-why";
 details.hidden=true;
 flash.querySelector(".flash-actions")?.insertAdjacentElement("beforebegin",details);
 const update=()=>{
  const engine=window.B2SmartGrammar;
  if(!engine)return;
  const rule=engine.forWord(word.textContent);
  hint.hidden=!rule;
  if(rule)hint.textContent=rule.label+" · "+rule.pattern;
  details.hidden=!rule;
  if(rule)details.innerHTML=engine.whyHTML(rule).replace(/^<details class="smart-why">|<\/details>$/g,"");
  // When no matching rule is available, leave all existing learning controls as-is.
 };
 const observer=new MutationObserver(update);
 observer.observe(word,{subtree:true,characterData:true,childList:true});
 update();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
else attach();
})();