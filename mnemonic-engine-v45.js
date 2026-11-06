/* German B2 Mnemonics v4.5 — rules vs imaginative images kept distinct */
(function(){
"use strict";
const curated={
"Bewerbung":"Imagine your job application with a giant red DIE stamp. Bewerbung ends in the feminine noun suffix -ung.",
"Vorstellungsgespräch":"Your interview happens in a DAS speech bubble. The last noun is das Gespräch, so the compound is das Vorstellungsgespräch.",
"Pünktlichkeit":"A clock strikes exactly 9:00. -keit makes die Pünktlichkeit feminine.",
"Zuverlässigkeit":"A reliable colleague always catches deadlines. -keit makes die Zuverlässigkeit feminine.",
"Lebenslauf":"Your entire LEBEN (life) takes a LAUF (run) through your past jobs: der Lebenslauf is a CV.",
"Arbeitgeber":"ARBEIT + GEBER (giver): the employer gives work. Der Arbeitgeber.",
"Arbeitnehmer":"ARBEIT + NEHMER (taker): the employee takes work. Der Arbeitnehmer.",
"Mitarbeiter":"MIT (with) + ARBEITEN (work): someone working with you, der Mitarbeiter.",
"Geschäftsführer":"The person who FÜHRT (leads) a business: der Geschäftsführer.",
"Geschäftsführerin":"The female person who FÜHRT (leads) a business: die Geschäftsführerin; the job title ends in -in.",
"Rückmeldung":"RÜCK (back) + MELDUNG (message): a message coming back to you. Die Rückmeldung ends in -ung.",
"Verantwortung":"Imagine answering to your boss for an important project. The noun-forming suffix -ung gives die Verantwortung.",
"Entscheidung":"At a fork in the road you decide which career path to take. Entscheiden + -ung gives die Entscheidung.",
"Besprechung":"Picture colleagues SPEAKING about the project together. Besprechen + -ung gives die Besprechung.",
"Zusammenarbeit":"ZUSAMMEN (together) + ARBEIT (work): work together. The final noun is die Arbeit.",
"Berufserfahrung":"BERUF + ERFAHRUNG: professional experience. The last noun die Erfahrung sets the gender.",
"Arbeitsvertrag":"ARBEIT + VERTRAG: a work contract. The final noun der Vertrag sets the gender.",
"Arbeitszeit":"ARBEIT + ZEIT: working time. The last noun die Zeit sets the gender.",
"Probezeit":"A stopwatch measures your probation period. Die Zeit makes die Probezeit feminine.",
"Vorteil":"VOR (ahead) + TEIL (part): picture yourself a step ahead, an advantage.",
"Nachteil":"NACH (behind) + TEIL (part): picture yourself one step behind, a disadvantage.",
"Rechnung":"A calculator spits out a bill with a red DIE stamp. Rechn- + -ung is feminine.",
"Überweisung":"Picture money crossing a bridge between bank accounts. Die Überweisung ends in -ung.",
"Gespräch":"Picture two people talking inside a GOLDEN DAS speech bubble: das Gespräch.",
"Unternehmen":"Picture a company headquarters as a huge GOLDEN DAS cube: das Unternehmen.",
"Projekt":"Picture your project prototype sitting in a GOLDEN DAS box: das Projekt.",
"Kunde":"The customer carries a BLUE DER badge. Der Kunde is an exception to the frequent feminine -e pattern.",
"Kollege":"A colleague wearing a BLUE DER badge. Der Kollege, den Kollegen; do not assume all -e nouns are feminine.",
"Name":"A name tag with a BLUE DER badge: der Name, den Namen (N-declension).",
"Ende":"The finish line is inside a GOLDEN DAS box. Das Ende is not feminine despite ending -e.",
"Mädchen":"A tiny girl holding a GOLDEN DAS cube. Diminutive -chen always takes das.",
"Brötchen":"A tiny bread roll in a GOLDEN DAS box. Diminutive -chen always takes das.",
"Ergebnis":"A scorecard with results stamped GOLDEN DAS. -nis can be different genders: das Ergebnis, die Erlaubnis.",
"Erlaubnis":"A permission slip with a RED DIE stamp. -nis is mixed: die Erlaubnis, das Ergebnis.",
"Vorbereitung":"Picture your desk prepared before an exam. Vorbereiten + -ung gives die Vorbereitung.",
"Prüfung":"An exam paper stamped RED DIE. Prüf- + -ung gives die Prüfung.",
"Information":"Think of English 'information' on a RED DIE screen: feminine -tion.",
"Kommunikation":"Picture a RED DIE speech bubble: kommunizieren → die Kommunikation.",
"Organisation":"An organisation chart under a RED DIE banner. Noun-forming -tion takes die.",
"Qualität":"A quality certificate sealed RED DIE. -ität gives die Qualität.",
"Gesellschaft":"A whole society under a RED DIE banner. -schaft makes die Gesellschaft.",
"Freundschaft":"A RED DIE ribbon binding two friends. -schaft makes die Freundschaft.",
"Bäckerei":"Picture bread in a RED DIE bakery window. -ei is a feminine noun-forming suffix.",
"Frist":"Imagine a deadline clock counting down with a RED DIE warning light: die Frist.",
"Termin":"An appointment printed on a calendar with a BLUE DER badge: der Termin.",
"Gehalt":"A salary envelope held by a GOLDEN DAS robot: das Gehalt.",
"Zeugnis":"A certificate inside a GOLDEN DAS folder: das Zeugnis; -nis is not a universal gender rule."
};
const prep={
"sich bewerben um":"Remember the full chunk: sich bewerben UM + Akkusativ. Imagine your job application wrapped around an advertisement.",
"sich interessieren für":"Remember the full chunk: sich interessieren FÜR + Akkusativ. A spotlight points FOR the job.",
"sich vorbereiten auf":"Remember the full chunk: sich vorbereiten AUF + Akkusativ. Lay exam notes ONTO your desk.",
"sich freuen auf":"Remember: sich freuen AUF + Akkusativ = look forward to what is coming.",
"sich freuen über":"Remember: sich freuen ÜBER + Akkusativ = be pleased about something.",
"sich kümmern um":"Remember: sich kümmern UM + Akkusativ = take care of something.",
"warten auf":"Remember: warten AUF + Akkusativ. You wait on a platform for a train.",
"teilnehmen an":"Remember: teilnehmen AN + Dativ. Join a meeting at a table.",
"sich beschäftigen mit":"Remember: sich beschäftigen MIT + Dativ. MIT = WITH a project.",
"sich erkundigen nach":"Remember: sich erkundigen NACH + Dativ. Ask after the appointment.",
"sich beschweren über":"Remember: sich beschweren ÜBER + Akkusativ. Complain ABOUT the error.",
"sprechen mit":"Remember: sprechen MIT + Dativ. Speak WITH the colleague.",
"arbeiten bei":"Remember: arbeiten BEI + Dativ when describing the employer.",
"arbeiten für":"Remember: arbeiten FÜR + Akkusativ when describing who benefits.",
"helfen":"Case clue: HELFEN takes Dativ. Ich helfe dem Kollegen.",
"danken":"Case clue: DANKEN takes Dativ. Ich danke dem Chef.",
"antworten":"Case clue: ANTWORTEN takes Dativ. Ich antworte dem Kunden.",
"anrufen":"Case clue: ANRUFEN takes Akkusativ. Ich rufe den Chef an.",
"fragen":"Case clue: FRAGEN takes Akkusativ. Ich frage den Kollegen.",
"gefallen":"Case clue: GEFALLEN takes Dativ. Die Arbeit gefällt mir."
};
const suffixes=[
["ung","die","-ung is a feminine noun-forming suffix."],
["heit","die","-heit always forms feminine nouns."],
["keit","die","-keit always forms feminine nouns."],
["schaft","die","-schaft forms feminine nouns."],
["ität","die","-ität forms feminine nouns."],
["tion","die","-tion forms feminine nouns."],
["ion","die","-ion often forms feminine nouns; exceptions exist."],
["ei","die","True noun-forming -ei makes feminine nouns."],
["chen","das","Diminutive -chen always makes a noun neuter."],
["lein","das","Diminutive -lein always makes a noun neuter."],
["ismus","der","-ismus makes masculine nouns."],
["ling","der","-ling makes masculine nouns."]
];
const compounds=[
["Gespräch","das"],["Vertrag","der"],["Zeit","die"],["Arbeit","die"],
["Frist","die"],["Plan","der"],["Ziel","das"],["Buch","das"],["Geld","das"],
["Haus","das"],["Abteilung","die"],["Stelle","die"],["Schein","der"],
["Bericht","der"],["Rechnung","die"],["Meldung","die"],["Prüfung","die"],
["Erfahrung","die"],["Fahrt","die"],["System","das"],["Karte","die"],
["Firma","die"],["Woche","die"],["Antrag","der"],["Auftrag","der"]
];
function clean(x){return String(x??"").trim()}
function normalized(x){return clean(x).normalize("NFC").toLocaleLowerCase("de-DE").replace(/\s+/g," ")}
function describe(w){
 if(!w)return "";
 if(clean(w.mnemonic))return "🧠 My mnemonic: "+clean(w.mnemonic);
 const german=clean(w.noun||w.german);
 const stripped=german.replace(/^(der|die|das)\s+/i,"");
 const english=clean(w.english).split(/\s*[/;]\s*/)[0]||stripped;
 const articleMatch=(clean(w.article)+" "+german).match(/\b(der|die|das)\b/i);
 const article=articleMatch?articleMatch[1].toLowerCase():"";
 const label=article?article+" "+stripped:stripped;
 if(prep[normalized(stripped)])return "🧠 "+prep[normalized(stripped)];
 if(curated[stripped])return "🧠 "+curated[stripped];
 const sourceTip=clean(w.memoryTip);
 // Source-specific explanations, if available, take priority.
 if(sourceTip&&!/^No dependable suffix rule/.test(sourceTip))return "🧠 "+sourceTip;
 const suffix=suffixes.find(([ending,a])=>a===article&&stripped.toLocaleLowerCase("de-DE").endsWith(ending)&&stripped.length>=ending.length+3);
 const colors={der:"a BLUE DER badge",die:"a RED DIE umbrella",das:"a GOLDEN DAS cube"};
 const image=article?colors[article]:"an unforgettable sign";
 if(suffix){
  return "🧠 Visualise '"+english+"' under "+image+". "+suffix[2]+" Say: "+label+".";
 }
 const compound=compounds.filter(([last,a])=>a===article&&stripped.endsWith(last)&&stripped.length>last.length+2).sort((a,b)=>b[0].length-a[0].length)[0];
 if(compound){
  return "🧠 Imagine '"+english+"' built from two puzzle pieces. Its FINAL noun is "+compound[1]+" "+compound[0]+"; the full word is "+label+".";
 }
 if(article){
  return "🧠 Visual association (not a grammar rule): imagine a giant '"+english+"' next to "+image+". Say '"+label+"' and recall the picture.";
 }
 const x=normalized(stripped);
 for(const [key,val] of Object.entries(prep))if(x.includes(key))return "🧠 "+val;
 if(/^(sich\s+)?[a-zäöüß]+(en|ern|eln)$/.test(x)){
  const direction=[["zurück","BACK"],["auf","UP"],["aus","OUT"],["ein","IN"],["mit","WITH"],["vor","BEFORE"],["ab","AWAY"],["an","CONTACT"]].find(([p])=>x.startsWith(p));
  return "🧠 Imagine '"+english+"' happening in a workplace scene. Say "+stripped+" aloud."+(direction?" Optional image: '"+direction[1]+"' for prefix "+direction[0]+" (not a universal meaning rule).":"");
 }
 return "🧠 Picture '"+english+"' as an exaggerated, unforgettable scene. Place the word '"+stripped+"' on a sign inside it. This is a visual cue, not a grammar or etymology rule.";
}
window.B2MnemonicEngine={describe,curatedCount:Object.keys(curated).length,version:"4.5"};
})();