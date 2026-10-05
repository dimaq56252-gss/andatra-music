import {loadSamples,sampleNote,sampleDrum} from './sample-engine.js?v=remix-6';
import {structurePlan,arrangeDynamics,editAt,applyPartEdits} from './structure.js?v=arranger-7';
import {composeMelody,renderLead} from './composer.js?v=arranger-7';
import {activityAt,barActivity,vocalAccentSteps,phraseEndsHere,duckInstrumental} from './adaptation.js?v=remix-6';
import {trigger} from '../drumpad/audio.js?v=3';
import {limitPeaks,measure} from '../audio-processing.js';
export const STYLES={rap:{name:'Рэп',kit:'classic',kick:[0,6,8,14],snare:[4,12],clap:[],hat:[0,2,4,6,8,10,12,14],open:[15]},trap:{name:'Трэп',kit:'trap',kick:[0,7,10],snare:[8],clap:[8],hat:[0,2,4,6,7,8,10,12,14,15],open:[11]},drill:{name:'Дрилл',kit:'trap',kick:[0,5,10,14],snare:[8],clap:[8],hat:[0,2,4,6,7,10,12,14],open:[11]},lofi:{name:'Lo-fi',kit:'classic',kick:[0,6,9],snare:[4,12],clap:[],hat:[0,3,4,7,8,11,12,15],open:[]},synth:{name:'Synthwave',kit:'electro',kick:[0,4,8,12],snare:[4,12],clap:[],hat:[0,2,4,6,8,10,12,14],open:[10]},house:{name:'Хаус',kit:'electro',kick:[0,4,8,12],snare:[],clap:[4,12],hat:[2,6,10,14],open:[2,10]}};
export const NOTE_NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
export function estimateTempo(buffer){
  const hop=Math.max(1,Math.floor(buffer.sampleRate/200)),rate=buffer.sampleRate/hop,n=Math.min(buffer.length,buffer.sampleRate*180),arrays=Array.from({length:Math.min(2,buffer.numberOfChannels)},(_,c)=>buffer.getChannelData(c));
  const env=new Float32Array(Math.ceil(n/hop));
  for(let i=0;i<env.length;i++){let sum=0,count=0;for(let j=i*hop;j<Math.min(n,(i+1)*hop);j+=4){for(const a of arrays)sum+=Math.abs(a[j]);count+=arrays.length;}env[i]=sum/Math.max(1,count);}
  const flux=new Float32Array(env.length);let energy=0;
  for(let i=1;i<env.length;i++){flux[i]=Math.max(0,env[i]-env[i-1]);energy+=flux[i]*flux[i];}
  if(energy<1e-8||buffer.duration<3)return {bpm:100,confidence:0,offset:0};
  let best={bpm:100,score:0};
  for(let bpm=60;bpm<=180;bpm++){
    const lag=rate*60/bpm;let sum=0,denom=0;
    for(let i=Math.ceil(lag);i<flux.length;i++){const j=i-lag,k=Math.floor(j),v=flux[k]*(1-(j-k))+flux[Math.min(k+1,flux.length-1)]*(j-k);sum+=flux[i]*v;denom+=flux[i]*flux[i];}
    const score=sum/(denom+1e-9);if(score>best.score)best={bpm,score};
  }
  const period=60/best.bpm,steps=60;let phase=0,phaseScore=-1;
  for(let p=0;p<steps;p++){const offset=p*period/steps;let sum=0;for(let t=offset;t<Math.min(60,buffer.duration);t+=period){const i=Math.round(t*rate);for(let j=-1;j<=1;j++)sum+=flux[i+j]||0;}if(sum>phaseScore){phase=p*period/steps;phaseScore=sum;}}
  return {bpm:best.bpm,confidence:Math.min(.99,Math.max(0,best.score)),offset:phase};
}
export function estimateKey(buffer){
  const a=buffer.getChannelData(0),down=Math.max(1,Math.floor(buffer.sampleRate/11025)),sr=buffer.sampleRate/down,size=2048,chroma=new Float64Array(12);
  // Sample accompaniment throughout the song; score pitch classes without changing the vocal.
  for(let part=0;part<12;part++){
    const start=Math.floor((a.length-size*down)*part/12);if(start<0)continue;
    const window=new Float32Array(size);let rms=0;
    for(let i=0;i<size;i++){window[i]=a[start+i*down]*(.5-.5*Math.cos(2*Math.PI*i/(size-1)));rms+=window[i]*window[i];}if(rms<1e-6)continue;
    for(let note=48;note<=83;note++){
      const frequency=440*2**((note-69)/12),coeff=2*Math.cos(2*Math.PI*frequency/sr);let p=0,q=0;
      for(const v of window){const x=v+coeff*p-q;q=p;p=x;}
      chroma[note%12]+=Math.sqrt(Math.max(0,p*p+q*q-coeff*p*q));
    }
  }
  const profiles={major:[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],minor:[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17]};
  const mean=chroma.reduce((s,v)=>s+v,0)/12;let best={root:9,mode:'minor',score:0};
  for(const [mode,profile]of Object.entries(profiles))for(let root=0;root<12;root++){
    const pm=profile.reduce((s,v)=>s+v,0)/12;let sum=0,left=0,right=0;
    for(let i=0;i<12;i++){const x=chroma[(root+i)%12]-mean,y=profile[i]-pm;sum+=x*y;left+=x*x;right+=y*y;}
    const score=sum/Math.sqrt(left*right+1e-9);if(score>best.score)best={root,mode,score};
  }
  return {...best,label:NOTE_NAMES[best.root]+(best.mode==='minor'?' minor':' major')};
}
export function validateSettings(s){
  const num=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
  const roles=['drum','bass','chord','lead'],partGains=Object.fromEntries(roles.map(role=>[role,num(s.partGains?.[role],0,1.5,1)]));
  const edits=(Array.isArray(s.edits)?s.edits:[]).slice(0,100).filter(e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.end>e.start).map(e=>({start:Math.max(0,e.start),end:Math.min(300,e.end),type:['intro','verse','chorus','break','outro'].includes(e.type)?e.type:'auto',gains:Object.fromEntries(roles.map(role=>[role,num(e.gains?.[role],0,1.5,1)])),versions:Object.fromEntries(roles.map(role=>[role,Math.round(num(e.versions?.[role],0,9999,0))]))}));
  return {partGains,edits,swing:num(s.swing,0,.35,.12),samples:s.samples!==false,structure:s.structure!==false,character:['calm','dense','experimental'].includes(s.character)?s.character:'dense',style:STYLES[s.style]?s.style:'rap',bpm:num(s.bpm,40,240,100),offset:num(s.offset,-2,4,0),root:Math.round(num(s.root,0,11,9)),mode:s.mode==='major'?'major':'minor',variation:Math.round(num(s.variation,0,9999,0)),harmony:s.harmony!==false,adaptive:s.adaptive!==false,fit:num(s.fit,0,1,.85),melody:num(s.melody,0,1,.55),instrument:['auto','piano','epiano','bell','pluck','strings','pad','lead','guitar','organ','chip'].includes(s.instrument)?s.instrument:'auto',polish:s.polish!==false,voice:num(s.voice,0,1.5,1),beat:num(s.beat,0,1.5,.7)};
}
const frequency=note=>440*2**((note-69)/12);
function tone(context,out,note,when,duration,level,type='sine'){
  if(when<0||duration<.01)return;
  const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=frequency(note);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.0001,level),when+Math.min(.018,duration*.25));g.gain.exponentialRampToValueAtTime(Math.max(.0001,level*.6),when+duration*.65);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g).connect(out);o.start(when);o.stop(when+duration+.01);
}
export function createArrangement(duration,settings,profile=null){
  const s=validateSettings(settings),fit=s.adaptive?s.fit:0,v=fit?profile:null,events=[];
  const composition=composeMelody(v,s,duration);if(s.melody>0)events.push(...composition.events);
  const p=STYLES[s.style],step=60/s.bpm/4,bar=step*16,scale=s.mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11],progression=s.variation%2?[0,3,5,4]:[0,5,3,6];
  for(let b=Math.floor(-s.offset/bar)-1;b*bar+s.offset<duration;b++){
    const start=s.offset+b*bar,base=progression[((b%4)+4)%4],degree=composition.plan.get(b)??base,root=36+s.root+scale[degree];
    
    const density=barActivity(v,start,bar),accents=vocalAccentSteps(v,start,step);
    for(let i=0;i<16;i++){
      const when=start+i*step+(i%2?s.swing*step:0);if(when<0||when>=duration)continue;
      const edit=editAt(s,when),drumVersion=(s.variation+(edit?.versions.drum||0))%4,bassVersion=(s.variation+(edit?.versions.bass||0))%3,chordVersion=edit?.versions.chord||0;
      const activity=activityAt(v,when),velocity=(i%4===0?1:.72)*.65;
      for(const [name,index]of [['kick',0],['snare',1],['clap',2],['hat',3],['open',4]]){
        const fill=name==='kick'&&i===15&&(v?phraseEndsHere(v,start+8*step,start+bar):(b+s.variation)%4===3);
        const accent=name==='kick'&&accents.includes(i)&&!p.snare.includes(i)&&!p.clap.includes(i);
        const rhythm=name==='kick'&&s.style!=='house'&&s.style!=='synth'?[[0,6,8,14],[0,3,8,11],[0,7,10,14],[0,5,8,13]][drumVersion]:name==='hat'&&drumVersion===2?[0,2,3,4,6,8,10,11,12,14]:p[name];
        if(!(rhythm.includes(i)||fill||accent))continue;
        if(v&&name==='hat'&&density>.65&&i%4===2&&(b+s.variation)%2!==0)continue;
        const space=name==='hat'||name==='open'?1-.35*activity*fit:1-.12*activity*fit;
        events.push({kind:'drum',index,when,level:velocity*space,kit:p.kit});
      }
      if(s.style==='trap'&&[3,11].includes(i)&&(v?phraseEndsHere(v,when-step,when+step):(b+s.variation)%4===3)&&when+step/2<duration)events.push({kind:'drum',index:3,when:when+step/2,level:.28,kit:p.kit});
      if((s.style==='house'?[[0,4,8,12],[2,6,10,14],[0,3,8,11]][bassVersion]:[...new Set([...[[0,6,8,14],[0,3,8,11],[0,7,10,14]][bassVersion],...accents])]).includes(i))events.push({kind:'note',note:root+(bassVersion===1&&i>=8?7:bassVersion===2&&i>=12?12:0),when:when+.012,duration:Math.min(step*(s.style==='trap'?3:1.7),duration-when-.012),level:.2*(1-.25*activity*fit),type:s.style==='house'?'triangle':'sine',role:'bass'});
      if(s.harmony&&(s.style==='house'?[2,6,10,14]:[0,8]).includes(i)){
        if(v&&density>.6&&(s.style==='house'?i===6||i===14:i===8))continue;
        const length=Math.min(step*(s.style==='house'?1.5:6),duration-when);
        for(let note=0;note<3;note++){const d=degree+note*2;let midi=48+s.root+scale[d%7]+Math.floor(d/7)*12;const inversion=(Math.floor(b/4)+s.variation+chordVersion)%3;if(note<inversion)midi+=12;events.push({kind:'note',note:midi,when,duration:length,level:.045*(1-.5*activity*fit),type:s.style==='house'||s.style==='synth'?'triangle':'sine',role:'chord'});}
      }
    }
  }
  return applyPartEdits(arrangeDynamics(events,structurePlan(duration,s,v),s),s);
}
export async function generateInstrumental(duration,settings,profile=null,segment=null){
  if(!Number.isFinite(duration)||duration<=0||duration>300.01)throw Error('Поддерживаются песни до 5 минут.');
  const s=validateSettings(settings),start=Math.max(0,segment?.start||0),length=Math.min(duration-start,segment?.length||duration);if(length<=0)throw Error('Пустой фрагмент.');
  const c=new OfflineAudioContext(2,Math.ceil(length*44100),44100),out=c.createGain();out.gain.value=.65;out.connect(c.destination);if(s.samples)await loadSamples(c);
  for(const original of createArrangement(duration,s,profile)){
    if(original.when>=start+length||original.when+(original.duration||.4)<=start)continue;
    const event={...original,when:Math.max(0,original.when-start),duration:original.duration?Math.min(original.duration-Math.max(0,start-original.when),start+length-Math.max(start,original.when)):undefined};
    if(event.kind==='drum'){if(!(s.samples&&sampleDrum(c,out,event.index,event.when,event.level)))trigger(c,out,event.index,event.when,event.level,event.kit);}
    else if(event.kind==='lead'){if(!(s.samples&&sampleNote(c,out,event.instrument,event.note,event.when,event.duration,event.level*.8)))renderLead(c,out,event);}
    else if(!(s.samples&&sampleNote(c,out,event.role==='bass'?'bass':s.style==='lofi'?'epiano':'piano',event.note,event.when,event.duration,event.level*1.8)))tone(c,out,event.note,event.when,event.duration,event.level,event.type);
  }
  const buffer=await c.startRendering(),stats=measure(buffer);if(stats.peak>0)limitPeaks(buffer,Math.min(2,.18/Math.max(.001,stats.rms)),.75);
  if(s.adaptive){let duckProfile=profile;if(start&&profile){const shift=Math.floor(start*profile.rate);duckProfile={...profile,active:profile.active.subarray(shift),duration:length};}duckInstrumental(buffer,duckProfile,s.fit);}return buffer;
}
export function cropAudio(context,buffer,start,length){const first=Math.max(0,Math.round(start*buffer.sampleRate)),n=Math.min(buffer.length-first,Math.round(length*buffer.sampleRate)),out=context.createBuffer(buffer.numberOfChannels,n,buffer.sampleRate);for(let i=0;i<out.numberOfChannels;i++)out.copyToChannel(buffer.getChannelData(i).subarray(first,first+n),i);return out;}
export function remixChoices(settings){const s=validateSettings(settings);return [
 {id:'calm',name:'Спокойный',settings:{...s,character:'calm',swing:.2,melody:s.melody*.75,beat:s.beat*.85}},
 {id:'dense',name:'Плотный',settings:{...s,character:'dense',swing:.06,variation:s.variation+1}},
 {id:'experimental',name:'Экспериментальный',settings:{...s,character:'experimental',swing:.3,variation:s.variation+5,instrument:s.instrument==='auto'?'guitar':s.instrument}}
];}
export function describeStructure(duration,settings,profile){const plan=structurePlan(duration,validateSettings(settings),profile),labels={intro:'Вступление',verse:'Куплет',chorus:'Припев / усиление',break:'Пауза / переход',outro:'Концовка'},segments=[];for(const part of plan){const last=segments.at(-1);if(last?.type===part.type)last.end=part.end;else segments.push({...part,label:labels[part.type]});}return segments;}

