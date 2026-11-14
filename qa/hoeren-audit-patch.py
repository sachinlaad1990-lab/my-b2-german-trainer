#!/usr/bin/env python3
"""Apply a conservative, repeatable Hören transcript review to the live question bank."""
import pathlib,json,re,collections
file=pathlib.Path("exam-practice.html")
s=file.read_text(encoding="utf-8")
m=re.search(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',s,re.S)
assert m,"Missing question bank"
bank=json.loads(m.group(2))
sets=[e for e in bank["exercises"] if e.get("section")=="Hören"]
assert len(sets)==11
before=collections.Counter(q.get("completeness") for e in sets for q in e["questions"])
report={"sets":len(sets),"before":dict(before),"updates":[],"answers_added":[],"unresolved":[]}

def pool_from_source(src):
 lines=src.splitlines()
 for i,line in enumerate(lines):
  if not re.match(r'^\s*[aа][).]?\s+\S',line,re.I):continue
  opts={};cursor=i
  for key in "abcdef":
   pat=r'^\s*'+("[aа]" if key=="a" else key)+r'[).]?\s+(.+)'
   found=next(((j,re.match(pat,lines[j],re.I)) for j in range(cursor,min(len(lines),cursor+5)) if re.match(pat,lines[j],re.I)),None)
   if not found:break
   j,ma=found;val=ma.group(1).strip()
   if j+1<len(lines) and j+1<cursor+5 and not re.match(r'^\s*[a-f][).]?\s+',lines[j+1],re.I):
    follow=lines[j+1].strip()
    if len(val)<42 and 0<len(follow)<75 and not re.match(r'^(Nummer|Hören|\d{2}\.)',follow,re.I):val+=" "+follow
   opts[key]=re.sub(r'\s+',' ',val);cursor=j+1
  if len(opts)==6 and all(len(v)>=14 for v in opts.values()):
   return [{"value":k,"label":v} for k,v in opts.items()]
 return []

def source_keys(src):
 out={}
 for line in src.splitlines():
  x=re.match(r'^\s*(?:Nummer\s+)?(2[8-9]|3[0-1])\s*(?:(?:\.+|…|:)\s*)+(?:[.\s…]*)\(?([a-f])\)?(?:\s*$|\s+)',line,re.I)
  if x:out[int(x.group(1))]=x.group(2).lower()
 return out

def usable(q):
 options=q.get("options") or []
 if q.get("kind")=="tf":return {o.get("value") for o in options}=={"richtig","falsch"}
 if q.get("kind")!="mc":return False
 return len(options)>=3 and len({o.get("value") for o in options})==len(options) and all(
  len(o.get("label","").strip())>=4 and
  o.get("label","").strip().lower()!=str(o.get("value","")).strip().lower() and
  not re.fullmatch(r'[abc?]\.?',o.get("label","").strip(),re.I) for o in options)

for e in sets:
 pool=pool_from_source(e.get("text",""));keys=source_keys(e.get("text",""))
 for q in e["questions"]:
  old=q.get("completeness")
  match=q.get("number") in (28,29,30,31) and ("-matching-" in q.get("id","") or (q.get("prompt") or "").strip().startswith(("…","...")))
  if match and pool and q.get("kind")=="mc":
   q["options"]=pool
   q["prompt"]=f"Gespräch {q['number']} — Welcher Satz (a–f) passt am besten?"
   note=q.get("source_alt_note","")
   if "Matching choices a–f restored" not in note:
    q["source_alt_note"]=(note+" Matching choices a–f restored from the source PDF text (line wraps normalized).").strip()
   if q.get("answer") is None and q["number"] in keys and keys[q["number"]] in {x["value"] for x in pool}:
    q["answer"]=keys[q["number"]]
    q["source"]="source-inferred"
    q["source_alt_note"]+=" Suggested answer "+q["answer"].upper()+" comes from an informal source annotation, not an official key."
    report["answers_added"].append({"id":q["id"],"answer":q["answer"],"basis":"informal source annotation, not official"})
  prompt=(q.get("prompt") or "").strip()
  if usable(q) and len(prompt)>2 and not re.search(r'exact complete question|wording unavailable|question has not been reliably',prompt,re.I):
   q["completeness"]="transcript_review"
   q["completeness_reason"]="The source PDF provides this question and its options. Audio is required to verify any listening answer independently; marked transcript answers are unofficial."
   q["audit_review_date"]="2026-11-14"
   if old!=q["completeness"]:report["updates"].append({"id":q["id"],"from":old,"to":"transcript_review"})
  else:report["unresolved"].append({"id":q["id"],"page":q.get("page"),"status":q.get("completeness"),"reason":"Check source wording/options; recording may be needed"})
 e["completeness"]="transcript_review"
 e["completeness_reason"]="Transcript and source question text are available. Add an audio recording later; annotations are not official keys."

report["after"]=dict(collections.Counter(q.get("completeness") for e in sets for q in e["questions"]))
report["total"]=sum(len(e["questions"]) for e in sets)
report["keyed"]=sum(q.get("answer") is not None for e in sets for q in e["questions"])
assert report["total"]==218
encoded=json.dumps(bank,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")
s=s[:m.start(2)]+encoded+s[m.end(2):]
old="requires_audio:'Recording required',manual_review:'Manual review'"
new="requires_audio:'Recording required',transcript_review:'Transcript present · audio unverified',manual_review:'Manual review'"
if old in s:s=s.replace(old,new,1)
assert "transcript_review:" in s
hook="const byId=Object.fromEntries(sets.map(s=>[s.id,s]));"
if "window.__b2AudioExercise" not in s:
 assert hook in s
 s=s.replace(hook,hook+"\nwindow.__b2AudioExercise=()=>byId[s.current];",1)
if "b2beruf-listening-audio-v1" not in s:
 css='''<style>.local-audio-box{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:13px 15px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:10px}.local-audio-player{display:flex;gap:10px;align-items:center;flex-wrap:wrap;width:100%;font-size:12px}.local-audio-picker{cursor:pointer}</style>'''
 audio_js='''<script src="hoeren-audio-local.js" defer></script>'''
 assert "</body>" in s
 s=s.replace("</body>",css+"\n"+audio_js+"\n</body>",1)
file.write_text(s,encoding="utf-8")
pathlib.Path("qa/hoeren-audit-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print("Hören audit",report["before"],report["after"],"keyed",report["keyed"],"new answers",len(report["answers_added"]))
