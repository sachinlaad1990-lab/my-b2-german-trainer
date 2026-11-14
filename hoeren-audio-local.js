/* Local browser-only audio attachments for B2 Beruf Hören variants. */
(function(){
  'use strict';
  const slot=document.getElementById('audioLinks');
  if(!slot)return;
  let audioURL=null,renderToken=0;
  const dbReady=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('Local audio storage unavailable'));return}
    const r=indexedDB.open('b2beruf-listening-audio-v1',1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('recordings'))r.result.createObjectStore('recordings')};
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error||new Error('Cannot open audio storage'));
  });
  async function storage(mode,key,value){
    const db=await dbReady;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('recordings',mode),store=tx.objectStore('recordings');
      const req=mode==='readonly'?store.get(key):value===null?store.delete(key):store.put(value,key);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }
  async function render(){
    const e=window.__b2AudioExercise?.();
    if(!e||e.section!=='Hören')return;
    const token=++renderToken;
    if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null}
    const section=document.createElement('section');
    section.className='local-audio-box';
    section.innerHTML='<div><strong>Audio for this Hören variant</strong><div class="mini muted">Attach MP3, M4A, WAV or OGG at any time. Your recording stays on this browser/device.</div></div><label class="btn local-audio-picker">Add / replace audio <input type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" hidden></label><div class="local-audio-player" aria-live="polite">No recording attached yet.</div>';
    slot.appendChild(section);
    const input=section.querySelector('input'),player=section.querySelector('.local-audio-player');
    function show(file){
      if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null}
      player.replaceChildren();
      if(!file){player.textContent='No recording attached yet.';return}
      const name=document.createElement('span');name.textContent=file.name+' · '+Math.round(file.size/1024)+' KB';
      const media=document.createElement('audio');media.controls=true;media.preload='metadata';media.style.maxWidth='100%';
      audioURL=URL.createObjectURL(file);media.src=audioURL;
      const del=document.createElement('button');del.className='btn';del.textContent='Remove recording';
      del.onclick=async()=>{try{await storage('readwrite',e.id,null);show(null)}catch(err){player.append(' Could not remove: '+err.message)}};
      player.append(name,media,del);
    }
    try{
      const saved=await storage('readonly',e.id);
      if(token===renderToken&&document.contains(section))show(saved||null);
    }catch(err){if(token===renderToken)player.textContent='Persistent audio storage unavailable on this browser.'}
    input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;
      if(!(file.type.startsWith('audio/')||/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name))){player.textContent='Please choose an audio recording.';return}
      try{await storage('readwrite',e.id,file);show(file)}
      catch(err){show(file);player.append(' (For this session only: '+err.message+')')}
      input.value='';
    };
  }
  new MutationObserver(()=>{
    if(!slot.querySelector('.local-audio-box'))render();
  }).observe(slot,{childList:true});
  render();
})();