export async function mixRemix(vocals,instrumental,settings){
  if(Math.abs(vocals.duration-instrumental.duration)>.02)throw Error('Длины голоса и минуса не совпадают.');
  const s=validateSettings(settings),c=new OfflineAudioContext(2,Math.ceil(vocals.duration*44100),44100),voiceStats=measure(vocals),beatStats=measure(instrumental);
  // Active-window loudness avoids boosting a voice because of long phrase pauses.
  let sum=0,count=0;const a=vocals.getChannelData(0),hop=Math.round(vocals.sampleRate*.05);for(let start=0;start<a.length;start+=hop){let energy=0;const end=Math.min(a.length,start+hop);for(let i=start;i<end;i++)energy+=a[i]*a[i];if(energy/(end-start)>Math.max(1e-7,voiceStats.rms**2*.15)){sum+=energy;count+=end-start;}}
  const activeRMS=Math.sqrt(sum/Math.max(1,count)),voiceLevel=s.polish?Math.max(.1,Math.min(2.5,.085/Math.max(.001,activeRMS))):1,beatLevel=s.polish?Math.max(.1,Math.min(2,.12/Math.max(.001,beatStats.rms))):1;
  for(const [buffer,volume,kind]of [[vocals,s.voice*voiceLevel,'voice'],[instrumental,s.beat*beatLevel,'beat']]){const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain);if(s.polish){const hp=c.createBiquadFilter(),mud=c.createBiquadFilter(),presence=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=kind==='voice'?65:28;mud.type='peaking';mud.frequency.value=kind==='voice'?300:2600;mud.Q.value=kind==='voice'?.8:.7;mud.gain.value=kind==='voice'?-1.8:-2.5;presence.type='highshelf';presence.frequency.value=5500;presence.gain.value=kind==='voice'?1.2:-.7;gain.connect(hp).connect(mud).connect(presence);if(kind==='voice'){const comp=c.createDynamicsCompressor();comp.threshold.value=-22;comp.knee.value=12;comp.ratio.value=2.5;comp.attack.value=.012;comp.release.value=.13;presence.connect(comp).connect(c.destination);}else presence.connect(c.destination);}else gain.connect(c.destination);source.start();}
  const buffer=await c.startRendering(),stats=measure(buffer);limitPeaks(buffer,s.polish&&stats.rms>0?Math.max(.7,Math.min(1.8,.14/stats.rms)):1,.89125094);return buffer;
}
export function melodySelection(duration,settings,profile=null){const s=validateSettings(settings);return composeMelody(s.adaptive&&s.fit>0?profile:null,s,duration);}
