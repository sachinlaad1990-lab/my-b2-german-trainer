#!/usr/bin/env python3
"""Publish user-approved review changes, preserving all original PDF text."""
import collections,copy,hashlib,json,pathlib,re
P=pathlib.Path("exam-practice.html")
s=P.read_text(encoding="utf-8")
pat=re.compile(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',re.S)
m=pat.search(s)
assert m
b=json.loads(m.group(2))
pages={x["page"]:x["original_text"] for x in b["source_page_records"]}
assert len(pages)==149
norm=lambda x:re.sub(r"\s+","",x or "")
sha=hashlib.sha256("\n<<<PAGE>>>\n".join(norm(pages[k]) for k in sorted(pages)).encode()).hexdigest()
assert sha=="460787d198cf8f5f8c4de2ceac076acd8284316083ae5b03021b980c76af53f2","Source PDF content changed"
def exact(page,value):
 assert value and norm(value) in norm(pages[page]),(page,value)
 return value
ex=[e for e in b["exercises"] if e["section"] in ("Lesen","Schreiben","Hören","Sprechen")]
items={q["id"]:(e,q) for e in ex for q in e["questions"]}
assert len(items)==602
def q(id):return items[id][1]
report={"source_hash":sha,"changes":[],"items_applied":[],"needs_further_review":[]}
def put(obj,key,value,why):
 if obj.get(key)!=value:
  report["changes"].append({"id":obj["id"],"field":key,"reason":why,"before":str(obj.get(key))[:130],"after":str(value)[:250]})
  obj[key]=value
def append_note(obj,note):
 old=obj.get("source_alt_note","")
 if note not in old:put(obj,"source_alt_note",(old+" "+note).strip(),"Source caveat")
r1=json.loads(pathlib.Path("qa/manual-review-batch-1-decisions.json").read_text())
r2=json.loads(pathlib.Path("qa/manual-review-batch-2-decisions.json").read_text())
r3=json.loads(pathlib.Path("qa/manual-review-batch-3-decisions.json").read_text())
r4=json.loads(pathlib.Path("qa/manual-review-final-item-31.json").read_text())
assert len(r1["items"])==10 and len(r2["entries"])==10 and len(r3["entries"])==10
assert [x["decision"] for x in r1["items"]]==["COMMENT"]*7+["APPROVE"]+["COMMENT"]*2
assert [x["decision"] for x in r2["entries"]]==["APPROVE"]*9+["COMMENT"]
assert all(x["decision"]=="APPROVE" for x in r3["entries"])
assert r4["item"]==31 and r4["decision"]=="APPROVE"
ids=json.loads(pathlib.Path("qa/first-ten-extraction-review.json").read_text())["all_ids"]
assert len(ids)==31

# #2: Keep both original 15 variants, clearly distinguish source German
# from the user-requested German TRANSLATION of a Russian source heading.
e,b15=items["set039-p45-q15-1"]
assert b15["number"]==15 and [o["value"] for o in b15["options"]]==list("abc")
pool_a=[
 ("a",exact(45,"da andere Urlaub machen.")),
 ("b",exact(45,"obwohl sie krank sind.")),
 ("c",exact(45,"weil viele Kollegen krank sind."))]
pool_b=[
 ("a",exact(45,"Arbeit wird nicht komplett erledigt")),
 ("b",exact(45,"Überstunden müssen im kommenden Jahr abgebaut werden")),
 ("c",exact(45,"Es gibt Urlaubssperre"))]
assert [o["label"] for o in b15["options"]]==[v for _,v in pool_b],"Second variant changed from PDF source"
a15=copy.deepcopy(b15)
a15.update(id="set039-p45-q15a-source",number="15a",prompt=exact(45,"Einige Mitarbeiter machen Überstunden."),
 options=[{"value":letter,"label":value} for letter,value in pool_a],
 answer=None,source=None,source_provenance="verbatim_pdf",source_option_provenance="verbatim_pdf",
 completeness="complete_source",
 completeness_reason="Original German question and choices copied literally from PDF page 45; no official answer supplied.",
 source_alt_note="15a is the first of two source variants on PDF page 45. All wording is original German from the PDF.")
assert a15["id"] not in items
e["questions"].insert(e["questions"].index(b15),a15)
report["changes"].append({"id":a15["id"],"field":"created","reason":"User requested both 15a and 15b, rather than one blended variant."})
put(b15,"number","15b","Label second source variant 15b")
put(b15,"prompt","Was gilt im Unternehmen?","User-requested German translation of source Russian, NOT original German PDF wording")
put(b15,"source_heading_original_russian",exact(45,"Что действует на предприятии"),"Keep original Russian heading")
put(b15,"source_provenance","editorial_practice_prompt","Translated heading, not original German")
put(b15,"source_option_provenance","verbatim_pdf","Original German options already copied exactly")
put(b15,"completeness","complete_source","German answer choices complete; translated heading explicitly labeled")
put(b15,"completeness_reason","German heading translated at the user's request from original Russian, and clearly labeled. Choices A/B/C reproduce the original PDF German wording; no official key is claimed.","Translation provenance")
append_note(b15,'15b: German translation (NOT original PDF German): "Was gilt im Unternehmen?". Original Russian: "Что действует на предприятии".')
report["items_applied"].append(2)

# #4: leave C blank and attribute B to the user, not an official key.
murat=q("set080-p97-q35-1")
assert murat["number"]==35 and [o["value"] for o in murat["options"]]==list("abc")
assert murat["options"][-1]["label"] in ("?","")
assert all(exact(97,o["label"]) for o in murat["options"][:2])
new=copy.deepcopy(murat["options"]);new[-1]["label"]=""
put(murat,"options",new,"User requested C be blank: source prints c) ?")
put(murat,"answer","b","User-selected practice answer B (unofficial)")
put(murat,"source","user-reviewed","User answer, not PDF/official solution")
put(murat,"completeness","source_incomplete","Source C missing")
put(murat,"completeness_reason","Original page 97 prints option c) ? with no wording. C intentionally blank. B is user-selected for practice and NOT an official key.","Distinguish incomplete source and unofficial key")
put(murat,"source_option_provenance","missing_source_c","Cannot claim all options verbatim")
append_note(murat,"Original source prints c) ?. Option C intentionally BLANK. Answer B is user-reviewed only; not an official key.")
report["items_applied"].append(4)

# #7: Barbara is a user-requested fill-in task, no fake MC options.
barbara=q("set081-missing-39")
assert barbara["number"]==39 and barbara["kind"]=="note"
heading=exact(103,"39.Barbara")
fragment=exact(103,"kümmert sich um die Verpflegung ober Gästen")
put(barbara,"kind","gap","User explicitly identified this as fill-in-the-blank")
put(barbara,"page",103,"Original Barbara transcript and source fragment")
put(barbara,"prompt",heading,"Literal PDF question heading")
put(barbara,"options",[],"No fabricated multiple-choice choices")
put(barbara,"answer",None,"No official scored text")
put(barbara,"source_provenance","verbatim_pdf","Literal source heading")
put(barbara,"source_option_provenance","no_mc_choices","User-requested free-text exercise")
put(barbara,"completeness","source_incomplete","Only one answer fragment is supplied; not a full MCQ source")
put(barbara,"completeness_reason","User-requested fill-in-the-blank. PDF page 103 provides transcript and a single answer fragment, not A/B/C. No automatic answer key.","Source still incomplete")
append_note(barbara,"PDF fragment: a) "+fragment+". Source sentence has not been rewritten. Fill-in format requested by user.")
report["items_applied"].append(7)

# #8: Andrea's option C continues on original page 108.
andrea=q("set082-p107-q36-1")
assert andrea["number"]==36 and [o["value"] for o in andrea["options"]]==["a","b"]
assert all(exact(107,o["label"]) for o in andrea["options"])
new=copy.deepcopy(andrea["options"])+[{"value":"c","label":exact(108,"möchte Termin vereinbaren/anmelden")}]
put(andrea,"options",new,"Restore verbatim C from next original PDF page")
put(andrea,"source_option_provenance","verbatim_pdf","All choices occur literally across source pages 107–108")
put(andrea,"completeness","transcript_review","Text complete, listening answer not audio verified")
put(andrea,"completeness_reason","All three choices copied literally from original PDF pages 107–108; audio not verified.","Preserve provenance")
append_note(andrea,"Option C continues on original PDF page 108. Listening solution remains unofficial.")
report["items_applied"].append(8)

# #24–27: original A–F matching choices with unofficial F D C B.
pool=[
 ("a",exact(119,"Regelungen zur Arbeitsunfähigkeit unterscheiden sich von Unternehmen zu Unternehmen.")),
 ("b",exact(119,"Die Arbeitsplatzgestaltung hat einen Einfluss auf die Gesundheit der Mitarbeiter.")),
 ("c",exact(119,"Arbeitgeber sollte mehr für die Hygiene im Betrieb tun.")),
 ("d",exact(119,"Manche Arbeitgeber bieten Maßnahmen für die Gesundheitsvorsorge an")),
 ("e",exact(119,"Das Wohlbefinden sollte ein wichtiges Anliegen sein.")),
 ("f",exact(119,"Bei Krankheit braucht man ab dem ersten Tag ein Attest vom Arzt."))]
marks={28:"f",29:"d",30:"c",31:"b"}
for num,itemno in zip((28,29,30,31),(24,25,26,27)):
 obj=q("set085-missing-"+str(num))
 assert obj["kind"]=="note" and obj["number"]==num and obj["completeness"]=="extraction_review"
 exact(119,"Nummer "+str(num)+".")
 exact(119,"Nummer "+str(num)+": "+marks[num]+")")
 put(obj,"page",119,"Question's source matching passage on page 119")
 put(obj,"prompt","Nummer "+str(num)+".","Original PDF heading, not invented")
 put(obj,"kind","mc","Original exercise is A–F matching")
 put(obj,"options",[{"value":k,"label":v} for k,v in pool],"Exact A–F pool in original source order")
 put(obj,"answer",marks[num],"Informal source-marked letter, not an official key")
 put(obj,"source","source-marked","Original PDF's informal contributor mark")
 put(obj,"source_provenance","verbatim_pdf","Literal PDF dialogue number")
 put(obj,"source_option_provenance","verbatim_pdf","Literal PDF A–F text")
 put(obj,"completeness","transcript_review","Original text usable, audio not independently verified")
 put(obj,"completeness_reason","Original A–F list and marked letter appear in PDF page 119; Question 31's transcript continues onto page 120. Marks are unofficial; audio not independently verified.","Source verification caveat")
 put(obj,"source_alt_note","Source-marked "+marks[num].upper()+" is not an official answer key. Original PDF contains the full A–F choices on page 119 and transcript continues onto page 120 for Q31.","Keep unofficial keys distinct")
 report["items_applied"].append(itemno)

# #11–19, #21–23, #28–31: retain all placeholders, with an accurate
# SOURCE-INCOMPLETE flag. No reconstructed wording or unrelated variants.
for itemno in list(range(11,20))+list(range(21,24))+list(range(28,32)):
 obj=q(ids[itemno-1])
 assert obj["kind"]=="note" and obj["completeness"] in ("extraction_review","source_incomplete"),obj["id"]
 put(obj,"completeness","source_incomplete","Approved: original source doesn't include a safely identifiable standalone task for this variant")
 put(obj,"completeness_reason","Reviewed original PDF: no unambiguous complete standalone question/options for this specific variant. Retain source pages; do not invent wording or borrow an unrelated variant.","Preserve missing source evidence")
 report["items_applied"].append(itemno)

# #1,3,5,6,9,10,20 deliberately pending further review.
for itemno in (1,3,5,6,9,10,20):
 obj=q(ids[itemno-1])
 assert obj["completeness"]=="extraction_review",obj["id"]
 report["needs_further_review"].append({"item":itemno,"id":obj["id"],"pdf_page":obj["page"]})

assert len(report["items_applied"])==24 and len(report["needs_further_review"])==7
assert set(report["items_applied"])==set((2,4,7,8,24,25,26,27,*range(11,20),*range(21,24),*range(28,32)))
allq=[q for e in ex for q in e["questions"]]
assert len(allq)==603 and len({q["id"] for q in allq})==603
assert len(PAGES) if False else len(pages)==149
for obj in allq:
 if obj["kind"]=="mc" and obj.get("answer") is not None:
  assert obj["answer"] in [x["value"] for x in obj["options"]],obj["id"]
assert q("set080-p97-q35-1")["options"][-1]["label"]==""
assert q("set081-missing-39")["kind"]=="gap"
assert q("set082-p107-q36-1")["options"][-1]["value"]=="c"
assert e["questions"][e["questions"].index(a15)+1]["id"]=="set039-p45-q15-1"

data=json.dumps(b,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")
m=pat.search(s);s=s[:m.start(2)]+data+s[m.end(2):]
P.write_text(s,encoding="utf-8")
statuses=collections.Counter(q.get("completeness") for q in allq)
bysec={sec:dict(collections.Counter(q.get("completeness") for e in ex if e["section"]==sec for q in e["questions"])) for sec in ("Lesen","Schreiben","Hören","Sprechen")}
report.update(total_questions=603,source_pages_preserved=149,by_section=bysec,by_status=dict(statuses),ready=statuses["complete_source"]+statuses["transcript_review"])
report["flagged"]=603-report["ready"]
report["disclaimer"]="The PDF is authoritative. Original German wording unchanged. Russian heading is translated and labeled. Source- and user-marked answers are unofficial; listening audio is unverified."
pathlib.Path("qa/approved-31-review-update-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
pathlib.Path("qa/question-bank-status.json").write_text(json.dumps({"total_questions":603,"exercise_groups":len(ex),"statuses":dict(statuses),"by_section":bysec,"ready_for_practice":report["ready"],"flagged":report["flagged"],"pdf_pages_preserved":149,"note":report["disclaimer"]},ensure_ascii=False,indent=2),encoding="utf-8")
print("REVIEW_APPLIED",json.dumps({"items_applied":24,"held_for_review":7,"total":603,"status":dict(statuses),"ready":report["ready"],"flagged":report["flagged"]}))
