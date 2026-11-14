#!/usr/bin/env python3
"""Remove only added editorial prefixes from eight speaking topics on PDF page 145."""
import json,re,pathlib,collections
path=pathlib.Path("exam-practice.html")
s=path.read_text(encoding="utf-8")
m=re.search(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',s,re.S)
assert m
bank=json.loads(m.group(2))
page=next(p["original_text"] for p in bank["source_page_records"] if p["page"]==145)
norm=lambda t:re.sub(r"\s+","",t or "")
changes=[]
for e in bank["exercises"]:
 for q in e["questions"]:
  if not re.fullmatch(r"set093-extra-[1-8]",q["id"]):continue
  old=q["prompt"]
  prefix="Zusätzliches mündliches Thema: "
  assert old.startswith(prefix),q["id"]
  source_line="-"+old[len(prefix):]
  assert norm(source_line) in norm(page),(q["id"],source_line)
  q["prompt"]=source_line
  q["source_provenance"]="verbatim_pdf"
  q["source_alt_note"]="Original PDF bullet reproduced without an added app-generated heading. This is a speaking practice topic, not an automatically scored question."
  changes.append({"id":q["id"],"before":old,"after":source_line})
assert len(changes)==8
assert sum(len(e["questions"]) for e in bank["exercises"] if e.get("section") in ("Lesen","Schreiben","Hören","Sprechen"))==602
payload=json.dumps(bank,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")
s=s[:m.start(2)]+payload+s[m.end(2):]
path.write_text(s,encoding="utf-8")
pathlib.Path("qa/speaking-verbatim-fixes.json").write_text(json.dumps({"repaired":8,"items":changes},ensure_ascii=False,indent=2),encoding="utf-8")
print("SPEAKING_VERBATIM",len(changes))
