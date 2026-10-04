import {trigger} from '../drumpad/audio.js';
import {limitPeaks,measure} from '../audio-processing.js';
export const STYLES={rap:{name:'Рэп',kit:'classic',kick:[0,6,8,14],snare:[4,12],clap:[],hat:[0,2,4,6,8,10,12,14],open:[15]},trap:{name:'Трэп',kit:'trap',kick:[0,7,10],snare:[8],clap:[8],hat:[0,2,4,6,7,8,10,12,14,15],open:[11]},house:{name:'Хаус',kit:'electro',kick:[0,4,8,12],snare:[],clap:[4,12],hat:[2,6,10,14],open:[2,10]}};
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
  return {style:STYLES[s.style]?s.style:'rap',bpm:num(s.bpm,40,240,100),offset:num(s.offset,-2,4,0),root:Math.round(num(s.root,0,11,9)),mode:s.mode==='major'?'major':'minor',variation:Math.round(num(s.variation,0,9999,0)),harmony:s.harmony!==false,voice:num(s.voice,0,1.5,1),beat:num(s.beat,0,1.5,.7)};
}
const frequency=note=>440*2**((note-69)/12);
function tone(context,out,note,when,duration,level,type='sine'){
  if(when<0||duration<.01)return;
  const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=frequency(note);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.0001,level),when+Math.min(.018,duration*.25));g.gain.exponentialRampToValueAtTime(Math.max(.0001,level*.6),when+duration*.65);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g).connect(out);o.start(when);o.stop(when+duration+.01);
}
export async function generateInstrumental(duration,settings){
  if(!Number.isFinite(duration)||duration<=0||duration>300.01)throw Error('Поддерживаются песни до 5 минут.');
  const s=validateSettings(settings),c=new OfflineAudioContext(2,Math.ceil(duration*44100),44100),out=c.createGain();out.gain.value=.65;out.connect(c.destination);
  const p=STYLES[s.style],step=60/s.bpm/4,bar=step*16,scale=s.mode==='minor'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11],progression=s.variation%2?[0,3,5,4]:[0,5,3,6];
  for(let b=Math.floor(-s.offset/bar)-1;b*bar+s.offset<duration;b++){
    const start=s.offset+b*bar,degree=progression[((b%4)+4)%4],root=36+s.root+scale[degree];
    for(let i=0;i<16;i++){
      const when=start+i*step;if(when<0||when>=duration)continue;
      const velocity=(i%4===0?1:.72)*.65;
      for(const [name,index]of [['kick',0],['snare',1],['clap',2],['hat',3],['open',4]]){
        const extra=name==='kick'&&((b+s.variation)%4===3)&&i===15;
        if(p[name].includes(i)||extra)trigger(c,out,index,when,velocity,p.kit);
      }
      if(s.style==='trap'&&((b+s.variation)%4===3)&&[3,11].includes(i))trigger(c,out,3,when+step/2,.28,p.kit);
      if((s.style==='house'?[0,4,8,12]:p.kick).includes(i))tone(c,out,root,when+.012,Math.min(step*(s.style==='trap'?3:1.7),duration-when-.012),.2,s.style==='house'?'triangle':'sine');
      if(s.harmony&&(s.style==='house'?[2,6,10,14]:[0,8]).includes(i)){
        const length=Math.min(step*(s.style==='house'?1.5:6),duration-when);
        for(let note=0;note<3;note++){const d=degree+note*2,midi=60+s.root+scale[d%7]+Math.floor(d/7)*12;tone(c,out,midi,when,length,.045,s.style==='house'?'triangle':'sine');}
      }
    }
  }
  const buffer=await c.startRendering(),stats=measure(buffer);if(stats.peak>0)limitPeaks(buffer,Math.min(2,.18/Math.max(.001,stats.rms)),.75);return buffer;
}
export async function mixRemix(vocals,instrumental,settings){
  if(Math.abs(vocals.duration-instrumental.duration)>.02)throw Error('Длины голоса и минуса не совпадают.');
  const s=validateSettings(settings),c=new OfflineAudioContext(2,Math.ceil(vocals.duration*44100),44100);
  for(const [buffer,volume]of [[vocals,s.voice],[instrumental,s.beat]]){const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;gain.gain.value=volume;source.connect(gain).connect(c.destination);source.start();}
  const buffer=await c.startRendering();limitPeaks(buffer,1,.89125094);return buffer;
}
