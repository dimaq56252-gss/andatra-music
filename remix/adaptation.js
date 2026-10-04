const NOTE_NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];

// Work in a short envelope; never move or stretch the vocal samples.
export function analyzeVocal(buffer){
  const hop=Math.max(1,Math.round(buffer.sampleRate*.02)),rate=buffer.sampleRate/hop;
  const channels=Array.from({length:Math.min(2,buffer.numberOfChannels)},(_,c)=>buffer.getChannelData(c));
  const rms=new Float32Array(Math.ceil(buffer.length/hop));let peak=0;
  for(let i=0;i<rms.length;i++){let sum=0,count=0;for(let j=i*hop;j<Math.min(buffer.length,(i+1)*hop);j+=4)for(const a of channels){const v=a[j];if(!Number.isFinite(v))throw Error('Некорректный звук в вокале.');sum+=v*v;count++;}rms[i]=Math.sqrt(sum/Math.max(1,count));peak=Math.max(peak,rms[i]);}
  const sorted=Array.from(rms).sort((a,b)=>a-b),floor=sorted[Math.floor(sorted.length*.15)]||0;
  const threshold=Math.max(1e-5,Math.min(peak*.18,Math.max(peak*.065,floor*2.5)));
  const raw=Array.from(rms,v=>v>threshold?1:0),active=new Float32Array(raw.length);
  // Bridge tiny gaps between syllables, leaving phrase pauses intact.
  for(let i=0;i<raw.length;){if(raw[i]){i++;continue;}const start=i;while(i<raw.length&&!raw[i])i++;if(start>0&&i<raw.length&&i-start<=5)for(let j=start;j<i;j++)raw[j]=1;}
  let envelope=0;const phrases=[],accents=[];
  for(let i=0;i<raw.length;i++){
    const target=raw[i],alpha=1-Math.exp(-1/(rate*(target>envelope?.035:.18)));envelope+=(target-envelope)*alpha;active[i]=envelope;
    if(target&&(i===0||!raw[i-1])){let end=i;while(end<raw.length&&raw[end])end++;if((end-i)/rate>=.12)phrases.push({start:i/rate,end:Math.min(buffer.duration,end/rate)});}
    const rise=Math.max(0,rms[i]-(rms[i-2]||0));if(raw[i]&&rise>peak*.045&&(accents.length===0||i/rate-accents.at(-1).time>.1))accents.push({time:i/rate,weight:Math.min(1,rise/Math.max(peak*.3,1e-6))});
  }
  const pitches=findPitches(buffer,rms,threshold,hop),key=pitchKey(pitches);
  return {rate,active,rms,peak,threshold,phrases,accents,pitches,key,duration:buffer.duration};
}

function findPitches(buffer,rms,threshold,hop){
  const down=Math.max(1,Math.round(buffer.sampleRate/8000)),sr=buffer.sampleRate/down,size=512;
  const arrays=Array.from({length:Math.min(2,buffer.numberOfChannels)},(_,c)=>buffer.getChannelData(c)),pitches=[];
  const count=Math.min(240,Math.max(1,Math.floor(buffer.duration/.2))),window=new Float64Array(size);
  for(let part=0;part<count;part++){
    const time=(part+.5)*buffer.duration/count,start=Math.round(time*buffer.sampleRate)-Math.floor(size*down/2);
    if(start<0||start+(size-1)*down>=buffer.length||rms[Math.floor(time*buffer.sampleRate/hop)]<threshold*1.5)continue;
    let mean=0;for(let i=0;i<size;i++){let v=0;for(const a of arrays)v+=a[start+i*down]/arrays.length;window[i]=v;mean+=v;}mean/=size;for(let i=0;i<size;i++)window[i]-=mean;
    const lo=Math.ceil(sr/750),hi=Math.floor(sr/80),scores=new Float64Array(hi+1);let best=0,bestLag=0;
    for(let lag=lo;lag<=hi;lag++){let sum=0,a=0,b=0;for(let i=0;i<size-lag;i++){sum+=window[i]*window[i+lag];a+=window[i]*window[i];b+=window[i+lag]*window[i+lag];}scores[lag]=sum/Math.sqrt(a*b+1e-15);if(scores[lag]>best){best=scores[lag];bestLag=lag;}}
    if(best<.78)continue;
    for(let lag=lo+1;lag<hi;lag++)if(scores[lag]>=best*.94&&scores[lag]>scores[lag-1]&&scores[lag]>=scores[lag+1]){bestLag=lag;break;}
    const left=scores[bestLag-1]||best,right=scores[bestLag+1]||best,denom=left-2*scores[bestLag]+right;
    const precise=bestLag+(Math.abs(denom)>1e-6?Math.max(-.5,Math.min(.5,.5*(left-right)/denom)):0);
    const midi=69+12*Math.log2((sr/precise)/440);pitches.push({time,note:((Math.round(midi)%12)+12)%12,weight:best});
  }
  return pitches;
}

