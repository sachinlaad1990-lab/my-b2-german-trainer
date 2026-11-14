#!/usr/bin/env python3
"""Fix all 26 falsely letter-only A/B/C items, without inventing exam wording.

Original source: Alle Information_от 13.02.2025.pdf, 149 pages.
Six have complete choices across pages / inline / with labels d,e,f.
Twenty are fragments or ambiguous variants and MUST NOT be offered as A/B/C.
"""
import collections,hashlib,json,pathlib,re

path=pathlib.Path("exam-practice.html")
text=path.read_text(encoding="utf-8")
rx=re.compile(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',re.S)
m=rx.search(text)
assert m,"Missing original bank data"
bank=json.loads(m.group(2))
pages={p["page"]:p["original_text"] for p in bank["source_page_records"]}
assert len(pages)==149
norm=lambda s:re.sub(r"\s+","",s or "")
digest=hashlib.sha256("\n<<<PAGE>>>\n".join(norm(pages[p]) for p in sorted(pages)).encode("utf-8")).hexdigest()
assert digest=="460787d198cf8f5f8c4de2ceac076acd8284316083ae5b03021b980c76af53f2","Original PDF text checksum changed"

# Literal strings copied from the original pages. Do not add or correct punctuation,
# grammar, OCR artifacts, non-Latin marks, or the d/e/f labels used by the source.
complete={
 "set079-p88-q25-1": [(89,"a","kennen das neue Betriebssystem bereits."),(89,"b","müssen das ganze Wochenende in der Firma sein."),(89,"c","у werden in das neue Betriebssystem eingewiesen.")],
 "set079-p91-q33-1": [(92,"a","die Stimmung im Unternehmen ermittelt."),(92,"b","die Entwicklung der Firma dokumentierte"),(92,"c","ein Mitarbeiterprofil erstellt.")],
 "set085-p118-q33-1":[(118,"d","reklamiert einen Schaden."),(118,"e","trifft ihre Entscheidung aufgrund des Musters."),(118,"f","wundert sich über den Preisunterschied.")],
 "set085-p118-q35-1":[(119,"d","arbeitet diese Woche in einer anderen Gruppe."),(119,"e","kann diese Woche keinen Spätdienst übernehmen."),(119,"f","muss diese Woche zwei Gruppen betreuen.")],
 "set085-p121-q38-1":[(121,"a","benötigt Dokumente für das Steuer Büro"),(122,"b","bringt der Kollegin die Belege vorbei"),(122,"c","hat gestern das Steuer Büro angerufen")],
 "set089-p140-q34-1":[(140,"a","auf den Reinigungswagen legen."),(140,"b","in den Büros nachfüllen."),(140,"c","zur Reinigung der Schreibtische einsetzen.")]
}

schreiben=[
 "set044-p53-q19-1","set044-p53-q20-1","set045-p54-q19-1",
 "set046-p55-q19-2","set046-p55-q20-2",
 "set048-p57-q19-1","set048-p57-q20-1"]
old_variant=["set080-p97-q32-2","set080-p97-q33-2","set080-p97-q34-2","set080-p97-q35-2"]
single_messages=["set081-p102-q36-1","set081-p102-q37-1","set081-p102-q38-1","set081-p103-q40-1"]
matching_fragments=["set083-p111-q29-1","set083-p111-q30-1","set083-p111-q31-1","set083-p112-q32-1"]
incomplete=["set081-p99-q25-1"]
fragment_groups={
 "Beschwerde — answer fragments, no full A/B/C source":schreiben,
 "Hören — older variant contains only selected answer phrases":old_variant,
 "Hören — telephone-note answer fragments, no full A/B/C source":single_messages,
 "Hören — matching answers interleaved with dialogues; original option order not established":matching_fragments,
 "Hören — competing C options for the same question":incomplete
}
fragment_ids=set(sum(fragment_groups.values(),[]))
all_ids=set(complete)|fragment_ids
assert len(complete)==6 and len(fragment_ids)==20 and len(all_ids)==26

updates=[];unresolved=[];found=set()
for e in bank["exercises"]:
 if e.get("section") not in ("Lesen","Schreiben","Hören","Sprechen"):continue
 for q in e.get("questions",[]):
  id=q["id"]
  if id not in all_ids:continue
  found.add(id)
  assert q["kind"]=="mc",("Expected original MCQ",id,q["kind"])
  before_options=q.get("options") or []
  assert len(before_options)==3 and [o["value"] for o in before_options]==["a","b","c"],("Wrong existing choice order",id)
  assert all(o["label"].strip().upper()==o["value"].upper() for o in before_options),("Options already edited",id)
  before=q.get("completeness")
  if id in complete:
   expected=complete[id]
   options=[]
   for source_page,letter,label in expected:
    assert norm(label) in norm(pages[source_page]),("String not in source PDF",id,source_page,label)
    # Page where answer appears must be part of the source exercise.
    assert source_page in e["pages"],("Source page not in exercise",id,source_page,e["pages"])
    options.append({"value":letter,"label":label})
   assert len({o["value"] for o in options})==3
   q["options"]=options
   q["source_option_provenance"]="verbatim_pdf"
   q["completeness"]="transcript_review"
   q["completeness_reason"]="All displayed choices are transcribed verbatim from the original PDF, preserving their original labels and sequence. Audio is still needed to verify the answer."
   q["audit_review_date"]="2026-11-14"
   q["source_alt_note"]=((q.get("source_alt_note") or "")+" Options restored from PDF source pages "+", ".join(str(x) for x in dict.fromkeys(srcpage for srcpage,_,_ in expected))+". Letter labels and original wording preserved, including source typos; not an official answer key.").strip()
   updates.append({"id":id,"page":q["page"],"section":e["section"],"from":before,"to":q["completeness"],"original_choice_labels":[x["value"] for x in options],"options":options})
  else:
   group=next(k for k,v in fragment_groups.items() if id in v)
   source_letter=q.get("answer")
   # Question prompt is an existing SOURCE FRAGMENT, not a newly reconstructed stem.
   # Preserve the provided source-marked answer, but prevent false MCQ grading.
   q["kind"]="note"
   q["options"]=[]
   q["source_marked_answer_unofficial"]=source_letter
   q["answer"]=None
   q["source_option_provenance"]="no_mc_choices"
   q["completeness"]="source_incomplete"
   q["completeness_reason"]=("Original PDF only provides an answer fragment or conflicting variants; complete A/B/C wording is not available. "
     +"This is preserved as a NON-SCORABLE source fragment, not a reconstructed multiple-choice question. "
     +"Source note: "+q.get("prompt","")+
     (". Informal answer mark: "+source_letter.upper()+" (not official)." if source_letter else "."))
   q["source_alt_note"]=((q.get("source_alt_note") or "")+" Original source insufficient to present a faithful A/B/C question.").strip()
   unresolved.append({"id":id,"page":q["page"],"section":e["section"],"reason":group,"source_fragment":q["prompt"],"source_marked_answer_unofficial":source_letter})
assert found==all_ids,("Missing IDs",sorted(all_ids-found))
assert sum(len(e["questions"]) for e in bank["exercises"] if e.get("section") in ("Lesen","Schreiben","Hören","Sprechen"))==602
assert all(not(q["kind"]=="mc" and q.get("source_option_provenance")=="letter_only_not_extracted") for e in bank["exercises"] for q in e.get("questions",[]))

encoded=json.dumps(bank,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")
text=text[:m.start(2)]+encoded+text[m.end(2):]
path.write_text(text,encoding="utf-8")
statuses=dict(collections.Counter(q.get("completeness") for e in bank["exercises"] if e.get("section") in ("Lesen","Schreiben","Hören","Sprechen") for q in e["questions"]))
result={"reviewed":26,"restored_verbatim_options":len(updates),"source_incomplete_misclassified_mcqs":len(unresolved),
 "restored":updates,"unresolved":unresolved,"statuses_after":statuses,
 "policy":"Source PDF is the sole authority. No guessing, no paraphrasing, no invented choices. Source fragments remain unscored."}
pathlib.Path("qa/twenty-six-options-audit.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
print("26_ITEM_AUDIT",json.dumps({"reviewed":26,"restored":len(updates),"source_fragments":len(unresolved),"statuses":statuses}))
