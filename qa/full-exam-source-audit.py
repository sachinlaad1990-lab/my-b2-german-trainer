#!/usr/bin/env python3
"""Audit all digital questions against the PDF's verbatim page-text records.
PDF text fidelity was independently verified against all 149 PDF pages.
Only source-exact, unambiguous corrections are applied.
"""
import collections,hashlib,json,pathlib,re

file=pathlib.Path("exam-practice.html")
s=file.read_text(encoding="utf-8")
pat=re.compile(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',re.S)
match=pat.search(s)
assert match
bank=json.loads(match.group(2))
pages={p["page"]:p["original_text"] for p in bank["source_page_records"]}
assert len(pages)==149
norm=lambda x:re.sub(r"\s+","",x or "")
digest=hashlib.sha256("\n<<<PAGE>>>\n".join(norm(pages[p]) for p in sorted(pages)).encode()).hexdigest()
assert digest=="460787d198cf8f5f8c4de2ceac076acd8284316083ae5b03021b980c76af53f2","Original page content changed; stop audit"
ex=[e for e in bank["exercises"] if e["section"] in ("Lesen","Schreiben","Hören","Sprechen")]
assert sum(len(e["questions"]) for e in ex)==602
changes=[];restored=[]
def change(q,k,v,reason):
 if q.get(k)!=v:
  changes.append({"id":q["id"],"page":q["page"],"field":k,"old":str(q.get(k))[:170],"new":str(v)[:220],"reason":reason})
  q[k]=v
def has(q,s):return bool(s and norm(s) in norm(pages.get(q["page"],"")))
def in_set(e,s):return bool(s and norm(s) in norm("\n".join(pages[p] for p in e["pages"])))
def add_note(q,s):
 before=q.get("source_alt_note","")
 if s not in before:change(q,"source_alt_note",(before+" "+s).strip(),"Preserve editorial caveat")

for e in ex:
 for q in e["questions"]:
  id=q["id"]
  if id in ("set020-p20-q8-1","set020-p20-q8-2","set022-p22-q8-1","set022-p22-q8-2"):
   before=q["prompt"]
   literal=re.split(r"\s+(?:Older version|New variant|Updated version)",before,maxsplit=1)[0]
   if literal!=before and has(q,literal):
    change(q,"prompt",literal,"Remove English version note from original German question")
    add_note(q,"The separate source-version annotation is not part of the question.")
  if id=="set020-p20-q8-2":
   change(q,"kind","tf","The original PDF explicitly identifies question 8 as Richtig/falsch")
   change(q,"options",[{"value":"richtig","label":"Richtig"},{"value":"falsch","label":"Falsch"}],"Restore original response type")
   change(q,"completeness","complete_source","Original task format recovered")
  if id=="set036-p39-q14-1":
   literal="Der Termin der nächsten Sitzung"
   if has(q,literal):
    change(q,"prompt",literal,"Remove interspersed version note and answer option")
    add_note(q,"Page 39 has a separate editorial variant note after this question.")
  if id.startswith("set079-matching-89-"):
   choices=q.get("options") or []
   if any(o["value"]=="f" and not in_set(e,o["label"]) for o in choices):
    change(q,"options",[o for o in choices if o["value"]!="f"],"PDF page 89 gives only choices a-e; remove invented F")
    change(q,"completeness","extraction_review","Missing option F in the original PDF")
    add_note(q,"Only a-e are in the original PDF. F is absent. Do not invent an answer.")
  if id=="set082-p107-q34-1":
   literal="wird die Logo-Entwürfe erst Ende März sehen"
   if has(q,literal) and q["options"][2]["label"].startswith(literal):
    new=[dict(o) for o in q["options"]];new[2]["label"]=literal
    change(q,"options",new,"Remove translated commentary from option C")
    add_note(q,"The PDF contains a separate editorial warning after option C.")
  if id in ("set086-p125-q34-1","set086-p125-q35-1"):
   new=[dict(o) for o in q["options"]]
   for o in new:
    before=o["label"]
    literal=re.sub(r"\s*\((?:marked on the photocopied exercise|answer marked in source)\)\s*$","",before)
    literal=re.sub(r"\s*\.\s*\.\s*$",".",literal)
    if literal!=before and has(q,literal):o["label"]=literal
   if new!=q["options"]:
    change(q,"options",new,"Remove English explanations inserted into German choices")
    add_note(q,"Russian source annotations are separately visible in the original PDF text.")
  if id=="set093-speak-11":
   before=q["prompt"]
   if "\n-Drucker/" in before:
    literal=before.split("\n-Drucker/",1)[0].rstrip()
    if has(q,literal):
     change(q,"prompt",literal,"Remove unrelated Sprechen topics and explanatory link appended to situation")
     add_note(q,"Following topics are separate source entries.")
  if q["kind"]=="free" and e["detail"]=="Forumsbeitrag" and q["prompt"].startswith("Forumsbeitrag – "):
   literal=q["prompt"].split("Forumsbeitrag – ",1)[1]
   if has(q,literal):change(q,"prompt",literal,"Remove editorial prefix to display verbatim forum topic")

# Strict A/B/C recovery. The PDF must contain a unique complete block with
# the EXACT SAME question stem. No fuzzy reconstruction permitted.
q_re=re.compile(r"^\s*(\d{1,2})\s*[.):]?\s+(.{2,})$")
o_re=re.compile(r"^\s*([aаbсc])\s*[).]?\s+(.{4,})$",re.I)
def from_page(q):
 lines=pages[q["page"]].splitlines()
 candidates=[]
 for i,line in enumerate(lines):
  mm=q_re.match(line)
  if not mm or int(mm.group(1))!=q["number"]:continue
  stem=norm(mm.group(2)).rstrip(":.")
  p=norm(q["prompt"]).rstrip(":.")
  if p!=stem and not (len(p)>6 and stem.startswith(p) and len(stem)-len(p)<3):continue
  found={};sequence=[]
  for line2 in lines[i+1:i+17]:
   if q_re.match(line2):break
   oo=o_re.match(line2)
   if not oo:continue
   k=oo.group(1).lower().replace("а","a").replace("с","c")
   val=oo.group(2).strip()
   if k not in ("a","b","c") or k in found:break
   if re.search(r"\s{4,}[aаbсc]\s+",val,re.I):break
   found[k]=val;sequence.append(k)
   if len(found)==3:break
  if sequence==["a","b","c"]:
   candidates.append([{"value":k,"label":found[k]} for k in ("a","b","c")])
 return candidates[0] if len(candidates)==1 else None

for e in ex:
 for q in e["questions"]:
  options=q.get("options") or []
  if q["kind"]!="mc" or e["detail"] in ("Teil 1","Teil 3"):continue
  if len(options)!=3 or {o["value"] for o in options}!={"a","b","c"}:continue
  if not all(o["label"].strip().upper()==o["value"].upper() for o in options):continue
  picked=from_page(q)
  if not picked:continue
  assert all(has(q,o["label"]) for o in picked)
  change(q,"options",picked,"Restore all three German choices exactly from PDF")
  if q.get("completeness")=="extraction_review":
   change(q,"completeness","transcript_review" if e["section"]=="Hören" else "complete_source","Verified question choices restored; audio answers not verified")
  if q.get("source_alt_note","").startswith("INCOMPLETE DIGITAL OPTIONS:"):
   change(q,"source_alt_note","All three choices restored verbatim from the original PDF; answer annotations are unofficial.","Replace stale flag after exact restoration")
  restored.append(q["id"])

counts=collections.Counter();opt_counts=collections.Counter();by_section=collections.defaultdict(collections.Counter)
unverified=[]
for e in ex:
 for q in e["questions"]:
  prompt=q.get("prompt","")
  if has(q,prompt): provenance="verbatim_pdf"
  elif q["kind"] in ("gap","note") or e["detail"] in ("Telefonnotiz","Forumsbeitrag") or prompt.startswith("Gespräch "):
   provenance="editorial_practice_prompt"
  else:provenance="not_verbatim_pdf"
  opts=q.get("options") or []
  if q["kind"]=="tf":option_status="standard_richtig_falsch_controls"
  elif q["kind"]=="mc" and e["detail"] in ("Teil 1","Teil 3") and all(len(o["label"])==1 for o in opts):
   option_status="source_matching_letters"
  elif q["kind"]=="mc":
   if any(o["label"].strip().upper()==str(o["value"]).upper() for o in opts):
    option_status="letter_only_not_extracted"
   elif all(in_set(e,o["label"]) for o in opts):
    option_status="verbatim_pdf"
   else:option_status="some_options_not_in_pdf"
  else:option_status="no_mc_choices"
  change(q,"source_provenance",provenance,"Report literal question wording status")
  change(q,"source_option_provenance",option_status,"Report literal option wording status")
  if option_status=="some_options_not_in_pdf" and q.get("completeness") in ("complete_source","transcript_review"):
   change(q,"completeness","extraction_review","Never call unverified options source-complete")
  if q.get("answer") is not None and q["kind"]=="mc":
   assert q["answer"] in [o["value"] for o in opts],q["id"]
  counts[provenance]+=1;opt_counts[option_status]+=1;by_section[e["section"]][provenance]+=1
  if provenance=="not_verbatim_pdf" or option_status in ("letter_only_not_extracted","some_options_not_in_pdf"):
   unverified.append({"id":q["id"],"page":q["page"],"section":e["section"],"prompt":prompt[:200],"provenance":provenance,"options":option_status,"status":q.get("completeness")})

encoded=json.dumps(bank,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")
match=pat.search(s)
s=s[:match.start(2)]+encoded+s[match.end(2):]
file.write_text(s,encoding="utf-8")
report={"pdf_source":"Alle Information_от 13.02.2025.pdf","pdf_pages_verified":149,"normalized_pdf_sha256":digest,"total_questions":602,"restored_choices_question_ids":restored,"changes":changes,"provenance":dict(counts),"option_provenance":dict(opt_counts),"by_section":{k:dict(v) for k,v in by_section.items()},"review_needed":unverified,"question_statuses":dict(collections.Counter(q.get("completeness") for e in ex for q in e["questions"])),"warning":"Verbatim means exact match to the original PDF text after whitespace normalization; no official answer-key or audio verification is claimed."}
pathlib.Path("qa/full-exam-source-audit.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print("FULL_SOURCE_AUDIT",json.dumps({"pdf_pages":149,"questions":602,"restored_choices":len(restored),"changes":len(changes),"provenance":dict(counts),"options":dict(opt_counts),"question_statuses":report["question_statuses"]}))
