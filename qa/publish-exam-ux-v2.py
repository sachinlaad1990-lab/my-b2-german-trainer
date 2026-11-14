#!/usr/bin/env python3
"""Publish exam UX v2 without modifying source PDF, prompts, options, or answers."""
import pathlib,re,hashlib,json,collections
p=pathlib.Path('exam-practice.html')
original=p.read_text(encoding='utf-8')
match=re.search(r'(<script id="bank-data" type="application/json">)(.*?)(</script>)',original,re.S)
assert match,'Embedded question bank not found'
bank_bytes=match.group(2).encode('utf-8')
bank_sha=hashlib.sha256(bank_bytes).hexdigest()
bank=json.loads(match.group(2))
pages={x['page']:x['original_text'] for x in bank['source_page_records']}
assert len(pages)==149
ex=[x for x in bank['exercises'] if x['section'] in ('Lesen','Schreiben','Hören','Sprechen')]
questions=[q for e in ex for q in e['questions']]
assert len(questions)==603 and len(set(q['id'] for q in questions))==603
assert pathlib.Path('exam-ux-v2.css').stat().st_size>5500
assert pathlib.Path('exam-ux-v2.js').stat().st_size>5000
start=original[:match.start(2)]
end=original[match.end(2):]
if '<link rel="stylesheet" href="exam-ux-v2.css">' not in start:
 assert '</head>' in start
 start=start.replace('</head>','<link rel="stylesheet" href="exam-ux-v2.css">\n</head>',1)
api='window.__b2ExamUX={getSets:()=>sets,getCurrentExercise:()=>byId[s.current],selectSet:(id)=>selectSet(id),setSection:(section)=>{s.section=section;renderSidebar();}};'
if api not in end:
 assert 'applyTheme();renderPage();\n</script>' in end,'Cannot find intact original exam renderer; fail rather than guessing'
 end=end.replace('applyTheme();renderPage();\n</script>',api+'\napplyTheme();renderPage();\n</script>',1)
if '<script src="exam-ux-v2.js" defer></script>' not in end:
 assert '</body>' in end
 end=end.replace('</body>','<script src="exam-ux-v2.js" defer></script>\n</body>',1)
modified=start+match.group(2)+end
newmatch=re.search(r'<script id="bank-data" type="application/json">(.*?)</script>',modified,re.S)
assert newmatch and hashlib.sha256(newmatch.group(1).encode('utf-8')).hexdigest()==bank_sha,'Question bank must be byte-for-byte preserved'
assert modified.count('exam-ux-v2.css')==1
assert modified.count('exam-ux-v2.js')==1
assert modified.count('window.__b2ExamUX=')==1
assert len(modified)-len(original)<1000
p.write_text(modified,encoding='utf-8')
report={
 'questions':len(questions),'original_pdf_pages':149,'bank_sha256_unchanged':bank_sha,
 'questions_by_section':dict(collections.Counter(q['section'] for q in ex)),
 'files_added':['exam-ux-v2.css','exam-ux-v2.js'],
 'features':['four always-visible exam section tabs','exercise selector','one-at-a-time question navigation',
 'prominent question and answer styling','collapsible source annotations','responsive switch between question and source on mobile',
 'persistent sidebar toggle','preserved saved practice answers','unchanged original source text'],
 'guard':'No PDF original page text, question prompts, option labels, answer keys, app progress state, or audio attachments have been changed.'
}
pathlib.Path('qa/exam-ux-v2-release.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('EXAM_UX_V2',json.dumps(report))
