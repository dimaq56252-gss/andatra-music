const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function copyRange(ctx,buffer,from,to){
 const a=clamp(Math.round(from*buffer.sampleRate),0,buffer.length-1),b=clamp(Math.round(to*buffer.sampleRate),a+1,buffer.length);
 const out=ctx.createBuffer(buffer.numberOfChannels,b-a,buffer.sampleRate);
 for(let c=0;c<buffer.numberOfChannels;c++)out.copyToChannel(buffer.getChannelData(c).subarray(a,b),c);
 return out;
}
export function editRange(ctx,buffer,from,to,mode){
 const a=clamp(Math.round(from*buffer.sampleRate),0,buffer.length),b=clamp(Math.round(to*buffer.sampleRate),a,buffer.length);
 if(b<=a)throw Error('Выдели непустой участок дорожки.');
 const out=ctx.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
 for(let c=0;c<buffer.numberOfChannels;c++){
  const source=buffer.getChannelData(c),target=out.getChannelData(c);target.set(source);
  if(mode==='silence'){target.fill(0,a,b);const fade=Math.min(Math.round(buffer.sampleRate*.005),a,buffer.length-b);for(let i=0;i<fade;i++){target[a-fade+i]*=1-i/fade;target[b+i]*=i/fade;}}
  else if(mode==='fadeIn'||mode==='fadeOut')for(let i=a;i<b;i++)target[i]*=mode==='fadeIn'?(i-a)/(b-a):(b-i-1)/(b-a);
  else if(mode==='normalize'){let peak=0;for(let i=a;i<b;i++)peak=Math.max(peak,Math.abs(source[i]));if(peak>0)for(let i=a;i<b;i++)target[i]*=.89/peak;}
 }
 return out;
}
export function makePattern(ctx,{bpm=100,bars=1,steps,note=36}){
 bpm=clamp(Number(bpm)||100,40,240);bars=clamp(Math.round(Number(bars)||1),1,16);
 const rate=44100,step=60/bpm/4,duration=bars*16*step,out=ctx.createBuffer(2,Math.ceil(duration*rate),rate);
 let seed=731;const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 const mono=new Float32Array(out.length);
 for(let bar=0;bar<bars;bar++)for(const role of ['kick','snare','hat','bass'])for(let s=0;s<16;s++){
  if(!steps[role]?.[s])continue;
  const start=Math.round((bar*16+s)*step*rate),length=Math.min(out.length-start,Math.ceil((role==='bass'?step*.9:role==='kick'?.42:role==='snare'?.18:.08)*rate)),freq=440*2**((note-69)/12);let phase=0,last=0;
  for(let i=0;i<length;i++){
   const t=i/rate;let v=0;
   if(role==='kick'){phase+=2*Math.PI*(48+105*Math.exp(-t*35))/rate;v=Math.sin(phase)*Math.exp(-t*13)*.75;}
   if(role==='snare')v=(noise()*.65+Math.sin(2*Math.PI*180*t)*.25)*Math.exp(-t*28)*.48;
   if(role==='hat'){const n=noise();v=(n-last)*Math.exp(-t*65)*.12;last=n;}
   if(role==='bass'){const envelope=Math.min(1,t/.008)*Math.min(1,(length-i)/(rate*.035));v=(Math.sin(2*Math.PI*freq*t)+.16*Math.sin(4*Math.PI*freq*t))*envelope*.38;}
   mono[start+i]+=v;
  }
 }
 let peak=0;for(const n of mono)peak=Math.max(peak,Math.abs(n));const gain=peak>.85?.85/peak:1;
 for(let c=0;c<2;c++){const a=out.getChannelData(c);for(let i=0;i<a.length;i++)a[i]=mono[i]*gain;}
 return out;
}
