import {catalog,note} from '../drumpad/melodies.js?v=3';
import {activityAt,barActivity,phraseEndsHere} from './adaptation.js?v=remix-5';
const styleMap={rap:['boom','funk'],trap:['trap'],house:['house'],drill:['drill'],lofi:['lofi','ambient'],synth:['synth']};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pc=(n)=>((n%12)+12)%12;
const midi=(degree,root,scale,octave)=>12*(octave+1)+root+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
// Prefer consonant harmony over bars, with transition costs instead of chasing every syllable.
export function harmonicPlan(profile,settings,duration,progression){
 const bar=240/settings.bpm,scale=settings.mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10],first=Math.floor(-settings.offset/bar)-1,count=Math.ceil(duration/bar)+3,degrees=[0,1,2,3,4,5,6],states=[];
 let cursor=0;
 for(let b=first;b<first+count;b++){const start=settings.offset+b*bar,end=start+bar;while(cursor<(profile?.pitches.length||0)&&profile.pitches[cursor].time<start)cursor++;const tones=[];for(let i=cursor;i<(profile?.pitches.length||0)&&profile.pitches[i].time<end;i++)tones.push(profile.pitches[i]);const prior=progression[((b%4)+4)%4];
  const scores=degrees.map(d=>{const chord=[0,2,4].map(n=>pc(settings.root+scale[(d+n)%7]));let total=0,weight=0;for(const p of tones){const w=p.weight||1,distance=Math.min(...chord.map(n=>Math.min(pc(p.note-n),pc(n-p.note))));total+=w*(distance===0?1:distance===1?-.75:distance===2?.08:-.3);weight+=w;}return (weight?total/weight:0)*(settings.adaptive&&profile?.key?settings.fit:0)+(d===prior?.18:.0)+(d===0?.04:0);});
  const prev=states.at(-1),row=degrees.map((d,i)=>{if(!prev)return {score:scores[i],from:0};let best=-Infinity,from=0;prev.forEach((p,j)=>{const distance=Math.abs(d-degrees[j]),transition=d===degrees[j]?.04:distance===3||distance===4?.02:-.07;const score=p.score+scores[i]+transition;if(score>best){best=score;from=j;}});return {score:best,from};});states.push(row);
 }
 let at=states.at(-1).reduce((best,x,i,a)=>x.score>a[best].score?i:best,0);const plan=new Map();for(let i=states.length-1;i>=0;i--){plan.set(first+i,degrees[at]);at=states[i][at].from;}return {plan,scale,bar};
}
function vocalNoteAt(profile,time){if(!profile?.pitches.length)return null;let lo=0,hi=profile.pitches.length;while(lo<hi){const m=(lo+hi)>>1;if(profile.pitches[m].time<time)lo=m+1;else hi=m;}let best=profile.pitches[lo]||profile.pitches.at(-1);if(lo>0&&Math.abs(profile.pitches[lo-1].time-time)<Math.abs(best.time-time))best=profile.pitches[lo-1];return Math.abs(best.time-time)<.24?best:null;}
export function rankMelodies(profile,s,duration){const group=styleMap[s.style]||styleMap.rap,scale=s.mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10],bar=240/s.bpm,step=bar/16;const candidates=catalog.filter(p=>group.includes(p.style));
 return candidates.map(p=>{let score=0,n=0;for(let b=0;b<Math.min(20,Math.ceil(duration/bar));b++)for(let i=0;i<8;i++){const time=s.offset+b*bar+p.rhythm[i]*step;if(time<0||time>=duration)continue;const pitch=vocalNoteAt(profile,time),lead=pc(s.root+scale[((p.motif[(i+b*(p.variant%3))%8]+p.progression[b%4])%7+7)%7]),activity=activityAt(profile,time);score+=(1-activity)*.35;if(pitch&&profile?.key){const distance=pc(lead-pitch.note);score+=[0,3,4,7,8,9].includes(distance)?.8:[1,2,6,10,11].includes(distance)?-.8:.1;}n++;}score/=Math.max(1,n);score+=p.mode===s.mode?.08:0;return {preset:p,score};}).sort((a,b)=>b.score-a.score||a.preset.id.localeCompare(b.preset.id));
}
export function composeMelody(profile,s,duration){const ranked=rankMelodies(profile,s,duration),choice=ranked[s.variation%ranked.length],p=choice.preset,{plan,scale,bar}=harmonicPlan(profile,s,duration,p.progression),step=bar/16,events=[];
 const mids=profile?.pitches.map(p=>p.midi).filter(Number.isFinite).sort((a,b)=>a-b)||[],voiceMedian=mids[Math.floor(mids.length/2)]||60,octave=voiceMedian>66?4:5;
 for(const [b,degree]of [...plan].sort((a,b)=>a[0]-b[0])){const start=s.offset+b*bar,density=barActivity(profile,start,bar);for(let i=0;i<8;i++){const when=start+p.rhythm[i]*step;if(when<0||when>=duration)continue;const activity=activityAt(profile,when),active=s.adaptive?s.fit*activity:0,singing=profile?.key&&vocalNoteAt(profile,when);if(singing&&active>.45&&i%4!==0)continue;if(active>.6&&i%2!==0)continue;let d=p.motif[(i+b*(p.variant%3)+80)%8]+degree;
 // At simultaneous sung notes, prefer a nearby consonant note within the chosen scale.
 if(singing&&active>.3){const candidates=[d-1,d,d+1].map(x=>({degree:x,distance:pc(midi(x,s.root,scale,octave)-singing.note)}));const consonant=candidates.find(x=>[0,3,4,7,8,9].includes(x.distance));if(consonant)d=consonant.degree;}
 const phraseFill=s.adaptive&&phraseEndsHere(profile,when-step*2,when)&&activity<.3;const next=p.rhythm[i+1]??16,length=Math.min((next-p.rhythm[i])*.7*step,duration-when);if(length<.03)continue;
 events.push({kind:'lead',note:midi(d,s.root,scale,octave),when,duration:length,level:s.melody*.38*(1-.8*active)*(phraseFill?1.12:1)*(density>.8?.8:1),instrument:s.instrument==='auto'?p.instrument:s.instrument});
 }}return {events,plan,preset:p,score:choice.score,ranked:ranked.slice(0,8).map(x=>({name:x.preset.genre+' · '+x.preset.name,score:x.score})),scale};}
export function renderLead(c,out,event){const pan=c.createStereoPanner();pan.pan.value=Math.sin(event.when*.3)*.22;pan.connect(out);const item=note(c,pan,event.note,event.when,event.duration,.8,event.instrument,event.level),last=item.nodes.filter(n=>typeof n.start==='function').at(-1),cleanup=last.onended;last.onended=()=>{cleanup();pan.disconnect();};return item;}
