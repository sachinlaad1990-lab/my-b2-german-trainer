#!/usr/bin/env python3
"""Twice-daily cloud collection for Germany Job Finder.
Public job feeds and employer ATS APIs only. Never scrapes logins or auto-applies.
"""
import datetime as dt, hashlib, html, json, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urlparse
from urllib.error import HTTPError, URLError

ROOT=Path(__file__).resolve().parent
OUT=ROOT/"jobs.json"
NOW=dt.datetime.now(dt.timezone.utc)
HEADERS={"User-Agent":"GermanyJobFinder/3.0 public API consumer","Accept":"application/json"}
PATTERNS={
 "Project Manager":re.compile(r"project\s*(manager|lead)|projekt\s*(manager|leiter|leitung)|program(?:me)?\s*manager",re.I),
 "Strategy Consultant":re.compile(r"strategy\s*(consultant|advisor|manager)|management\s*consultant|strategieberater|unternehmensberater",re.I),
 "Business Development":re.compile(r"business\s*development|business\s*developer|biz\s*dev|geschäftsentwicklung|growth\s*manager",re.I)}
CITIES=re.compile(r"\b(germany|deutschland|bundesweit|berlin|hamburg|münchen|munich|köln|cologne|frankfurt|stuttgart|düsseldorf|aachen|bonn|essen|dortmund|hannover|leipzig|bremen|nürnberg|karlsruhe|mannheim|dresden|freiburg|mainz|wiesbaden|bielefeld|münster|bochum|ulm|regensburg|augsburg|darmstadt|heidelberg|potsdam|paderborn|ingolstadt|wolfsburg|duisburg|kiel|mönchengladbach|wuppertal|erlangen|osnabrück|kassel|braunschweig|magdeburg|rostock)\b",re.I)
JUNIOR=re.compile(r"\b(junior|internship|intern|praktikant|werkstudent|working student|trainee|student|graduate|ausbildung)\b",re.I)
HIGH_GERMAN=re.compile(r"(german|deutsch)\W{0,28}(c1|c2|native|muttersprachlich|verhandlungssicher)|(c1|c2|muttersprachlich|verhandlungssicher)\W{0,28}(german|deutsch)",re.I)
EMPLOYERS={
 "Greenhouse":["freenow","wongdoody","caronsale","project_a_ventures_management_gmbh","constellrgmbh"],
 "Lever":["Civitta","netlight","agicap","Nomagic","jobgether"],
 "Ashby":["yoummday","liqid-lig","sunday-natural","Luminovo","codesphere","blp-digital","sensmore"],
 "SmartRecruiters":["ImplementConsultingGroup","TurnerTownsend","eversana1"]}
def fetch(url,params=None,headers=None):
 if params: url+="?"+urlencode(params)
 with urlopen(Request(url,headers={**HEADERS,**(headers or {})}),timeout=23) as r:return json.load(r)
def text(x):
 s=html.unescape(str(x or ""))
 return re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",s)).strip()[:6000]
def iso(x):
 if isinstance(x,(int,float)):
  try:return dt.datetime.fromtimestamp(x/(1000 if x>100000000000 else 1),dt.timezone.utc).date().isoformat()
  except Exception:return ""
 s=str(x or "")
 return s[:10] if re.match(r"\d{4}-\d\d-\d\d",s) else ""
def make(title,company,location,url,source,description="",posted="",employer=False,germany=False):
 title=text(title);company=text(company) or "Employer not supplied";location=text(location);description=text(description);url=str(url or "")
 if not title or JUNIOR.search(title) or not urlparse(url).scheme in ("http","https") or not urlparse(url).netloc:return None
 role=next((r for r,p in PATTERNS.items() if p.search(title)),None)
 if not role or (not germany and not CITIES.search(location)) or HIGH_GERMAN.search(description):return None
 posted=iso(posted)
 if posted and not employer:
  try:
   if (NOW.date()-dt.date.fromisoformat(posted)).days>60:return None
  except ValueError: pass
 ident=hashlib.sha256(("|".join([company.lower(),title.lower(),location.lower()])).encode()).hexdigest()[:22]
 score=65+(12 if re.search(r"\b(senior|lead|principal|head)\b",title,re.I) else 0)
 score+=8 if re.search(r"\b(automotive|engineering|manufacturing|mobility|industrial|energy|maschinenbau|battery)\b",description,re.I) else 0
 return {"id":ident,"title":title,"company":company,"location":location or "Germany","url":url,"role":role,"source":source,"posted":posted,"seen":NOW.date().isoformat(),"source_kind":"employer" if employer else "feed","verification":"On employer's published job board" if employer else "Observed in source feed","score":min(score,100),"summary":description[:350],"experience":"Mid / senior (not independently confirmed)","language":"English/German B2 suitability unverified"}
def arbeitnow():
 for page in range(1,9):
  d=fetch("https://www.arbeitnow.com/api/job-board-api",{"page":page})
  for j in d.get("data",[]):
   yield make(j.get("title"),j.get("company_name"),j.get("location"),j.get("url"),"Arbeitnow",j.get("description"),j.get("created_at"))
  if not d.get("data") or not (d.get("links") or {}).get("next"):break
def remotive():
 for j in fetch("https://remotive.com/api/remote-jobs").get("jobs",[]):
  yield make(j.get("title"),j.get("company_name"),j.get("candidate_required_location"),j.get("url"),"Remotive",j.get("description"),j.get("publication_date"))
