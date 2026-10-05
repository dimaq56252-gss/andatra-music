// Reject sustained periodic signals; this is a failure check, not a music-quality score.
export function validateGeneratedAudio(buffer, requestedSeconds) {
 if(!buffer||buffer.duration<requestedSeconds-.5)throw Error('Движок вернул слишком короткий звук.');
 let peak=0;
 for(let c=0;c<buffer.numberOfChannels;c++)for(const value of buffer.getChannelData(c)){
  if(!Number.isFinite(value))throw Error('Модель вернула повреждённый звук.');
  peak=Math.max(peak,Math.abs(value));
 }
 if(peak<1e-5)throw Error('Модель вернула тишину.');
 const source=buffer.getChannelData(0),stride=Math.max(1,Math.round(buffer.sampleRate/12000));
 const size=4096,maxLag=Math.floor(buffer.sampleRate/stride/100),windows=[];
 for(const fraction of [.1,.35,.6,.85]){
  const start=Math.min(Math.floor(source.length*fraction),source.length-(size+maxLag)*stride);
  if(start<0)return;
  const values=new Float32Array(size+maxLag);let energy=0;
  for(let i=0;i<values.length;i++)values[i]=source[start+i*stride];
  for(let i=0;i<size;i++)energy+=values[i]*values[i];
  if(energy/size<1e-8)return;
  windows.push({values,energy});
 }
 for(let lag=Math.max(3,Math.floor(buffer.sampleRate/stride/2500));lag<=maxLag;lag++){
  if(windows.every(({values,energy})=>{
   let difference=0;
   for(let i=0;i<size;i++){const d=values[i+lag]-values[i];difference+=d*d;}
   return difference/energy<.003;
  }))throw Error('Модель выдала постоянный сигнал вместо инструментала. Результат отклонён. Это сбой генерации, а не готовая музыка.');
 }
}
