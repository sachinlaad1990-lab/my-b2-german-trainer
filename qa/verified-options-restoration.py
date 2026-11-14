#!/usr/bin/env python3
"""Restore unambiguous PDF-literal A/B/C options.

Never substitute paraphrases, invented German text, or unofficial answer keys.
"""
import json,re,pathlib,collections
file=pathlib.Path('exam-practice.html')
s=file.read_text(encoding='utf-8')
m=re.search(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',s,re.S)
assert m
b=json.loads(m.group(2))
pages={p['page']:p['original_text'] for p in b['source_page_records']}
assert len(pages)==149
norm=lambda a:re.sub(r'\s+','',a or '').casefold()
header=re.compile(r'^\s*(\d{1,2})\s*[.:)]?\s+(.+)$')
option=re.compile(r'^\s*([abcаbсABCАBС])\s*[).]?\s+(.+)$')
remove_mark=re.compile(r'(?:\s*[-–]?\s*100%\s*)+$')
def options_exact(q):
 lines=pages[q['page']].splitlines();matches=[]
 prompt=q.get('prompt','').strip()
 for i,line in enumerate(lines):
  mm=header.match(line)
  if not mm or int(mm.group(1))!=q['number']:continue
  head=mm.group(2).strip()
  if norm(head)!=norm(prompt) and not (len(norm(prompt))>=10 and norm(head).startswith(norm(prompt))):continue
  more=[head[len(prompt):]] if len(head)>len(prompt) else []
  more+=lines[i+1:i+12]
  found={};seq=[];bad=False
  for ln in more:
   if header.match(ln):break
   pieces=[ln]
   boundary=re.search(r'(?:100%\s+)([abcс])\s+',ln,re.I)
   if boundary:pieces=[ln[:boundary.start()],ln[boundary.start(1):]]
   for piece in pieces:
    om=option.match(piece)
    if not om:continue
    key=om.group(1).lower().replace('а','a').replace('с','c')
    if key not in 'abc':continue
    value=remove_mark.sub('',om.group(2)).strip()
    if key in found or len(value)<6 or norm(value) not in norm(pages[q['page']]):bad=True;break
    found[key]=value;seq.append(key)
   if bad or len(seq)==3:break
  if not bad and seq==['a','b','c']:matches.append(found)
 return matches
updates=[];unresolved=[]
for e in b['exercises']:
 if e.get('section') not in ('Lesen','Schreiben','Hören','Sprechen'):continue
 for q in e['questions']:
  if q.get('kind')!='mc':continue
  old_opts=q.get('options') or []
  if len(old_opts)!=3 or {o['value'] for o in old_opts}!={'a','b','c'}:continue
  if e.get('detail') in ('Teil 1','Teil 3'):continue
  if not all(o['label'].strip().casefold()==o['value'].casefold() for o in old_opts):continue
  found=options_exact(q)
  if len(found)!=1:
   unresolved.append({'id':q['id'],'pdf_page':q['page'],'source_matches':len(found)})
   continue
  exact=found[0]
  opts=[{'value':letter,'label':exact[letter]} for letter in 'abc']
  assert all(norm(o['label']) in norm(pages[q['page']]) for o in opts)
  prev=q.get('completeness')
  q['options']=opts
  q['source_option_provenance']='verbatim_pdf'
  if prev=='extraction_review':q['completeness']='transcript_review' if e['section']=='Hören' else 'complete_source'
  if (q.get('source_alt_note') or '').startswith('INCOMPLETE DIGITAL OPTIONS:'):
   q['source_alt_note']='Choices copied character-for-character from original PDF. Any answer marking is unofficial.'
  q['completeness_reason']='All three choices restored literally from the source PDF. Audio-dependent answers remain unverified.' if e['section']=='Hören' else 'All three choices restored literally from original PDF. Source markings are not official keys.'
  updates.append({'id':q['id'],'pdf_page':q['page'],'section':e['section'],'previous':prev,'now':q['completeness'],'options':opts})
for e in b['exercises']:
 for q in e['questions']:
  if q['id']!='set036-p39-q14-1':continue
  if not q.get('prompt','').startswith('Der Termin der nächsten Sitzung'):continue
  opts=q.get('options',[])
  if len(opts)!=3 or not all(o['label'].strip().casefold()==o['value'] for o in opts):continue
  stem='Der Termin der nächsten Sitzung'
  values=['muss noch entschieden werden.','wird nach der Urlaubszeit abgestimmt.','wurde während der Sitzung gesprochen.']
  assert all(norm(v) in norm(pages[39]) for v in [stem]+values)
  old=q.get('completeness')
  q['prompt']=stem
  q['options']=[{'value':k,'label':v} for k,v in zip('abc',values)]
  q['source_provenance']='verbatim_pdf';q['source_option_provenance']='verbatim_pdf'
  if old=='extraction_review':q['completeness']='complete_source'
  q['completeness_reason']='Question and options copied literally from PDF page 39.'
  q['source_alt_note']='The source annotation “Новый вариант №030321” is not part of the German question or choices.'
  updates.append({'id':q['id'],'pdf_page':39,'section':'Lesen','previous':old,'now':q['completeness'],'options':q['options']})
total=sum(len(e['questions']) for e in b['exercises'] if e.get('section') in ('Lesen','Schreiben','Hören','Sprechen'))
assert total==602
payload=json.dumps(b,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
s=s[:m.start(2)]+payload+s[m.end(2):]
file.write_text(s,encoding='utf-8')
status=dict(collections.Counter(q.get('completeness') for e in b['exercises'] if e.get('section') in ('Lesen','Schreiben','Hören','Sprechen') for q in e['questions']))
report={'total':total,'restored_count':len(updates),'restored':updates,'unresolved_letter_only':unresolved,'status':status,'policy':'Only literal PDF options; audio and answer keys unverified.'}
pathlib.Path('qa/verified-options-restoration-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('RESTORED',len(updates),'UNRESOLVED',len(unresolved),'STATUS',status)
