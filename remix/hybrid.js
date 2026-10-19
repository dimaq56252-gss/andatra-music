import {LOOP_PACKS} from './loops/catalog.js?v=hybrid-39';
import {structurePlan,editAt} from './structure.js?v=composition-37';

// This library contains instrumental audio, not text-to-music model output.
// Related phrases always stay in one pack so their harmony remains coherent.
export function selectLoopPack(s){
 const explicit=LOOP_PACKS.find(p=>p.id===s.loopPack&&p.mode===s.mode);
 if(explicit)return explicit;
 const pool=LOOP_PACKS.filter(p=>p.mode===s.mode).sort((a,b)=>Math.abs(Math.log2(a.bpm/s.bpm))-Math.abs(Math.log2(b.bpm/s.bpm)));
 if(!pool.length)throw Error('В библиотеке пока нет фраз в выбранном ладу. Выбери сэмплы инструментов.');
 // The nearest six preserve tempo character while allowing audible variety.
 return pool[(((s.seed>>>0)+(s.variation||0))>>>0)%Math.min(6,pool.length)];
}
export function hybridPlan(duration,s,profile=null){
 const pack=selectLoopPack(s),bar=240/s.bpm,shift=((s.root-pack.root+18)%12)-6,sections=structurePlan(duration,s,profile),events=[];
 for(let b=Math.floor(-s.offset/bar);s.offset+b*bar<duration;b++){
  const when=s.offset+b*bar;if(when+bar<=0)continue;
  const section=sections.find(p=>p.start<=Math.max(0,when)&&p.end>Math.max(0,when))?.type||'verse';
  const hook=section==='chorus',clip=(hook?1:0)^((s.variation||0)%2),local=((b%4)+4)%4,edit=editAt(s,Math.max(0,when));
  const gain=(section==='intro'?.55:section==='outro'?.5:section==='break'?.55:hook?1:.75)*(s.partGains?.lead??1)*(edit?.gains?.lead??1);
  events.push({when,duration:Math.min(bar,duration-when),clip,local,section,gain,root:(pack.clips[clip].roots[local]+shift+12)%12});
 }
 return {pack,bar,shift,events};
}

// WSOLA stretches time independently of pitch. A short waveform search aligns
// overlapping grains; the same result is used for preview and full rendering.
export function stretchLoop(input,targetLength,pitch=1,sampleRate=44100){
 if(!Number.isInteger(targetLength)||targetLength<1||!Number.isFinite(pitch)||pitch<=0)throw Error('Некорректная длина музыкальной фразы.');
 const n=Math.max(2,Math.round(input.length/pitch)),pitched=new Float32Array(n);
 for(let i=0;i<n;i++){const p=i*pitch,j=Math.floor(p),f=p-j;pitched[i]=(input[Math.min(j,input.length-1)]||0)*(1-f)+(input[Math.min(j+1,input.length-1)]||0)*f;}
 const frame=Math.min(2048,2**Math.floor(Math.log2(Math.max(32,sampleRate*.047)))),hop=frame/4,overlap=frame-hop,search=Math.round(sampleRate*.006),alpha=targetLength/n;
 const out=new Float32Array(targetLength+frame),weights=new Float32Array(out.length),window=Float32Array.from({length:frame},(_,i)=>.5-.5*Math.cos(2*Math.PI*(i+.5)/frame));
 for(let dest=0;dest<targetLength;dest+=hop){
  const expected=Math.round(dest/alpha);let pos=expected,best=-Infinity;
  if(dest&&expected+frame<n){
   for(let candidate=Math.max(0,expected-search);candidate<=Math.min(n-frame,expected+search);candidate+=8){
    let dot=0,a=0,b=0;for(let j=0;j<overlap;j+=8){const x=out[dest+j]/Math.max(1e-5,weights[dest+j]),y=pitched[candidate+j];dot+=x*y;a+=x*x;b+=y*y;}
    const score=dot/Math.sqrt(a*b+1e-15)-Math.abs(candidate-expected)/Math.max(1,search)*.015;if(score>best){best=score;pos=candidate;}
   }
  }
  for(let j=0;j<frame;j++){const at=dest+j;out[at]+=(pitched[Math.min(n-1,pos+j)]||0)*window[j];weights[at]+=window[j];}
 }
 const result=out.subarray(0,targetLength);for(let i=0;i<result.length;i++)result[i]=weights[i]>1e-5?result[i]/weights[i]:0;
 const fade=Math.min(Math.round(sampleRate*.005),Math.floor(result.length/2));for(let i=0;i<fade;i++){result[i]*=i/fade;result[result.length-1-i]*=i/fade;}
 return result;
}
const prepared=new Map();
export async function prepareLoops(context,plan,s,fetcher=fetch){
 const key=[plan.pack.id,s.bpm,s.root,context.sampleRate].join(':');
 if(!prepared.has(key)){
  const task=Promise.all(plan.pack.clips.map(async clip=>{
   const response=await fetcher(clip.url);if(!response.ok)throw Error('Не удалось загрузить музыкальные фразы. Проверь соединение.');
   const decoded=await context.decodeAudioData(await response.arrayBuffer()),expected=Math.round(clip.bars*240/plan.pack.bpm*context.sampleRate),mono=new Float32Array(expected);
   for(let ch=0;ch<decoded.numberOfChannels;ch++){const a=decoded.getChannelData(ch);for(let i=0;i<Math.min(expected,a.length);i++)mono[i]+=a[i]/decoded.numberOfChannels;}
   const samples=stretchLoop(mono,Math.round(clip.bars*plan.bar*context.sampleRate),2**(plan.shift/12),context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.copyToChannel(samples,0);return buffer;
  }));
  prepared.set(key,task);task.catch(()=>prepared.delete(key));
  while(prepared.size>3)prepared.delete(prepared.keys().next().value);
 }
 return prepared.get(key);
}
export function renderLoops(context,out,plan,buffers,s,start,length){
 for(const event of plan.events){
  const first=Math.max(start,event.when),end=Math.min(start+length,event.when+event.duration);if(end<=first||event.gain<=0||s.melody<=0)continue;
  const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();source.buffer=buffers[event.clip];
  filter.type='lowpass';filter.frequency.value=event.section==='intro'?1800:event.section==='verse'?5200:event.section==='break'?2400:9500;filter.Q.value=.5;
  const when=first-start,seconds=end-first,fade=Math.min(.006,seconds/3),level=event.gain*(.4+s.melody*.7);
  gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(level,when+fade);gain.gain.setValueAtTime(level,when+seconds-fade);gain.gain.linearRampToValueAtTime(0,when+seconds);
  source.connect(filter).connect(gain).connect(out);source.start(when,event.local*plan.bar+first-event.when,seconds);
 }
}
