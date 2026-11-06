/* Article Trainer explanations and 1,000 contextual English meanings; source is in-app. */
(function(){
'use strict';
const data=window.ARTICLE_DATA,batches=window.ARTICLE_ENGLISH_BATCHES||{};
if(!data||!Array.isArray(data.nouns))return;
const byId=new Map(data.nouns.map(w=>[w.id,w]));
for(let cluster=1;cluster<=40;cluster++){
 const items=batches[cluster];
 if(!Array.isArray(items)||items.length!==25)throw Error('Missing English nouns in cluster '+cluster);
 items.forEach((translation,index)=>{const word=byId.get((cluster-1)*25+index+1);if(!word||!translation)throw Error('Invalid English gloss at '+cluster+' / '+index);word.english=translation});
}
const endings=[
 ['die','-ung','-ung is a reliable noun-forming suffix: die Bewerbung, die Rechnung. DER SPRUNG is not the same suffix.'],
 ['die','-heit','-heit makes feminine nouns: die Freiheit, die Gesundheit.'],
 ['die','-keit','-keit makes feminine nouns: die Möglichkeit, die Schwierigkeit.'],
 ['die','-schaft','-schaft makes feminine nouns: die Freundschaft, die Mannschaft.'],
 ['die','-ität','-ität makes feminine nouns: die Qualität, die Mobilität.'],
 ['die','-tion','-tion frequently marks a feminine noun: die Produktion, die Information.'],
 ['die','-ion','-ion frequently marks feminine nouns: die Region, die Situation.'],
 ['die','-ei','-ei as a noun suffix is feminine: die Bäckerei, die Druckerei.'],
 ['das','-chen','Diminutives ending in -chen are always neuter: das Mädchen, das Brötchen.'],
 ['das','-lein','Diminutives ending in -lein are always neuter: das Büchlein.']
];
const fixedCompounds=[
 ['Vorstellungsgespräch','das Gespräch'],['Bewerbungsgespräch','das Gespräch'],['Arbeitsvertrag','der Vertrag'],['Tarifvertrag','der Vertrag'],['Mietvertrag','der Vertrag'],
 ['Arbeitszeit','die Zeit'],['Probezeit','die Zeit'],['Kernzeit','die Zeit'],['Gleitzeit','die Zeit'],['Teilzeit','die Zeit'],['Vollzeit','die Zeit'],
 ['Bewerbungsfrist','die Frist'],['Kündigungsfrist','die Frist'],['Lieferfrist','die Frist'],
 ['Projektplan','der Plan'],['Schichtplan','der Plan'],['Dienstplan','der Plan'],['Zeitplan','der Plan'],
 ['Projektziel','das Ziel'],['Zahlungsziel','das Ziel'],['Projektphase','die Phase'],
 ['Personalabteilung','die Abteilung'],['Qualitätssicherung','die Sicherung'],['Gehaltsabrechnung','die Abrechnung'],
 ['Arbeitsunfähigkeitsbescheinigung','die Bescheinigung'],['Nebenkostenabrechnung','die Abrechnung'],['Tagesordnungspunkt','der Punkt'],
 ['Bewerbungsfoto','das Foto'],['Dienstreise','die Reise'],['Videokonferenz','die Konferenz']
];
const special={
 'Nacht':'Exception: most parts of the day are masculine (der Morgen, der Abend), but DIE NACHT. Remember night as the one exception.',
 'Ende':'Exception to the common -e tendency: DAS ENDE, although many nouns ending in -e are feminine.',
 'Auge':'Exception to -e tendency: DAS AUGE, not die Auge.',
 'Kunde':'Masculine person noun ending -e: DER KUNDE. It also belongs to N-declension: den Kunden, dem Kunden.',
 'Kollege':'Masculine person noun ending -e: DER KOLLEGE; den Kollegen / dem Kollegen.',
 'Name':'Masculine exception: DER NAME. N-declension: den Namen, des Namens.',
 'Ergebnis':'-nis is mixed, not a reliable gender rule. This word is DAS ERGEBNIS. Learn it together with its article.',
 'Kenntnis':'-nis can also be feminine: DIE KENNTNIS. Compare DAS ERGEBNIS.',
 'Erlaubnis':'-nis can be feminine: DIE ERLAUBNIS. Compare DAS ZEUGNIS.',
 'Vorgesetzte':'This is an adjective-derived person noun: DER VORGESETZTE (male) or DIE VORGESETZTE (female). The gender comes from the person being described.',
 'Software':'DIE SOFTWARE is a borrowed tech word; do not apply a universal English-loanword gender rule.',
 'Hardware':'DIE HARDWARE is a borrowed tech word; learn its article with the word.',
 'Moment':'DER MOMENT means a moment, although -ment often appears in neuter loans (das Dokument).',
 'Irrtum':'DER IRRTUM: -tum is not always DAS. Compare DAS EIGENTUM.',
 'Reichtum':'DER REICHTUM, unlike DAS EIGENTUM: -tum is a mixed pattern.',
 'Fenster':'DAS FENSTER: -er does not guarantee masculine for objects; compare DER DRUCKER.',
 'Messer':'DAS MESSER: -er is not a reliable masculine noun ending for all objects.',
 'Mutter':'DIE MUTTER: another -er exception.',
 'Woche':'DIE WOCHE; days of the week are DER, but the category word Woche is feminine.',
 'Jahr':'DAS JAHR; months and seasons are DER, but Jahr is neuter.'
};
const irregularPrefix='No dependable suffix rule applies here. Remember this word as one unit: ';
const words=data.nouns;
const compoundBases=words.filter(w=>w.noun.length>=3);
function explanation(w){
 const n=w.noun,a=w.article;
 if(special[n])return special[n]+' Memory phrase: '+a+' '+n+'.';
 for(const [word,root] of fixedCompounds)if(n===word)return 'Compound rule: the LAST noun decides the gender. '+root.toUpperCase()+' → '+a.toUpperCase()+' '+n+'. Say the last part aloud to remember the article.';
 for(const [article,suffix,description] of endings)if(a===article&&n.toLocaleLowerCase('de-DE').endsWith(suffix.replace(/^-/,''))&&n.length>suffix.length+2)return description+' This word: '+a+' '+n+'.';
 if(w.cluster===1&&(w.id<=23))return 'Category rule: named weekdays, months and seasons are masculine → DER. Learn '+a+' '+n+'.';
 if(w.cluster===3&&w.id<=54)return 'Category rule: cardinal directions are masculine: der Norden, Süden, Osten, Westen. This word: '+a+' '+n+'.';
 if(a==='die'&&(/(erin|entin|istin|antin)$/.test(n)||['Kollegin','Chefin','Kundin','Ärztin','Anwältin','Partnerin','Freundin','Studentin','Nachbarin','Dozentin','Projektleiterin','Mieterin'].includes(n)||w.cluster===9))return 'Feminine person or job title: the suffix -in (often -erin, -entin, -istin) forms DIE. Pair it with the male form when available: der Mitarbeiter → die Mitarbeiterin. This one is DIE '+n+'.';
 if(w.cluster===8&&/(ant|ent|ist|er)$/.test(n))return 'Male profession/person noun: usually DER in this group. Learn '+a+' '+n+'; be careful with objects ending -er.';
 if(a==='das'&&w.cluster===10&&/en$/.test(n)&&w.id>=245)return 'A verb used as a noun (nominalised infinitive) takes DAS: das Lernen, das Arbeiten. Capitalise it.';
 const candidates=compoundBases.filter(base=>base.id!==w.id&&base.article===a&&n.endsWith(base.noun)&&n.length-base.noun.length>=3&&base.noun.length>=4).sort((x,y)=>y.noun.length-x.noun.length);
 if(candidates.length){const root=candidates[0];return 'Compound rule: last noun '+root.article+' '+root.noun+' determines the whole compound → '+a+' '+n+'. Memory: focus on the final noun, not the first part.';}
 if(a==='die'&&/e$/.test(n))return 'Useful tendency: many nouns ending in -e are feminine. But there are exceptions (der Kunde, das Ende). Memorise DIE '+n+'.';
 return irregularPrefix+a+' '+n+'. Make a short mental picture and say the whole phrase aloud. Category: '+(data.clusters[w.cluster-1]?.name||'everyday German')+'.';
}
for(const word of words)word.memoryTip=explanation(word);
window.ARTICLE_TRAINER_ENRICHED=true;
})();