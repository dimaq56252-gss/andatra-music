export function structurePlan(duration,s,profile){
 const bar=240/s.bpm,count=Math.ceil(duration/bar),edge=Math.max(1,Math.min(4,Math.floor(count/8))),middle=Math.max(1,count-edge*2);
 const first=profile?.phrases?.[0]?.start??0,last=profile?.phrases?.at(-1)?.end??duration;
 return Array.from({length:count},(_,b)=>{
  const start=b*bar,end=Math.min(duration,(b+1)*bar),phase=(b-edge)/middle;let type='verse';
  if(b<edge)type='intro';else if(b>=count-edge)type='outro';else if(phase<.28)type='verse';else if(phase<.48)type='chorus';else if(phase<.65)type='verse';else if(phase<.75&&count>20)type='break';else type='chorus';
  // Vocal loudness alone cannot identify a chorus. Keep a bounded musical form,
  // while respecting leading/trailing silence and explicit section edits.
  if(profile){if(end<=first)type='intro';else if(start>=last&&b>=count-4)type='outro';else if((type==='intro'||type==='outro')&&start<last&&end>first)type='verse';}
  if(!s.structure)type='verse';const edit=editAt(s,start);if(s.structure&&edit&&edit.type!=='auto')type=edit.type;
  return {bar:b,start,end,type};
 });
}
export function sectionAt(plan,time){return plan.find(p=>time>=p.start&&time<p.end)?.type||'intro';}
export function arrangeDynamics(events,plan,s){const gains={intro:{drum:.5,bass:.5,chord:.6,lead:.4},verse:{drum:.85,bass:.9,chord:.7,lead:.65},chorus:{drum:1,bass:1,chord:1,lead:1},break:{drum:.3,bass:.4,chord:.8,lead:.9},outro:{drum:.45,bass:.55,chord:.5,lead:.5}},character=s.character||'dense';const result=[];
 for(const e of events){const type=sectionAt(plan,e.when),role=e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role||'chord';if(s.structure&&type==='intro'&&e.kind==='drum'&&e.index===1)continue;if(character==='calm'&&e.kind==='drum'&&[2,4].includes(e.index))continue;const amount=(s.structure?gains[type][role]:1)*(character==='calm'?(role==='drum'?.72:.8):character==='experimental'?(role==='lead'?1.05:.92):1);result.push({...e,level:e.level*amount,section:type});}
 if(s.structure)for(let i=1;i<plan.length;i++)if(plan[i].type==='chorus'&&plan[i-1].type!=='chorus'){const when=plan[i].start-.12;if(when>=0){result.push({kind:'drum',index:4,when,level:.35,kit:'electro',section:'transition'});const step=60/s.bpm/4;for(let j=0;j<3;j++){const at=plan[i].start-(3-j)*step/2;if(at>=0)result.push({kind:'drum',index:1,when:at,level:.24+j*.12,kit:'classic',section:'transition'});}}}
 return result;
}

export function editAt(settings,time){return settings.edits?.find(e=>time>=e.start&&time<e.end);}
export function applyPartEdits(events,settings){
 return events.flatMap(e=>{const role=e.kind==='drum'?'drum':e.kind==='lead'?'lead':e.role||'chord',edit=editAt(settings,e.when),gain=(settings.partGains?.[role]??1)*(edit?.gains?.[role]??1);return gain>0?[{...e,level:e.level*gain}]:[];});
}
