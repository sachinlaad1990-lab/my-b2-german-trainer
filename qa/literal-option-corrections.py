#!/usr/bin/env python3
"""Repair selected option-wording discrepancies only with literal source substrings.

No grammar fixes, translations, or guessed answer keys are permitted.
"""
import json,re,pathlib,collections
file=pathlib.Path("exam-practice.html")
s=file.read_text(encoding="utf-8")
m=re.search(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',s,re.S)
assert m
b=json.loads(m.group(2))
pages={p["page"]:p["original_text"] for p in b["source_page_records"]}
assert len(pages)==149
norm=lambda t:re.sub(r'\s+','',t or '')
replacements={
 "set036-p39-q14-1":{"c":"wurde während der Sitzung gesprochen."},
 "set037-p41-q15-1":{"a":"hat bereits ein Konzept vorbereitet","b":"ist dienstlich verhindert"},
 "set038-p43-q15-1":{"b":"realisiert bis Marz die Maßnahmen zur Qualitätssicherung."},
 "set038-p43-q17-1":{"c":"wird an der Informationstafel bekanntgegeben"},
 "set038-p43-q18-1":{"c":"macht Frau Schmidt ein Geschenk"},
 "set039-p45-q14-1":{"b":"wie Tagesordnung genehmigt","c":"über Personalthemen gesprochen"},
 "set039-p45-q15-1":{"a":"Arbeit wird nicht komplett erledigt","b":"Überstunden müssen im kommenden Jahr abgebaut werden","c":"Es gibt Urlaubssperre"},
 "set039-p45-q17-1":{"a":"besucht die Frühjahrsmesse regelmäßig","c":"lässt gerade Broschüren drucken"},
 "set040-p47-q14-1":{"b":"ist wegen der schlechten Verkaufszahlen notwendig"},
 "set040-p47-q15-1":{"a":"hält sich nicht an die vereinbarten Putzreiten","b":"putzt die Büros der Firma nicht regelmäßig"},
 "set040-p47-q16-1":{"a":"ist nur mit begrenzter Teilnehmerzahl möglich"},
 "set040-p47-q17-1":{"b":"kann in der Personalabteilung beantragt werden"},
 "set040-p47-q18-1":{"c":"führte zu Lieferproblemen"},
 "set051-p60-q20-1":{"c":"umfasst 50 T-Shirts"}
}
# Q18 p43 is labeled Q19 by the original PDF: do not conceal that mismatch.
ambiguous={"set038-p43-q18-1","set039-p45-q15-1"}
updates=[]
found=set()
for e in b["exercises"]:
 for q in e["questions"]:
  qid=q["id"]
  if qid not in replacements:continue
  found.add(qid)
  old_options=[dict(o) for o in q["options"]]
  assert q["kind"]=="mc" and len(old_options)==3
  new=[dict(o) for o in old_options]
  for o in new:
   if o["value"] in replacements[qid]:
    exact=replacements[qid][o["value"]]
    assert norm(exact) in norm(pages[q["page"]]),(qid,exact)
    o["label"]=exact
  # At this point all three actual displayed options must occur literally in
  # the original PDF text, not in editorial paraphrases.
  assert all(norm(o["label"]) in norm(pages[q["page"]]) for o in new),(qid,new)
  q["options"]=new
  q["source_option_provenance"]="verbatim_pdf"
  before=q.get("completeness")
  if qid not in ambiguous and before=="extraction_review":q["completeness"]="complete_source"
  if qid=="set038-p43-q18-1":
   q["completeness_reason"]="Options are literal, but the original PDF labels this Frau Schlosser question 19 and the preceding option block 18. Verify the source numbering."
   q["source_alt_note"]="Original PDF page 43 contains a numbering/line-placement conflict between questions 17–19. Choices are copied literally; source numbering still needs review."
  elif qid=="set039-p45-q15-1":
   q["completeness_reason"]="Source page includes two interleaved variants of question 15. Options match the second variant literally; the English question label is editorial and the answer remains unofficial."
   q["source_alt_note"]="PDF page 45 contains two question-15 variants in parallel columns. This question represents the variant titled “Что действует на предприятии” in Russian. The English instruction is a translation, not original German text."
  else:
   q["completeness_reason"]="All three German options match the original PDF text character-for-character. Answer key, if any, is unofficial."
   q["source_alt_note"]=((q.get("source_alt_note") or "")+" Literal German answer choices verified against original PDF, without spelling or punctuation modernization.").strip()
  updates.append({"id":qid,"page":q["page"],"previous_status":before,"new_status":q.get("completeness"),"before":old_options,"after":new})
assert found==set(replacements),{"missing":sorted(set(replacements)-found)}
assert sum(len(e["questions"]) for e in b["exercises"] if e.get("section") in ("Lesen","Schreiben","Hören","Sprechen"))==602
encoded=json.dumps(b,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")
s=s[:m.start(2)]+encoded+s[m.end(2):]
file.write_text(s,encoding="utf-8")
status=dict(collections.Counter(q.get("completeness") for e in b["exercises"] if e.get("section") in ("Lesen","Schreiben","Hören","Sprechen") for q in e["questions"]))
report={"corrected_option_groups":len(updates),"remaining_mixed_variants":sorted(ambiguous),"changes":updates,"status_after":status,"note":"Only characters copied literally from original PDF; unverified answer keys not treated as official."}
pathlib.Path("qa/literal-option-corrections-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
print("LITERAL_OPTION_CORRECTIONS",len(updates),status)
