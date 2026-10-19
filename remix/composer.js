import {inventPhrase,RAP_STYLES} from './phrases.js?v=rap-31';
import {extraMelodies,STYLE_SOUNDS} from './styles.js?v=rap-31';
import {catalog,note} from '../drumpad/melodies.js?v=3';
import {activityAt} from './adaptation.js?v=remix-6';
import {editAt,structurePlan} from './structure.js?v=rap-31';
import {randomSource,songSeed} from './production.js?v=rap-31';
const styleMap={rap:['boom','funk'],trap:['trap'],house:['house'],drill:['drill'],lofi:['lofi','ambient'],synth:['synth']};
const pc=(n)=>((n%12)+12)%12;
const midi=(degree,root,scale,octave)=>12*(octave+1)+root+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
// Prefer consonant harmony over bars, with transition costs instead of chasing every syllable.
export function harmonicPlan(profile,settings,duration,progression){
 const bar=240/settings.bpm,scale=settings.mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10],first=Math.floor(-settings.offset/bar)-1,count=Math.ceil(duration/bar)+3,degrees=[0,1,2,3,4,5,6],states=[];
 let cursor=0;
 for(let b=first;b<first+count;b++){const start=settings.offset+b*bar,end=start+bar;while(cursor<(profile?.pitches.length||0)&&profile.pitches[cursor].time<start)cursor++;const tones=[];for(let i=cursor;i<(profile?.pitches.length||0)&&profile.pitches[i].time<end;i++)tones.push(profile.pitches[i]);const harmonicBar=Math.floor(b/((RAP_STYLES.has(settings.style)||['synth','dnb'].includes(settings.style))?2:1)),prior=progression[((harmonicBar%progression.length)+progression.length)%progression.length];
  const scores=degrees.map(d=>{const chord=[0,2,4].map(n=>pc(settings.root+scale[(d+n)%7]));let total=0,weight=0;for(const p of tones){const w=p.weight||1,distance=Math.min(...chord.map(n=>Math.min(pc(p.note-n),pc(n-p.note))));total+=w*(distance===0?1:distance===1?-.75:distance===2?.08:-.3);weight+=w;}return (weight?total/weight:0)*(settings.adaptive&&profile?.key?settings.fit:0)+(d===prior?.18:.0)+(d===0?.04:0);});
  const prev=states.at(-1),row=degrees.map((d,i)=>{if(!prev)return {score:scores[i],from:0};let best=-Infinity,from=0;prev.forEach((p,j)=>{const distance=Math.abs(d-degrees[j]),transition=d===degrees[j]?.04:distance===3||distance===4?.02:-.07;const score=p.score+scores[i]+transition;if(score>best){best=score;from=j;}});return {score:best,from};});states.push(row);
 }
 let at=states.at(-1).reduce((best,x,i,a)=>x.score>a[best].score?i:best,0);const plan=new Map();for(let i=states.length-1;i>=0;i--){plan.set(first+i,degrees[at]);at=states[i][at].from;}return {plan,scale,bar};
}
function vocalNoteAt(profile,time){if(!profile?.pitches.length)return null;let lo=0,hi=profile.pitches.length;while(lo<hi){const m=(lo+hi)>>1;if(profile.pitches[m].time<time)lo=m+1;else hi=m;}let best=profile.pitches[lo]||profile.pitches.at(-1);if(lo>0&&Math.abs(profile.pitches[lo-1].time-time)<Math.abs(best.time-time))best=profile.pitches[lo-1];return Math.abs(best.time-time)<.24?best:null;}
export function rankMelodies(profile,s,duration){const group=extraMelodies.some(p=>p.style===s.style)?[s.style]:styleMap[s.style]||styleMap.rap,scale=s.mode==='major'?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10],bar=240/s.bpm,step=bar/16;const candidates=[...catalog,...extraMelodies].filter(p=>group.includes(p.style));
 return candidates.map(p=>{let score=0,n=0;for(let b=0;b<Math.min(32,Math.ceil(duration/bar));b++)for(let i=0;i<8;i++){const songBar=Math.floor(b*Math.max(1,Math.ceil(duration/bar)-1)/Math.max(1,Math.min(32,Math.ceil(duration/bar))-1)),phase=((songBar%4)+4)%4;const time=s.offset+songBar*bar+p.rhythm[i]*step;if(time<0||time>=duration)continue;const pitch=vocalNoteAt(profile,time),lead=pc(s.root+scale[((p.motif[(i+(phase===2?2:0))%8]+p.progression[phase])%7+7)%7]),activity=activityAt(profile,time);score+=(1-activity)*.35;if(pitch&&profile?.key){const distance=pc(lead-pitch.note);score+=[0,3,4,7,8,9].includes(distance)?.8:[1,2,6,10,11].includes(distance)?-.8:.1;}n++;}score/=Math.max(1,n);score+=p.mode===s.mode?.08:0;return {preset:p,score};}).sort((a,b)=>b.score-a.score||a.preset.id.localeCompare(b.preset.id));
}
export function composeMelody(profile,s,duration){
 const ranked=rankMelodies(profile,s,duration),rng=randomSource(songSeed(s,11)),choice=ranked[Math.floor(rng()*Math.min(8,ranked.length))],p=choice.preset;
 const progressions=[[0,5,3,4],[0,3,5,4],[0,6,5,3],[0,0,3,4],[0,2,5,4],[0,4,5,3],[0,5,2,4],[0,3,1,4],[0,2,3,6]],progression=progressions[Math.floor(rng()*progressions.length)];
 const {plan,scale,bar}=harmonicPlan(profile,s,duration,progression),step=bar/16,events=[],sections=structurePlan(duration,s,profile);
 const theme=inventPhrase(s),palette=STYLE_SOUNDS[s.style]||STYLE_SOUNDS.rap;
 const mids=profile?.pitches.map(p=>p.midi).filter(Number.isFinite).sort((a,b)=>a-b)||[],voiceMedian=mids[Math.floor(mids.length/2)]||60,octave=voiceMedian>66?3:4;
 const hookSettings={...s,seed:(s.seed^0x9e3779b9)>>>0,variation:(s.variation+3)%10000},hook=RAP_STYLES.has(s.style)?{...theme,degrees:theme.degrees.map((d,i)=>i%5===3?d+2:d),lengths:theme.lengths.map(n=>n*1.2)}:inventPhrase(hookSettings,4,theme.bars);
 const segments=[];for(const part of sections){const last=segments.at(-1);if(last?.type===part.type)last.end=part.end;else segments.push({...part});}
 let verseNumber=0;
 for(const segment of segments){
  const chorus=segment.type==='chorus';if(segment.type==='verse')verseNumber++;
  const sectionTheme=chorus?hook:verseNumber>1?inventPhrase(s,verseNumber+2,theme.bars):theme;
  const themeName=chorus?'hook':segment.type==='verse'?'verse-'+verseNumber:segment.type;
  const first=Math.floor((segment.start-s.offset)/bar);
  for(let b=first;s.offset+b*bar<segment.end;b+=theme.bars){
   const development=Math.floor((b-first)/8),phrase=segment.type==='verse'&&development>0?inventPhrase(s,verseNumber*7+development,theme.bars):sectionTheme,response=((Math.floor((b-first)/theme.bars)%2)+2)%2===1,decision=randomSource(songSeed(s,b+900));
   for(let i=0;i<phrase.steps.length;i++){
    const r=phrase.steps[i],absoluteBar=b+Math.floor(r/16),when=s.offset+b*bar+r*step+(r%2?s.swing*step:0);if(when<segment.start||when>=segment.end||when<0||when>=duration)continue;
    const section=segment.type,activity=activityAt(profile,when),active=s.adaptive?s.fit*activity:0;
    if(s.structure&&(section==='intro'&&i>2||section==='outro'&&i%2))continue;
    const important=i===0||i===phrase.steps.length-1||r%8===0;
    const spare=chorus?.3:.65;
    if(!important&&(s.character==='calm'&&decision()<.3||active>.5&&decision()<active*spare||section==='verse'&&!RAP_STYLES.has(s.style)&&i%4===2))continue;
    const singing=profile?.key&&vocalNoteAt(profile,when),version=editAt(s,when)?.versions.lead||0;
    const degree=plan.get(absoluteBar)??0;let d=phrase.degrees[i]+degree;
    if(version){const edited=inventPhrase({...s,variation:s.variation+version},verseNumber,theme.bars);d=edited.degrees[i%edited.degrees.length]+degree;}
    if(response&&i>=phrase.steps.length-2)d=degree+(i===phrase.steps.length-1?0:2);
    if(singing&&active>.3){const candidate=[d,d-1,d+1].find(x=>[0,3,4,7,8,9].includes(pc(midi(x,s.root,scale,octave)-singing.note)));if(candidate!==undefined)d=candidate;}
    const length=Math.min(phrase.lengths[i]*step,duration-when,segment.end-when,...(RAP_STYLES.has(s.style)&&active>.25?[step*2]:[]));if(length<.03)continue;
    const baseInstrument=s.instrument==='auto'?palette[Math.floor(s.seed/17)%palette.length]:s.instrument;
    const index=Math.max(0,palette.indexOf(baseInstrument)),instrument=s.autoInstrument&&chorus?palette[(index+1)%palette.length]:baseInstrument;
    let pitch=midi(d,s.root,scale,octave);if(chorus&&pitch<64)pitch+=12;while(pitch>79)pitch-=12;while(pitch<48)pitch+=12;
    events.push({kind:'lead',note:pitch,when,duration:length,level:s.melody*.23*(1-.75*active)*(important?1:.8)*(chorus?1.08:1),instrument,theme:themeName});
   }
  }
 }
 return {events,plan,preset:{...p,name:'Новая фраза '+(s.variation+1)},phrase:theme,score:choice.score,ranked:ranked.slice(0,8).map(x=>({name:x.preset.genre+' · '+x.preset.name,score:x.score})),scale};
}
export function renderLead(c,out,event){const pan=c.createStereoPanner();pan.pan.value=Math.sin(event.when*.3)*.22;pan.connect(out);const item=note(c,pan,event.note,event.when,event.duration,.8,event.instrument,event.level),last=item.nodes.filter(n=>typeof n.start==='function').at(-1),cleanup=last.onended;last.onended=()=>{cleanup();pan.disconnect();};return item;}