function pitchKey(pitches){
  if(pitches.length<8)return null;
  const chroma=new Float64Array(12);for(const p of pitches)chroma[p.note]+=p.weight;const total=chroma.reduce((a,b)=>a+b,0);
  // Speech can have a stable pitch without implying a musical key.
  if(Array.from(chroma).filter(v=>v/total>.08).length<3)return null;
  const profiles={major:[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],minor:[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17]},candidates=[];
  for(const [mode,p]of Object.entries(profiles))for(let root=0;root<12;root++){
    const pm=p.reduce((a,b)=>a+b,0)/12,mean=total/12;let sum=0,a=0,b=0;
    for(let i=0;i<12;i++){const x=chroma[(root+i)%12]-mean,y=p[i]-pm;sum+=x*y;a+=x*x;b+=y*y;}
    const score=sum/Math.sqrt(a*b+1e-9);candidates.push({root,mode,score,label:NOTE_NAMES[root]+(mode==='minor'?' minor':' major')});
  }
  candidates.sort((a,b)=>b.score-a.score);const key=candidates[0];return key.score>.5&&key.score-candidates[1].score>.035?key:null;
}

export function activityAt(profile,time){if(!profile||time<0||time>=profile.duration)return 0;const i=Math.floor(time*profile.rate);return profile.active[Math.min(i,profile.active.length-1)]||0;}
export function barActivity(profile,start,length){if(!profile)return 0;let sum=0;for(let i=0;i<16;i++)sum+=activityAt(profile,start+length*(i+.5)/16);return sum/16;}
export function alignVocalBeat(profile,bpm,originalOffset=0,standalone=false){
  if(!profile.accents.length)return originalOffset;
  const beat=60/bpm,step=beat/4,range=standalone?beat/2:Math.min(.12,step/2);let best=originalOffset,bestScore=-Infinity;
  for(let j=-20;j<=20;j++){
    const candidate=originalOffset+j*range/20;let score=0;
    for(const a of profile.accents){const tick=(a.time-candidate)/step,dist=Math.abs(tick-Math.round(tick));const pulse=(a.time-candidate)/beat,beatDist=Math.abs(pulse-Math.round(pulse));score+=a.weight*(.6*Math.exp(-dist*dist/.06)+.4*Math.exp(-beatDist*beatDist/.035));}
    score-=Math.abs(j)/20*.05;
    if(score>bestScore){bestScore=score;best=candidate;}
  }
  return Math.max(-2,Math.min(4,best));
}
export function vocalAccentSteps(profile,start,step){
  if(!profile)return [];
  const scores=new Map();for(const a of profile.accents)if(a.time>=start&&a.time<start+step*16){const i=Math.round((a.time-start)/step);if(i<16)scores.set(i,(scores.get(i)||0)+a.weight);}
  return [...scores].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([i])=>i);
}
export function phraseEndsHere(profile,start,end){return !!profile?.phrases.some(p=>p.end>=start&&p.end<end);}
export function fitChordDegree(profile,start,bar,root,scale,fallback){
  if(!profile?.key)return fallback;
  const notes=profile.pitches.filter(p=>p.time>=start&&p.time<start+bar);if(notes.length<2)return fallback;
  const score=degree=>{const chord=[0,2,4].map(n=>(root+scale[(degree+n)%7])%12);return notes.reduce((v,p)=>v+(chord.includes(p.note)?p.weight:0),0)/notes.length;};
  let degree=fallback,best=score(fallback);for(const d of [0,3,4,5]){const value=score(d);if(value>best+.18){degree=d;best=value;}}return degree;
}
export function duckInstrumental(buffer,profile,strength){
  if(!profile||!strength)return buffer;
  const amount=Math.max(0,Math.min(1,strength)),arrays=Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c));
  // Interpolate the slow envelope sample by sample; keep both channels linked.
  for(let i=0;i<buffer.length;i++){const position=i/buffer.sampleRate*profile.rate,k=Math.floor(position),fraction=position-k;
    const activity=(profile.active[k]||0)*(1-fraction)+(profile.active[k+1]??profile.active[k]??0)*fraction;
    const gain=10**(-6*amount*activity/20);for(const a of arrays)a[i]*=gain;
  }
  return buffer;
}