def agentur():
 url="https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v6/jobs"
 for term in ("Projektmanager","Projektleiter","Project Manager","Strategieberater","Unternehmensberater","Business Development"):
  for page in (1,2):
   d=fetch(url,{"was":term,"page":page,"size":50,"angebotsart":1,"veroeffentlichtseit":60},{"X-API-Key":"jobboerse-jobsuche"})
   rows=d.get("ergebnisliste") or d.get("stellenangebote") or []
   for j in rows:
    ref=j.get("referenznummer") or j.get("refnr")
    if not ref:continue
    places=[]
    for loc in (j.get("stellenlokationen") or j.get("arbeitsorte") or []):
     if isinstance(loc,dict):
      addr=loc.get("adresse") or loc
      places.append(", ".join(str(addr.get(k)) for k in ("ort","region") if addr.get(k)))
    yield make(j.get("stellenangebotsTitel") or j.get("titel") or j.get("beruf"),j.get("firma") or j.get("arbeitgeber"),"; ".join(places) or "Germany",f"https://www.arbeitsagentur.de/jobsuche/jobdetail/{ref}","Bundesagentur für Arbeit","",j.get("datumErsteVeroeffentlichung"),germany=True)
   if len(rows)<50:break
def greenhouse(site):
 for j in fetch(f"https://boards-api.greenhouse.io/v1/boards/{site}/jobs",{"content":"true"}).get("jobs",[]):
  yield make(j.get("title"),site,(j.get("location") or {}).get("name"),j.get("absolute_url"),"Greenhouse · "+site,j.get("content"),j.get("updated_at"),True)
def lever(site):
 d=None
 for host in ("api.lever.co","api.eu.lever.co"):
  try:d=fetch(f"https://{host}/v0/postings/{site}",{"mode":"json","limit":1000});break
  except (HTTPError,URLError):pass
 if d is None:raise RuntimeError("Lever board unavailable")
 for j in d:
  yield make(j.get("text"),site,(j.get("categories") or {}).get("location") or j.get("workplaceType"),j.get("applyUrl") or j.get("hostedUrl"),"Lever · "+site,j.get("descriptionPlain") or j.get("description"),j.get("createdAt"),True)
def ashby(site):
 for j in fetch(f"https://api.ashbyhq.com/posting-api/job-board/{site}").get("jobs",[]):
  if j.get("isListed") is False:continue
  yield make(j.get("title"),site,j.get("location"),j.get("applyUrl") or j.get("jobUrl"),"Ashby · "+site,j.get("descriptionPlain") or j.get("descriptionHtml"),j.get("publishedAt"),True)
def smart(site):
 for offset in (0,100):
  d=fetch(f"https://api.smartrecruiters.com/v1/companies/{site}/postings",{"limit":100,"offset":offset,"destination":"PUBLIC","country":"de"})
  for j in d.get("content",[]):
   loc=j.get("location") or {}
   yield make(j.get("name"),(j.get("company") or {}).get("name") or site,", ".join(str(x) for x in (loc.get("city"),loc.get("country")) if x),j.get("ref") or j.get("applyUrl") or j.get("jobAdUrl"),"SmartRecruiters · "+site,j.get("description"),j.get("releasedDate"),True,True)
  if offset+100>=d.get("totalFound",0):break
def run():
 old={}
 try:old={j["id"]:j for j in json.loads(OUT.read_text()).get("jobs",[])}
 except Exception:pass
 jobs={};sources={};errors=[]
 tasks=[("Arbeitnow",arbeitnow),("Remotive",remotive),("Bundesagentur für Arbeit",agentur)]
 for typ,sites in EMPLOYERS.items():
  fn={"Greenhouse":greenhouse,"Lever":lever,"Ashby":ashby,"SmartRecruiters":smart}[typ]
  tasks += [(typ+" · "+site,lambda s=site,f=fn:f(s)) for site in sites]
 for name,task in tasks:
  count=0
  try:
   for j in task():
    if not j:continue
    count+=1;p=jobs.get(j["id"])
    if p is None or (j["source_kind"]=="employer" and p["source_kind"]!="employer"):jobs[j["id"]]=j
   sources[name]={"status":"ok","matched":count}
  except Exception as e:
   sources[name]={"status":"error","matched":count};errors.append(f"{name}: {type(e).__name__}: {str(e)[:120]}")
 for ident,j in old.items():
  if ident in jobs:continue
  try:age=(NOW.date()-dt.date.fromisoformat(j["seen"])).days
  except Exception:continue
  if age<=7:jobs[ident]={**j,"verification":"Not seen on latest refresh; check before applying"}
 ordered=sorted(jobs.values(),key=lambda x:(x["verification"].startswith("Not seen"),-x["score"],x.get("posted","")))
 OUT.write_text(json.dumps({"updated_at":NOW.isoformat(timespec="seconds"),"count":len(ordered),"jobs":ordered[:1200],"sources":sources,"errors":errors,"note":"No LinkedIn/XING/StepStone import until authorized job alerts are connected. Listings are not guaranteed open."},ensure_ascii=False,separators=(",",":"))+"\n")
 print(f"{len(ordered)} vacancies; {len(errors)} source errors")
 return 0 if any(s["status"]=="ok" for s in sources.values()) else 1
if __name__=="__main__":sys.exit(run())
