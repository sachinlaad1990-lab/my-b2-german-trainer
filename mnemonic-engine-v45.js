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

const wordParts={
"Arbeits":"Arbeit (work)","Berufs":"Beruf (profession)","Bewerbungs":"Bewerbung (application)",
"Projekt":"Projekt (project)","Kunden":"Kunde (customer)","Personal":"Personal (staff)",
"Gehalts":"Gehalt (salary)","Liefer":"liefern (deliver)","Zahlungs":"Zahlung (payment)",
"Zeit":"Zeit (time)","Termin":"Termin (appointment)","Sprach":"Sprache (language)",
"Unternehmens":"Unternehmen (company)","Gesundheits":"Gesundheit (health)",
"Schicht":"Schicht (shift)","Wohnungs":"Wohnung (apartment)","Reise":"Reise (travel)",
"Fahr":"fahren (travel/drive)","Daten":"Daten (data)","Kosten":"Kosten (costs)",
"Verkaufs":"verkaufen (sell)","Einkaufs":"einkaufen (buy)","Schul":"Schule (school)",
"Rechnungs":"Rechnung (invoice)","Ausbildungs":"Ausbildung (training)",
"Betriebs":"Betrieb (business/operation)","Miet":"Miete (rent)","Versicherungs":"Versicherung (insurance)"
};
const endingsExact=[
["ung","die","nominalisation -ung: many verbs become feminine nouns"],
["heit","die","abstract noun ending -heit: feminine"],
["keit","die","abstract noun ending -keit: feminine"],
["schaft","die","-schaft forms feminine nouns"],
["ität","die","-ität forms feminine nouns"],
["tion","die","-tion forms feminine nouns"],
["ismus","der","-ismus forms masculine nouns"],
["ling","der","-ling forms masculine nouns"],
["chen","das","-chen forms neuter diminutives"],
["lein","das","-lein forms neuter diminutives"],
["ei","die","noun-forming -ei is feminine (exceptions for mere final letters)"]
];
const wordFamilyPairs={
"Bescheid":"bescheiden / Bescheid geben","Nachfrage":"nachfragen (ask again)",
"Aufgabe":"aufgeben (assign / give up, depending on context)",
"Einladung":"einladen (invite)","Rechnung":"rechnen (calculate)",
"Bewerbung":"sich bewerben (apply)","Prüfung":"prüfen (test)",
"Bestellung":"bestellen (order)","Erklärung":"erklären (explain)",
"Entscheidung":"entscheiden (decide)","Änderung":"ändern (change)",
"Verbesserung":"verbessern (improve)","Überweisung":"überweisen (transfer)",
"Anmeldung":"anmelden (register)","Abmeldung":"abmelden (deregister)",
"Kündigung":"kündigen (terminate)","Entwicklung":"entwickeln (develop)",
"Lieferung":"liefern (deliver)","Planung":"planen (plan)",
"Bezahlung":"bezahlen (pay)","Behandlung":"behandeln (treat)",
"Verhandlung":"verhandeln (negotiate)","Beschwerde":"sich beschweren (complain)",
"Vorbereitung":"vorbereiten (prepare)","Erfahrung":"erfahren (experience / find out)",
"Verbindung":"verbinden (connect)","Verantwortung":"verantworten (be responsible for)",
"Forschung":"forschen (research)","Beratung":"beraten (advise)",
"Produktion":"produzieren (produce)","Kommunikation":"kommunizieren (communicate)",
"Zusammenarbeit":"zusammen + arbeiten (work together)"
};
const reliableDays=new Set(["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag",
"Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember",
"Frühling","Sommer","Herbst","Winter"]);
const genderProfessions=new Set(["Mitarbeiter","Arbeitgeber","Arbeitnehmer","Bewerber","Lehrer","Verkäufer","Berater","Entwickler","Forscher","Leiter","Teilnehmer","Vertreter","Besucher","Nutzer","Praktikant","Lieferant","Assistent","Student","Dozent","Journalist","Spezialist","Polizist","Tourist"]);
const contrastMem={
"Nacht":"DER Morgen / DER Abend, but DIE Nacht. Contrast them aloud.",
"Ende":"DER Anfang but DAS Ende. Remember the pair as a start/end timeline.",
"Fenster":"DER Drucker (-er person/device tendency), but DAS Fenster. Final -er isn't a rule.",
"Messer":"DER Drucker, but DAS Messer. The -er letters do not guarantee DER.",
"Auge":"DIE Nase but DAS Auge. Two face parts, different articles.",
"Name":"DER Name: DER Name, DEN Namen, DEM Namen, DES Namens. It belongs to N-declension.",
"Kunde":"DER Kunde → DEN Kunden → DEM Kunden. Male person, N-declension despite final -e.",
"Kollege":"DER Kollege → DEN Kollegen → DEM Kollegen. Male person, N-declension despite final -e.",
"Ergebnis":"DAS Ergebnis versus DIE Kenntnis / DIE Erlaubnis. -nis alone is not a gender rule.",
"Kenntnis":"DIE Kenntnis versus DAS Ergebnis. Remember this -nis contrast.",
"Erlaubnis":"DIE Erlaubnis versus DAS Zeugnis. Remember this -nis contrast.",
"Zeugnis":"DAS Zeugnis versus DIE Erlaubnis. Remember this -nis contrast.",
"Moment":"DER Moment versus DAS Dokument. -ment has exceptions.",
"Irrtum":"DER Irrtum versus DAS Eigentum. -tum cannot decide gender alone.",
"Eigentum":"DAS Eigentum versus DER Irrtum. -tum is not a universal gender rule.",
"Jahr":"DER Monat, but DAS Jahr. Place these two on one calendar.",
"Woche":"DER Tag, but DIE Woche. A day sits inside a week.",
"Mutter":"DIE Mutter, but DER Vater. Learn the family pair together.",
"Vater":"DER Vater, but DIE Mutter. Learn the family pair together.",
"Kind":"DER Mann / DIE Frau / DAS Kind: learn the three together.",
"Mädchen":"-chen diminutive → DAS, regardless of the person's biological sex.",
"Brötchen":"Brot + -chen (small roll) → DAS, because -chen is neuter."
};
const specialScenes={
"Termin":"Imagine missing a job interview because the red calendar alarm screams TER-MIN! Put 'der Termin' on the calendar entry.",
"Frist":"A contract deadline is FRIST-EN-ing as a stopwatch races to zero: die Frist. This is a sound association, not etymology.",
"Gehalt":"At payday, a salary envelope says 'I got my GEHALT!' Learn das Gehalt as a chunk.",
"Projekt":"Picture a mini project model on your desk with DAS PROJEKT printed across it.",
"Gespräch":"Picture a conversation bubble containing two chairs labelled das Gespräch.",
"Unternehmen":"A miniature factory fits inside a model: das Unternehmen means company, not just 'undertake'.",
"Vorteil":"VOR (in front) + TEIL (part): the advantage is the part ahead of you.",
"Nachteil":"NACH (after/behind) + TEIL (part): the disadvantage is the part trailing behind.",
"Lebenslauf":"LEBEN (life) + LAUF (course/run): your CV traces the course of your life.",
"Arbeitgeber":"ARBEIT (work) + GEBER (giver): an employer gives work.",
"Arbeitnehmer":"ARBEIT (work) + NEHMER (taker): an employee takes work.",
"Mitarbeiter":"MIT (with) + ARBEITER (worker): someone who works with you.",
"Unterschrift":"UNTER (under) + SCHRIFT (writing): sign under your letter.",
"Rückmeldung":"RÜCK (back) + MELDUNG (message): the response comes back to you."
};
function helpfulSourceTip(source){
 if(!source)return false;
 return !/^(No dependable|Memorise|Remember.*one|Visual association|Picture|Imagine)/i.test(source)
   && !/(say the whole|stamp|umbrella|cube|robot|no reliable rule)/i.test(source);
}
function describe(w){
 if(!w)return "";
 if(clean(w.mnemonic))return "🧠 Your mnemonic: "+clean(w.mnemonic);
 const original=clean(w.noun||w.german);
 const german=original.replace(/^(der|die|das)\s+/i,"");
 const english=clean(w.english).split(/\s*[/;]\s*/)[0]||german;
 const articleMatch=(clean(w.article)+" "+original).match(/\b(der|die|das)\b/i);
 const a=articleMatch?articleMatch[1].toLowerCase():"";
 const display=(a?a+" ":"")+german;
 if(prep[normalized(german)])return "🧠 Fixed expression: "+prep[normalized(german)];
 if(contrastMem[german])return "🧠 Contrast: "+contrastMem[german];
 if(specialScenes[german])return "🧠 "+specialScenes[german];
 const curatedValue=curated[german]||"";
 if(curatedValue && !/(blue|red|golden|stamp|umbrella|cube|badge|robot|picture|imagine)/i.test(curatedValue))return "🧠 "+curatedValue;
 if(a){
   const nameLower=normalized(german);
   if(a==="der"&&reliableDays.has(german))return "🧠 Category rule: named weekdays, months and seasons take DER. "+german+" = "+english+". Pair it with der Montag / der Januar / der Sommer.";
   if(a==="die" && (w.cluster===9 || /(?:erin|entin|istin|antin)$/.test(nameLower)) && german!=="Kundin"){
     return "🧠 Person-word formation: female job/person title ending -in → DIE. "+german+" ("+english+") is feminine. Compare male and female job titles.";
   }
   const match=endingsExact.find(([suffix,gender])=>a===gender&&nameLower.endsWith(suffix)&&german.length>suffix.length+2);
   if(match){
     let base=wordFamilyPairs[german];
     const stem=german.slice(0,-match[0].length);
     const stemMeaning=base?" Word family: "+base+".":" Find the base "+stem+"- within related words.";
     return "🧠 Ending rule: "+german+" ("+english+") ends in -"+match[0]+". "+match[2]+", so it is "+display+"."+stemMeaning;
   }
   if(a==="die"&&/in$/.test(nameLower)&&german.length>5&&/([aeiouäöü]rin|tin|stin|antin)$/.test(nameLower)){
     return "🧠 Female person/job suffix -in: "+display+" ("+english+"). Compare the matching male title.";
   }
   const comp=compounds.filter(([part,gender])=>gender===a&&german.endsWith(part)&&german.length>part.length+2).sort((x,y)=>y[0].length-x[0].length)[0];
   if(comp){
     const first=german.slice(0,-comp[0].length);
     const firstKnown=wordParts[first];
     return "🧠 Compound decoding: "+german+" = "+(firstKnown||first)+" + "+comp[1]+" "+comp[0]+". German compounds take the gender of the LAST noun, so "+display+" means "+english+".";
   }
   const source=clean(w.memoryTip);
   if(helpfulSourceTip(source))return "🧠 Article clue: "+source;
   // Do not manufacture a fake mnemonic for an opaque noun.
   return "📌 No dependable gender rule or individual mnemonic verified for "+display+" ("+english+"). Learn it as a complete article+noun pair. Try saying: “Ich kenne das Wort: "+display+".” Add your own memorable scene if one comes to mind.";
 }
 const x=normalized(german);
 if(prep[x])return "🧠 Fixed expression: "+prep[x];
 if(/^(sich\s+)?[a-zäöüß]+(en|ern|eln)$/.test(x)){
   const prefix=[["zurück","back"],["auf","up/open"],["aus","out"],["ein","in"],["mit","along/with"],["vor","before/in front"],["ab","away/off"],["an","on/contact"]].find(([p])=>x.startsWith(p));
   const words=prefix?" Prefix: "+prefix[0]+" can evoke '"+prefix[1]+"', but check the full verb meaning; this is not a universal translation.":"";
   const forms=[w.prateritum,w.partizip].filter(Boolean);
   return "🧠 Verb practice: "+german+" = "+english+". Use the exact expression in a work sentence."+words+(forms.length?" Past forms: "+forms.join(", ")+".":"");
 }
 if(w.grammar&&/Akkusativ|Dativ|Genitiv|verb.position|reflexiv/i.test(w.grammar)){
   return "🧠 Grammar clue for "+german+": "+clean(w.grammar).slice(0,190)+". Create a sentence about "+english+".";
 }
 return "📌 No individual mnemonic verified for "+german+" ("+english+"). Practise recalling it from the English meaning and a real sentence; a made-up generic story would not help.";
}

window.B2MnemonicEngine={describe,curatedCount:Object.keys(curated).length,version:"4.6"};
})();