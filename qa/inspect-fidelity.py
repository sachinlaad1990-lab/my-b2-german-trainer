#!/usr/bin/env python3
import json,re,pathlib,collections
s=pathlib.Path("exam-practice.html").read_text(encoding="utf-8")
m=re.search(r'<script id="bank-data" type="application/json">(.*?)</script>',s,re.S)
assert m
b=json.loads(m.group(1))
p={x["page"]:x["original_text"] for x in b["source_page_records"]}
rows=[]
for e in b["exercises"]:
 if e["section"] not in ("Lesen","Schreiben","Hören","Sprechen"):continue
 for q in e["questions"]:
  unusual=q.get("completeness") in ("extraction_review","source_incomplete") or q.get("source_provenance")=="not_verbatim_pdf" or q.get("source_option_provenance") in ("some_options_not_in_pdf","letter_only_not_extracted")
  if not unusual:continue
  page=p.get(q.get("page"),"")
  n=str(q.get("number"))
  hits=list(re.finditer(r'(?m)^\s*'+re.escape(n)+r'\s*[.):-]?\s+',page))
  snippets=[page[max(0,x.start()-60):min(len(page),x.start()+650)] for x in hits[:3]]
  rows.append({"id":q["id"],"page":q.get("page"),"section":e["section"],"detail":e.get("detail"),"kind":q.get("kind"),"number":q.get("number"),"prompt":q.get("prompt"),"options":q.get("options"),"answer":q.get("answer"),"source":q.get("source"),"status":q.get("completeness"),"reason":q.get("completeness_reason"),"provenance":q.get("source_provenance"),"option_provenance":q.get("source_option_provenance"),"source_snippets":snippets})
pathlib.Path("qa/fidelity-review-details.json").write_text(json.dumps({"n":len(rows),"rows":rows},ensure_ascii=False,indent=2),encoding="utf-8")
review=[r for r in rows if r["status"]=="extraction_review"]
pathlib.Path("qa/first-ten-extraction-review.json").write_text(json.dumps({"count":len(review),"first_ten":review[:10],"all_ids":[r["id"] for r in review]},ensure_ascii=False,indent=2))
print("INSPECT",len(rows),collections.Counter(x["section"] for x in rows),"REMAINING",len(review))
