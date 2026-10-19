// Seeded musical phrases: new note paths and durations, rather than rotated preset loops.
import {randomSource,songSeed} from './production.js?v=shared-34';
const pick=(rng,items)=>items[Math.floor(rng()*items.length)];
const bounds=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export const RAP_STYLES=new Set(['rap','boom','trap','drill','lofi','bounce','phonk','rnb']);
function rapPhrase(s,development,phraseBars){
 const rng=randomSource(songSeed(s,700)),bars=phraseBars||4,anchor=pick(rng,[0,2,4]),cells=[[0,6,12,19,24],[0,3,10,18,26],[2,8,14,20,27],[0,7,12,22,28],[0,4,11,18,25],[2,6,14,19,26],[0,6,10,20,28],[0,3,12,22,27],[0,6,12,18,24,28],[0,4,12,20,26,29]],cell=cells[(s.variation+Math.floor(rng()*cells.length))%cells.length];
 const tones=cell.map((_,i)=>i===0?anchor:anchor+pick(rng,[-2,-1,0,2,4]));
 const steps=[],degrees=[],lengths=[];
 for(let offset=0;offset<bars*16;offset+=32)for(let i=0;i<cell.length;i++){
  const t=offset+cell[i];if(t>=bars*16-2)continue;
  steps.push(t);degrees.push(i===cell.length-1?(development%2?anchor+2:anchor):tones[i]);
  lengths.push(pick(rng,[1.2,1.6,2.2,2.8]));
 }
 // The same cell returns; only its final answer changes as the song develops.
 return {bars,steps,degrees,lengths,family:s.variation%8,anchor};
}
export function inventPhrase(s,development=0,phraseBars=null){
 if(RAP_STYLES.has(s.style))return rapPhrase(s,development,phraseBars);
 const rng=randomSource(songSeed(s,700+development)),family=((s.variation||0)+development)%8;
 const bars=phraseBars||(['trap','drill','rnb','dnb','synth'].includes(s.style)?4:pick(rng,[2,4])),total=bars*16;
 const sparse=['trap','drill','rnb','lofi','dnb'].includes(s.style),gaps=sparse?[3,4,5,6,7,8,10]:[2,3,4,5,6,8];
 const steps=[];let time=pick(rng,[0,0,1,2,4]);
 while(time<total-2){steps.push(time);time+=pick(rng,gaps);if(rng()<.16)time+=pick(rng,[2,4,6]);}
 if(steps.length<3)steps.push(Math.floor(total*.5),total-4);
 const unique=[...new Set(steps)].sort((a,b)=>a-b),anchor=pick(rng,[-1,0,0,2,4]),span=pick(rng,[3,4,5,7]),degrees=[];
 let previous=anchor;
 for(let i=0;i<unique.length;i++){
  const phase=i/Math.max(1,unique.length-1);let target;
  switch(family){
   case 0:target=anchor+phase*span;break;
   case 1:target=anchor+(1-phase)*span;break;
   case 2:target=anchor+Math.sin(Math.PI*phase)*span;break;
   case 3:target=anchor+(1-Math.sin(Math.PI*phase))*span;break;
   case 4:target=anchor+Math.sin(phase*Math.PI*3)*span*.6;break;
   case 5:target=i%3===0?anchor:anchor+pick(rng,[2,3,4,6]);break;
   case 6:target=anchor+pick(rng,[-3,-1,2,4,6]);break;
   default:target=anchor+(phase<.5?phase*2*span:(1-phase)*span)-1;break;
  }
  let next=Math.round(target)+(rng()<.3?pick(rng,[-1,1]):0);
  // Most motion is stepwise, with a few deliberate leaps followed by a resolution.
  if(i&&Math.abs(next-previous)>4&&family!==6)next=previous+Math.sign(next-previous)*pick(rng,[2,3,4]);
  next=bounds(next,-3,10);degrees.push(next);previous=next;
 }
 // Repeat the opening cell as an answer, with one changed ending instead of a new random walk.
 const midpoint=total/2,opening=unique.map((t,i)=>({t,i})).filter(x=>x.t<midpoint-2),answer=unique.map((t,i)=>({t,i})).filter(x=>x.t>=midpoint);
 for(let j=0;j<answer.length-1&&opening.length;j++)degrees[answer[j].i]=degrees[opening[j%opening.length].i];
 const resolution=pick(rng,[0,2,4]);degrees[degrees.length-1]=anchor+resolution;
 const lengths=unique.map((t,i)=>{const gap=(unique[i+1]??total)-t,legato=i===unique.length-1?.9:pick(rng,[.48,.62,.78,.92]);return Math.max(.65,gap*legato);});
 return {bars,steps:unique,degrees,lengths,family,anchor};
}
export function phraseSignature(events,bpm){
 if(!events.length)return '';
 const first=events[0],step=60/bpm/4;
 return JSON.stringify(events.map(e=>[Math.round((e.when-first.when)/step*100)/100,e.note-first.note,Math.round(e.duration/step*100)/100]));
}
